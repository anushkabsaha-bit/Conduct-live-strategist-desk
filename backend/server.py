import os
import json
import asyncio
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

import agents as A
import seed as S
from dataset import POSTS, dataset_summary

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
app = FastAPI(title="Conduct Communications Strategist Desk")
api = APIRouter(prefix="/api")
log = logging.getLogger("desk")

COLLS = {"calendar", "tasks", "drafts", "stories", "campaigns", "opportunities", "sources", "decisions", "projects", "handoffs", "workspaces"}
REF_COLL = {"draft": "drafts", "story": "stories", "campaign": "campaigns", "opportunity": "opportunities", "project": "projects", "block": "calendar", "task": "tasks", "workspace": "workspaces"}
NOPROJ = {"_id": 0}


def now():
    return datetime.now(timezone.utc).isoformat()


def check(coll):
    if coll not in COLLS:
        raise HTTPException(404, "Unknown collection")


@app.on_event("startup")
async def startup():
    for c in COLLS | {"runs", "messages", "prompt_revisions"}:
        await db[c].create_index("id")
    await db.runs.create_index([("ref_type", 1), ("ref_id", 1), ("task", 1)])
    await db.messages.create_index([("agent", 1), ("created_at", 1)])
    if await db.meta.find_one({"k": "seeded"}):
        return
    monday = S.week_monday()
    await db.calendar.insert_many(S.calendar_blocks(monday))
    await db.tasks.insert_many(S.tasks(monday))
    await db.drafts.insert_many(S.drafts())
    await db.stories.insert_many(S.stories())
    await db.campaigns.insert_many(S.campaigns())
    await db.opportunities.insert_many(S.opportunities())
    lens = {a: len(A.original_prompt(a)) for a in A.AGENTS}
    await db.sources.insert_many(S.sources(lens, len(POSTS)))
    await db.meta.insert_one({"k": "seeded", "at": now()})


@api.get("/")
async def root():
    return {"app": "Conduct Communications Strategist Desk", "llm": "configured" if os.environ.get("EMERGENT_LLM_KEY") else "missing",
            "web_research": "not_configured"}


# ---------- generic CRUD ----------
@api.get("/c/{coll}")
async def list_items(coll: str):
    check(coll)
    return await db[coll].find({}, NOPROJ).sort("created_at", -1).to_list(1000)


@api.get("/c/{coll}/{item_id}")
async def get_item(coll: str, item_id: str):
    check(coll)
    doc = await db[coll].find_one({"id": item_id}, NOPROJ)
    if not doc:
        raise HTTPException(404, "Not found")
    return doc


@api.post("/c/{coll}")
async def create_item(coll: str, body: dict = Body(...)):
    check(coll)
    body.pop("_id", None)
    body["id"] = str(uuid.uuid4())
    body["created_at"] = now()
    body["updated_at"] = now()
    await db[coll].insert_one(dict(body))
    return body


@api.put("/c/{coll}/{item_id}")
async def update_item(coll: str, item_id: str, body: dict = Body(...)):
    check(coll)
    for k in ("_id", "id", "created_at"):
        body.pop(k, None)
    body["updated_at"] = now()
    res = await db[coll].update_one({"id": item_id}, {"$set": body})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return await db[coll].find_one({"id": item_id}, NOPROJ)


@api.delete("/c/{coll}/{item_id}")
async def delete_item(coll: str, item_id: str):
    check(coll)
    await db[coll].delete_one({"id": item_id})
    return {"ok": True}


# ---------- drafts: versions ----------
@api.post("/drafts/{draft_id}/versions")
async def add_version(draft_id: str, body: dict = Body(...)):
    d = await db.drafts.find_one({"id": draft_id}, NOPROJ)
    if not d:
        raise HTTPException(404, "Draft not found")
    v = {"n": len(d["versions"]) + 1, "text": body["text"], "note": body.get("note", ""), "source": body.get("source", "user"),
         "accepted": body.get("accepted", []), "rejected": body.get("rejected", []), "created_at": now()}
    await db.drafts.update_one({"id": draft_id}, {"$push": {"versions": v}, "$set": {"updated_at": now()}})
    return v


@api.get("/search")
async def search(q: str):
    rx = {"$regex": q, "$options": "i"}
    out = []
    for coll, f in [("tasks", "title"), ("drafts", "title"), ("stories", "title"), ("campaigns", "name"), ("opportunities", "name"), ("workspaces", "name"), ("projects", "name"), ("calendar", "title")]:
        for d in await db[coll].find({f: rx}, {"_id": 0, "id": 1, f: 1, "room": 1}).to_list(8):
            out.append({"coll": coll, "id": d["id"], "label": d[f], "room": d.get("room")})
    return out


# ---------- dataset & agents ----------
@api.get("/dataset/posts")
async def posts():
    return {"posts": POSTS, "summary": dataset_summary()}


@api.get("/sources/growth-os")
async def growth_os():
    return {"text": A.growth_os_text(), "source": "Conduct@growth generalist.pdf"}


async def active_revision(agent_id):
    r = await db.prompt_revisions.find_one({"agent": agent_id, "active": True}, NOPROJ)
    return r["text"] if r else None


@api.get("/agents")
async def list_agents():
    out = []
    for k, v in A.AGENTS.items():
        rev = await active_revision(k)
        out.append({"id": k, **{x: v[x] for x in ("name", "title", "color", "summary", "can")}, "prompt_chars": len(A.original_prompt(k)), "has_revision": bool(rev)})
    return out


@api.get("/agents/{agent_id}/prompt")
async def agent_prompt(agent_id: str):
    if agent_id not in A.AGENTS:
        raise HTTPException(404, "Unknown agent")
    revs = await db.prompt_revisions.find({"agent": agent_id}, NOPROJ).sort("created_at", -1).to_list(50)
    return {"original": A.original_prompt(agent_id), "application_layer": A.COMMON_LAYER + "\n\n" + A.AGENT_LAYERS[agent_id], "revisions": revs}


@api.post("/agents/{agent_id}/revisions")
async def add_revision(agent_id: str, body: dict = Body(...)):
    await db.prompt_revisions.update_many({"agent": agent_id}, {"$set": {"active": False}})
    rev = {"id": str(uuid.uuid4()), "agent": agent_id, "text": body.get("text", ""), "active": bool(body.get("text")), "created_at": now()}
    await db.prompt_revisions.insert_one(dict(rev))
    rev.pop("_id", None)
    return rev


@api.get("/agents/{agent_id}/messages")
async def messages(agent_id: str):
    return await db.messages.find({"agent": agent_id}, NOPROJ).sort("created_at", 1).to_list(500)


@api.delete("/agents/{agent_id}/messages")
async def clear_messages(agent_id: str):
    await db.messages.delete_many({"agent": agent_id})
    return {"ok": True}


# ---------- context builders ----------
def trim(obj, n=3500):
    s = json.dumps(obj, ensure_ascii=False, default=str)
    return s if len(s) <= n else s[:n] + "…(truncated)"


async def shared_context(ref_type, ref_id):
    if not ref_type or not ref_id:
        return "", None
    item = await db[REF_COLL[ref_type]].find_one({"id": ref_id}, NOPROJ)
    if not item:
        return "", None
    view = dict(item)
    if ref_type == "draft":
        cur = item["versions"][-1]
        view["versions"] = f"{len(item['versions'])} versions; current is v{cur['n']}"
        view["CURRENT_TEXT"] = cur["text"]
        view["CURRENT_WORD_COUNT"] = len(cur["text"].split())
    runs = await db.runs.find({"ref_type": ref_type, "ref_id": ref_id, "status": "ok"}, NOPROJ).sort("created_at", -1).to_list(30)
    latest = {}
    for r in runs:
        latest.setdefault(r["task"], r)
    findings = "\n".join(f"- {r['task']} by {r['agent'].upper()} at {r['created_at'][:16]}: {trim(r['output'], 3000)}" for r in latest.values()) or "- none recorded yet"
    decisions = await db.decisions.find({"ref_id": ref_id}, NOPROJ).to_list(20)
    txt = f"=== RECORD ({ref_type}) ===\n{trim(view, 6000)}\n\n=== SHARED CONTEXT: findings recorded by the app for this record ===\n{findings}"
    if decisions:
        txt += "\n\n=== DECISIONS by Anushka ===\n" + trim([{k: d.get(k) for k in ('choice', 'note', 'created_at')} for d in decisions], 1500)
    return txt, item


async def desk_state():
    today = datetime.now(timezone.utc).date()
    wd = today.weekday()
    cal = await db.calendar.find({}, NOPROJ).to_list(500)
    todays = [c for c in cal if c["date"] == today.isoformat() or (c.get("recurrence") == "weekly" and datetime.fromisoformat(c["date"]).weekday() == wd and c["date"] <= today.isoformat())]
    tasks = await db.tasks.find({"status": {"$ne": "done"}}, NOPROJ).to_list(100)
    drafts = await db.drafts.find({}, {"_id": 0, "versions": 0}).to_list(50)
    stories = await db.stories.find({}, {"_id": 0, "title": 1, "stage": 1, "id": 1}).to_list(50)
    opps = await db.opportunities.find({}, {"_id": 0, "id": 1, "name": 1, "verification": 1, "status": 1, "start_date": 1, "deadline": 1, "market": 1, "type": 1, "relevance": 1, "source_url": 1, "notes": 1}).to_list(100)
    camps = await db.campaigns.find({}, {"_id": 0, "name": 1, "status": 1, "decision": 1}).to_list(50)
    runs = await db.runs.find({"status": "ok"}, {"_id": 0, "task": 1, "agent": 1, "created_at": 1, "ref_type": 1}).sort("created_at", -1).to_list(10)
    slim = lambda xs, keys: [{k: x.get(k) for k in keys} for x in xs]
    return (f"=== DESK STATE (today {today.isoformat()}, {today.strftime('%A')}) — all calendar blocks and tasks are ILLUSTRATIVE unless stated ===\n"
            f"TODAY'S BLOCKS: {trim(slim(todays, ['title','start','end','category','purpose','status','agents']), 3000)}\n"
            f"OPEN TASKS: {trim(slim(tasks, ['title','agent','due','importance','kind','why','status']), 3000)}\n"
            f"DRAFTS: {trim(slim(drafts, ['title','format','status','objective']), 1200)}\n"
            f"STORIES: {trim(stories, 1000)}\nCAMPAIGNS: {trim(camps, 600)}\nOPPORTUNITIES: {trim(opps, 4000)}\n"
            f"RECENT AGENT RUNS (actually executed): {trim(runs, 1200)}")


# ---------- structured runs ----------
@api.post("/run")
async def run_task(body: dict = Body(...)):
    task = body.get("task")
    if task not in A.TASKS:
        raise HTTPException(400, "Unknown task")
    agent = A.TASKS[task][0]
    ref_type, ref_id, extra = body.get("ref_type"), body.get("ref_id"), body.get("input") or {}
    ctx, item = await shared_context(ref_type, ref_id)
    parts = [ctx] if ctx else []
    if task.startswith("ana.") or task in ("catherine.campaign_events", "catherine.launch_opportunities"):
        parts.append(await desk_state())
    if task == "ana.prioritise_opportunities":
        ids = extra.get("opportunity_ids") or []
        q = {"id": {"$in": ids}} if ids else {"status": {"$ne": "rejected"}}
        parts.append("=== OPPORTUNITIES TO RANK ===\n" + trim(await db.opportunities.find(q, NOPROJ).to_list(50), 8000))
    if extra:
        parts.append("=== INPUT FROM ANUSHKA ===\n" + trim(extra, 3000))
    snapshot = {"version": item["versions"][-1]["n"]} if ref_type == "draft" and item else {}
    system = A.build_system(agent, await active_revision(agent))
    run = {"id": str(uuid.uuid4()), "task": task, "agent": agent, "ref_type": ref_type, "ref_id": ref_id, "input": extra, "snapshot": snapshot,
           "status": "running", "output": {}, "created_at": now()}
    await db.runs.insert_one(dict(run))
    asyncio.create_task(execute_run(run["id"], system, A.task_prompt(task, "\n\n".join(parts))))
    return run


async def execute_run(run_id, system, prompt):
    upd, raw = {}, ""
    try:
        for attempt in range(2):  # one automatic retry if the model returns malformed JSON
            raw = await A.llm_complete(system, prompt, f"run-{run_id}-{attempt}")
            try:
                upd = {"output": A.parse_json(raw), "status": "ok", "attempts": attempt + 1}
                break
            except json.JSONDecodeError:
                if attempt:
                    raise
    except json.JSONDecodeError:
        upd = {"status": "error", "error": "The agent returned output that could not be parsed. Please retry.", "raw": raw[:6000]}
    except Exception as e:  # LLM/network failure surfaced honestly
        log.exception("run failed")
        upd = {"status": "error", "error": str(e)[:500]}
    upd["finished_at"] = now()
    await db.runs.update_one({"id": run_id}, {"$set": upd})


@api.get("/runs/{run_id}")
async def get_run(run_id: str):
    r = await db.runs.find_one({"id": run_id}, NOPROJ)
    if not r:
        raise HTTPException(404, "Run not found")
    return r


@api.get("/runs")
async def list_runs(ref_type: str = None, ref_id: str = None, task: str = None, agent: str = None, limit: int = 50):
    q = {k: v for k, v in {"ref_type": ref_type, "ref_id": ref_id, "task": task, "agent": agent}.items() if v}
    q["status"] = "ok"
    return await db.runs.find(q, NOPROJ).sort("created_at", -1).to_list(limit)


@api.delete("/runs/{run_id}")
async def delete_run(run_id: str):
    await db.runs.delete_one({"id": run_id})
    return {"ok": True}


# ---------- chat (streaming) ----------
@api.post("/agents/{agent_id}/chat")
async def chat(agent_id: str, body: dict = Body(...)):
    if agent_id not in A.AGENTS:
        raise HTTPException(404, "Unknown agent")
    text = (body.get("message") or "").strip()
    if not text:
        raise HTTPException(400, "Empty message")
    ref_type, ref_id = body.get("ref_type"), body.get("ref_id")
    ctx, _ = await shared_context(ref_type, ref_id)
    hist = await db.messages.find({"agent": agent_id}, NOPROJ).sort("created_at", -1).to_list(12)
    transcript = "\n".join(f"{m['role'].upper()}: {m['text'][:2500]}" for m in reversed(hist))
    extra = await desk_state() if agent_id == "ana" else ""
    prompt = "\n\n".join(x for x in [ctx, extra, f"=== CONVERSATION SO FAR ===\n{transcript}" if transcript else "", f"ANUSHKA: {text}",
                                       "Reply conversationally in your own voice. Use short headed sections where useful. Label claims as instructed."] if x)
    user_msg = {"id": str(uuid.uuid4()), "agent": agent_id, "role": "user", "text": text, "ref_type": ref_type, "ref_id": ref_id,
                "handoff_from": body.get("handoff_from"), "created_at": now()}
    await db.messages.insert_one(dict(user_msg))
    system = A.build_system(agent_id, await active_revision(agent_id))
    q: asyncio.Queue = asyncio.Queue()

    async def produce():
        out = ""
        try:
            async for chunk in A.llm_stream(system, prompt, f"chat-{agent_id}-{user_msg['id']}"):
                out += chunk
                await q.put({"delta": chunk})
            msg = {"id": str(uuid.uuid4()), "agent": agent_id, "role": "assistant", "text": out, "ref_type": ref_type, "ref_id": ref_id, "created_at": now()}
            await db.messages.insert_one(dict(msg))
            await q.put({"done": True, "id": msg["id"]})
        except Exception as e:
            log.exception("chat failed")
            await q.put({"error": str(e)[:300]})

    # Runs independently of the HTTP connection so the reply is saved even if the user navigates away.
    asyncio.create_task(produce())

    async def gen():
        while True:
            ev = await q.get()
            yield f"data: {json.dumps(ev)}\n\n"
            if "done" in ev or "error" in ev:
                break

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","), allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown():
    client.close()
