"""Iter9: Portfolio protection — visitor vs owner enforcement, draft copy, score events."""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv
load_dotenv("/app/frontend/.env")

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE}/api"

# Separate visitor ids
VID_A = f"vA-iter9-{uuid.uuid4()}"
VID_B = f"vB-iter9-{uuid.uuid4()}"

# Session factories
def owner_session():
    s = requests.Session()
    s.headers["Content-Type"] = "application/json"
    return s

def visitor_session(vid):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "X-View-As": "visitor", "X-Visitor-Id": vid})
    return s

@pytest.fixture(scope="module")
def owner():
    return owner_session()

@pytest.fixture(scope="module")
def va():
    return visitor_session(VID_A)

@pytest.fixture(scope="module")
def vb():
    return visitor_session(VID_B)

@pytest.fixture(scope="module")
def originals(owner):
    drafts = owner.get(f"{API}/c/drafts").json()
    # pick first non-copy original to use as the target
    orig = next(d for d in drafts if not d.get("copy_of"))
    return drafts, orig

# ---------- /api/mode ----------
def test_mode_owner(owner):
    r = owner.get(f"{API}/mode")
    assert r.status_code == 200
    assert r.json()["mode"] == "owner"

def test_mode_visitor(va):
    r = va.get(f"{API}/mode")
    assert r.status_code == 200 and r.json()["mode"] == "visitor"

# ---------- Visitor WRITE blocked on portfolio endpoints ----------
def test_visitor_create_task_403(va):
    r = va.post(f"{API}/c/tasks", json={"title": "TEST_v"})
    assert r.status_code == 403

def test_visitor_put_calendar_403(va, owner):
    cal = owner.get(f"{API}/c/calendar").json()
    assert cal, "need existing calendar"
    r = va.put(f"{API}/c/calendar/{cal[0]['id']}", json={"title": "x"})
    assert r.status_code == 403

def test_visitor_put_original_draft_403(va, originals):
    _, orig = originals
    r = va.put(f"{API}/c/drafts/{orig['id']}", json={"status": "approved"})
    assert r.status_code == 403

def test_visitor_add_version_on_original_403(va, originals):
    _, orig = originals
    r = va.post(f"{API}/drafts/{orig['id']}/versions", json={"text": "hack"})
    assert r.status_code == 403

def test_visitor_create_decision_403(va):
    r = va.post(f"{API}/c/decisions", json={"choice": "x"})
    assert r.status_code == 403

def test_visitor_add_revision_403(va):
    r = va.post(f"{API}/agents/ana/revisions", json={"text": "override"})
    assert r.status_code == 403

def test_visitor_delete_score_events_403(va):
    r = va.delete(f"{API}/score/events")
    assert r.status_code == 403

def test_visitor_run_on_original_draft_403(va, originals):
    _, orig = originals
    r = va.post(f"{API}/run", json={"task": "agatha.editorial_edit", "ref_type": "draft", "ref_id": orig["id"]})
    assert r.status_code == 403

def test_visitor_put_strategy_403(owner, va):
    strat = owner.get(f"{API}/c/strategy").json()
    cfg = next(x for x in strat if x.get("key") == "score_config")
    before_intro = cfg.get("intro")
    r = va.put(f"{API}/c/strategy/{cfg['id']}", json={"intro": "HACKED"})
    assert r.status_code == 403
    after = owner.get(f"{API}/c/strategy/{cfg['id']}").json()
    assert after.get("intro") == before_intro, "score_config was mutated by visitor!"

# ---------- Visitor copy flow ----------
def test_visitor_copy_requires_visitor_id():
    r = requests.post(f"{API}/drafts/anything/copy", headers={"X-View-As": "visitor"})
    # No X-Visitor-Id -> 400 from endpoint
    assert r.status_code in (400, 404, 403)

def test_visitor_copy_and_versioning(va, vb, originals):
    _, orig = originals
    # visitor A copies
    rc = va.post(f"{API}/drafts/{orig['id']}/copy")
    assert rc.status_code == 200
    copy = rc.json()
    assert copy["copy_of"] == orig["id"]
    assert copy["visitor_id"] == VID_A
    assert len(copy["versions"]) == 1
    cid = copy["id"]

    # visitor A can edit own copy
    rp = va.put(f"{API}/c/drafts/{cid}", json={"status": "draft"})
    assert rp.status_code == 200

    # visitor A can add a version to own copy
    rv = va.post(f"{API}/drafts/{cid}/versions", json={"text": "v2 by A", "note": "visitor edit"})
    assert rv.status_code == 200 and rv.json()["n"] == 2

    # visitor B CANNOT edit visitor A's copy
    r_b = vb.put(f"{API}/c/drafts/{cid}", json={"status": "approved"})
    assert r_b.status_code == 403

    r_bv = vb.post(f"{API}/drafts/{cid}/versions", json={"text": "hack"})
    assert r_bv.status_code == 403

    # visitor A can run agent on own copy (not actually running LLM; just checks middleware allows)
    r_run = va.post(f"{API}/run", json={"task": "berdine.rewrite", "ref_type": "draft", "ref_id": cid})
    assert r_run.status_code in (200, 400)  # 400 if task name mismatch, but middleware doesn't 403

    # Original unchanged
    o_after = requests.get(f"{API}/c/drafts/{orig['id']}").json()
    assert len(o_after["versions"]) == len(orig["versions"])
    assert o_after["versions"][-1]["text"] == orig["versions"][-1]["text"]

    # list_items visitor filter: VA sees originals + own copies; not VB's
    va_drafts = va.get(f"{API}/c/drafts").json()
    va_ids = {d["id"] for d in va_drafts}
    assert cid in va_ids
    vb_drafts = vb.get(f"{API}/c/drafts").json()
    vb_ids = {d["id"] for d in vb_drafts}
    assert cid not in vb_ids, "visitor B should not see visitor A's copy"

    # Owner list excludes any copies with visitor_id
    o_drafts = requests.get(f"{API}/c/drafts").json()
    assert cid not in {d["id"] for d in o_drafts}, "owner GET should exclude visitor copies"

    # cleanup: VA deletes own copy
    rd = va.delete(f"{API}/c/drafts/{cid}")
    assert rd.status_code == 200

# ---------- Score events allowed for visitor ----------
def test_visitor_can_post_score_event(va):
    r = va.post(f"{API}/score/events", json={"type": "start"})
    assert r.status_code == 200
    ev = r.json()
    # cleanup -- but delete endpoint is owner-only; leaving event (test tag)
    assert ev["type"] == "start"
