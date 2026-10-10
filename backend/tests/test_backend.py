"""Backend tests for Conduct Communications Strategist Desk.

Covers: generic CRUD, draft versions, dataset endpoint, agents (list/prompt/revisions),
async /run + polling /runs/{id}, chat SSE, error handling.

LLM tasks are slow (30-120s) and burn credits -> we run only a small, focused
set as requested by the main agent.
"""
import os
import json
import time
import uuid
import requests
import pytest
from pathlib import Path


def _load_frontend_url():
    env = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    for line in env.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError("REACT_APP_BACKEND_URL not found")


BASE = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_url()).rstrip("/")
API = f"{BASE}/api"


# ---------- root / meta ----------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    d = r.json()
    assert d["llm"] == "configured"
    assert d["web_research"] == "not_configured"


# ---------- generic CRUD ----------
COLLS = ["calendar", "tasks", "drafts", "stories", "campaigns", "opportunities", "sources", "decisions", "projects", "handoffs"]


@pytest.mark.parametrize("coll", COLLS)
def test_list_collection(coll):
    r = requests.get(f"{API}/c/{coll}")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    for item in data:
        assert "_id" not in item


def test_unknown_collection_404():
    r = requests.get(f"{API}/c/notarealcoll")
    assert r.status_code == 404


def test_crud_roundtrip_tasks():
    create = {"title": "TEST_task", "status": "open", "agent": "ana", "importance": "high"}
    r = requests.post(f"{API}/c/tasks", json=create)
    assert r.status_code == 200, r.text
    item = r.json()
    tid = item["id"]
    assert item["title"] == "TEST_task"

    # GET
    r = requests.get(f"{API}/c/tasks/{tid}")
    assert r.status_code == 200 and r.json()["title"] == "TEST_task"

    # PUT
    r = requests.put(f"{API}/c/tasks/{tid}", json={"status": "done"})
    assert r.status_code == 200 and r.json()["status"] == "done"

    # DELETE
    r = requests.delete(f"{API}/c/tasks/{tid}")
    assert r.status_code == 200
    r = requests.get(f"{API}/c/tasks/{tid}")
    assert r.status_code == 404


# ---------- draft versions ----------
def test_draft_versions_append():
    drafts = requests.get(f"{API}/c/drafts").json()
    assert drafts, "No seeded drafts"
    d = drafts[0]
    before = len(d["versions"])
    r = requests.post(f"{API}/drafts/{d['id']}/versions", json={"text": "TEST_version body", "note": "test"})
    assert r.status_code == 200, r.text
    v = r.json()
    assert v["n"] == before + 1
    # Verify persistence and original preserved
    d2 = requests.get(f"{API}/c/drafts/{d['id']}").json()
    assert len(d2["versions"]) == before + 1
    assert d2["versions"][0]["n"] == 1  # original kept


def test_draft_versions_missing_draft_404():
    r = requests.post(f"{API}/drafts/does-not-exist/versions", json={"text": "x"})
    assert r.status_code == 404


# ---------- dataset ----------
def test_dataset_posts():
    r = requests.get(f"{API}/dataset/posts")
    assert r.status_code == 200
    d = r.json()
    assert len(d["posts"]) == 38
    s = d["summary"]
    # Expected likes sum per problem statement = 7079
    assert s.get("likes_sum") == 7079, f"likes_sum={s.get('likes_sum')}"


# ---------- agents ----------
def test_list_agents():
    r = requests.get(f"{API}/agents")
    assert r.status_code == 200
    agents = r.json()
    ids = {a["id"] for a in agents}
    assert ids == {"ana", "agatha", "berdine", "catherine", "diana", "edith"}
    for a in agents:
        assert a["prompt_chars"] > 100  # original prompt should be long


def test_agent_prompt_and_revision():
    r = requests.get(f"{API}/agents/ana/prompt")
    assert r.status_code == 200
    d = r.json()
    orig_len = len(d["original"])
    assert orig_len > 500
    assert "APPLICATION LAYER" in d["application_layer"]

    # Add revision
    rev_txt = "TEST_revision marker " + uuid.uuid4().hex
    r = requests.post(f"{API}/agents/ana/revisions", json={"text": rev_txt})
    assert r.status_code == 200
    rev = r.json()
    assert rev["active"] is True

    # Original unchanged
    r2 = requests.get(f"{API}/agents/ana/prompt")
    d2 = r2.json()
    assert len(d2["original"]) == orig_len
    assert d2["original"] == d["original"]
    assert any(x.get("text") == rev_txt for x in d2["revisions"])

    # Deactivate by posting empty revision
    requests.post(f"{API}/agents/ana/revisions", json={"text": ""})


def test_unknown_agent_prompt_404():
    r = requests.get(f"{API}/agents/nobody/prompt")
    assert r.status_code == 404


# ---------- runs ----------
def _wait_run(run_id, timeout=140):
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = requests.get(f"{API}/runs/{run_id}")
        assert r.status_code == 200
        d = r.json()
        if d["status"] in ("ok", "error"):
            return d
        time.sleep(3)
    pytest.fail(f"Run {run_id} did not complete in {timeout}s")


def test_run_unknown_task_400():
    r = requests.post(f"{API}/run", json={"task": "no.such.task"})
    assert r.status_code == 400


def test_run_ana_briefing():
    """One LLM run - no ref. Verifies async pattern + JSON output shape."""
    r = requests.post(f"{API}/run", json={"task": "ana.briefing"})
    assert r.status_code == 200
    run = r.json()
    assert run["status"] == "running"
    assert run["agent"] == "ana"
    done = _wait_run(run["id"])
    assert done["status"] == "ok", f"error={done.get('error')} raw={done.get('raw','')[:400]}"
    out = done["output"]
    assert "priorities" in out and isinstance(out["priorities"], list)
    assert "briefing" in out


def test_run_catherine_assess_opportunity():
    """One LLM run - with ref. Verifies shared_context + ref flow."""
    opps = requests.get(f"{API}/c/opportunities").json()
    assert opps, "No seeded opportunities"
    opp = opps[0]
    r = requests.post(f"{API}/run", json={"task": "catherine.assess", "ref_type": "opportunity", "ref_id": opp["id"]})
    assert r.status_code == 200
    run_id = r.json()["id"]
    done = _wait_run(run_id)
    assert done["status"] == "ok", done.get("error")
    assert "verdict" in done["output"]


# ---------- chat SSE ----------
def test_chat_stream_and_persist():
    agent = "berdine"
    # Clear history for a clean assertion
    requests.delete(f"{API}/agents/{agent}/messages")
    r = requests.post(f"{API}/agents/{agent}/chat", json={"message": "Say the single word: hello."}, stream=True, timeout=120)
    assert r.status_code == 200
    assert "text/event-stream" in r.headers.get("content-type", "")
    saw_delta = False
    saw_done = False
    assembled = ""
    for line in r.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data: "):
            continue
        ev = json.loads(line[6:])
        if "delta" in ev:
            saw_delta = True
            assembled += ev["delta"]
        if "done" in ev:
            saw_done = True
            break
        if "error" in ev:
            pytest.fail(f"Chat error: {ev['error']}")
    assert saw_delta and saw_done
    assert len(assembled) > 0

    # Verify persistence (give the writer a tick)
    time.sleep(1.5)
    msgs = requests.get(f"{API}/agents/{agent}/messages").json()
    roles = [m["role"] for m in msgs]
    assert "user" in roles and "assistant" in roles


def test_chat_empty_message_400():
    r = requests.post(f"{API}/agents/ana/chat", json={"message": "   "})
    assert r.status_code == 400


def test_chat_unknown_agent_404():
    r = requests.post(f"{API}/agents/nope/chat", json={"message": "hi"})
    assert r.status_code == 404
