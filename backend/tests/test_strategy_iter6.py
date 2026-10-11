"""Iter 6 backend tests: strategy seed, score events + stats, drafts preservation."""
import os
import pytest
import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = BASE + "/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    j = r.json()
    assert j["app"]
    assert j["llm"] in ("configured", "missing")


def test_strategy_seeded(s):
    r = s.get(f"{API}/c/strategy")
    assert r.status_code == 200
    docs = r.json()
    keys = {d.get("key") for d in docs}
    assert keys == {"narrative", "score_config", "measure"}, keys
    narr = next(d for d in docs if d["key"] == "narrative")
    assert narr["title"] == "Keeping the system and the story in sync"
    assert len(narr["questions"]) == 4
    assert len(narr["audiences"]) == 3
    assert len(narr["sources"]) >= 4
    assert len(narr["draft_ids"]) == 3
    assert len(narr["core"]) >= 5
    sc = next(d for d in docs if d["key"] == "score_config")
    assert len(sc["questions"]) == 3
    for q in sc["questions"]:
        assert len(q["options"]) == 4
    assert len(sc["results"]) == 4
    me = next(d for d in docs if d["key"] == "measure")
    assert len(me["hypotheses"]) == 3
    assert len(me["metrics"]) == 9
    areas = {m["area"] for m in me["metrics"]}
    assert len(areas) == 6


def test_drafts_preserved(s):
    r = s.get(f"{API}/c/drafts")
    assert r.status_code == 200
    drafts = r.json()
    titles = [d["title"] for d in drafts]
    # Launch drafts exist
    launch = [d for d in drafts if d.get("series") == "launch_narrative"]
    assert len(launch) == 3
    # Freudenberg draft present
    assert any("documentation problem" in t.lower() for t in titles), titles
    # Wrongness draft with versions
    wrong = [d for d in drafts if "wrongness" in d["title"].lower()]
    assert wrong, titles
    assert len(wrong[0]["versions"]) >= 1


def test_score_events_and_stats(s):
    # Clear first
    s.delete(f"{API}/score/events")
    for t in ["start", "complete", "copy", "download", "restart"]:
        r = s.post(f"{API}/score/events", json={"type": t, "result": "test"})
        assert r.status_code == 200, (t, r.text)
    # Invalid
    r = s.post(f"{API}/score/events", json={"type": "bogus"})
    assert r.status_code == 400
    # Stats
    r = s.get(f"{API}/score/stats")
    assert r.status_code == 200
    st = r.json()
    assert st["start"] >= 1 and st["complete"] >= 1
    assert st["shares"] == st["copy"] + st["download"]
    assert st["completion_rate"] is not None
    assert st["label"] == "Prototype test data"


def test_agents_and_prompt(s):
    r = s.get(f"{API}/agents")
    assert r.status_code == 200 and len(r.json()) > 0
    r = s.get(f"{API}/agents/berdine/prompt")
    assert r.status_code == 200
    assert "original" in r.json()


def test_no_em_dash_in_strategy(s):
    r = s.get(f"{API}/c/strategy")
    for d in r.json():
        for k, v in d.items():
            if isinstance(v, str):
                assert "\u2014" not in v, f"em dash in {d.get('key')}.{k}"
