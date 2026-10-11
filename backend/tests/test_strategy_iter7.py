"""Iter 7 backend tests: v2 show-the-work additions (film, brief, score v2, three-years draft, opening alternatives, scenarios)."""
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
    assert r.json()["llm"] in ("configured", "missing")


def test_strategy_collection_has_5_docs(s):
    r = s.get(f"{API}/c/strategy")
    assert r.status_code == 200
    docs = r.json()
    keys = {d.get("key") for d in docs}
    assert keys == {"narrative", "score_config", "measure", "film", "brief"}, keys


def test_score_v2_questions_and_earlier_versions(s):
    docs = s.get(f"{API}/c/strategy").json()
    cfg = next(d for d in docs if d["key"] == "score_config")
    # New set: 3 questions, 3 options each
    assert len(cfg["questions"]) == 3
    for q in cfg["questions"]:
        assert len(q["options"]) == 3
    # Earlier (4-option) version preserved
    assert len(cfg.get("earlier_versions", [])) >= 1
    old = cfg["earlier_versions"][0]
    assert len(old["questions"]) == 3
    for q in old["questions"]:
        assert len(q["options"]) == 4
    # Deterministic sum sanity for options [0,0,0]
    total = sum(q["options"][0]["points"] for q in cfg["questions"])
    assert total == 100, total


def test_measure_has_experiments_and_scenarios(s):
    docs = s.get(f"{API}/c/strategy").json()
    me = next(d for d in docs if d["key"] == "measure")
    assert "experiments" in me
    assert isinstance(me["experiments"], list)
    assert len(me.get("scenarios", [])) == 3


def test_film_doc(s):
    docs = s.get(f"{API}/c/strategy").json()
    film = next(d for d in docs if d["key"] == "film")
    assert film["question"]
    assert len(film["outline"]) == 5
    roles = {i["role"] for i in film["interviews"]}
    assert roles == {"freudenberg", "conduct_product", "conduct_customer"}
    for iv in film["interviews"]:
        for q in iv["questions"]:
            assert "answer" in q and "evidence" in q and "permission" in q and "approval" in q
    assert len(film["story_changes"]) >= 3
    assert len(film["production"]) >= 3


def test_brief_doc(s):
    docs = s.get(f"{API}/c/strategy").json()
    brief = next(d for d in docs if d["key"] == "brief")
    assert len(brief["fields"]) == 10
    assert len(brief["alternatives"]) == 3
    assert "chosen" in brief and "choice_reason" in brief


def test_three_years_draft_and_flags(s):
    drafts = s.get(f"{API}/c/drafts").json()
    three = next((d for d in drafts if "three years ago" in d["title"].lower()), None)
    assert three is not None, [d["title"] for d in drafts]
    assert len(three.get("flags", [])) == 3
    labels = [f["label"] for f in three["flags"]]
    assert "illustrative" in labels
    v1 = three["versions"][0]
    assert v1["text"].startswith("Somewhere in an enterprise system")


def test_freudenberg_opening_alternatives_and_v1(s):
    drafts = s.get(f"{API}/c/drafts").json()
    fr = next(d for d in drafts if d["title"] == "Enterprise software has a documentation problem")
    assert fr["versions"][0]["text"].startswith("Enterprise software has a documentation problem.\n\nThe way a business works changes over time.")
    oa = fr.get("opening_alternatives")
    assert oa and oa.get("original") and oa.get("alternative")
    assert oa["alternative"].startswith("Ask someone why an enterprise system")


def test_launch_drafts_preserved(s):
    drafts = s.get(f"{API}/c/drafts").json()
    launch = [d for d in drafts if d.get("series") == "launch_narrative"]
    assert len(launch) == 3


def test_agents_and_ana_prompt(s):
    r = s.get(f"{API}/agents")
    assert r.status_code == 200 and len(r.json()) > 0
    r = s.get(f"{API}/agents/ana/prompt")
    assert r.status_code == 200
    body = r.json()
    assert "original" in body


def test_score_events_endpoint(s):
    s.delete(f"{API}/score/events")
    for t in ["start", "complete", "copy", "download", "restart"]:
        r = s.post(f"{API}/score/events", json={"type": t, "result": "iter7"})
        assert r.status_code == 200
    r = s.get(f"{API}/score/stats")
    assert r.status_code == 200
    st = r.json()
    assert st["start"] >= 1 and st["complete"] >= 1


def test_ana_ask_task_registered(s):
    # ana.ask should be a known task so /api/run accepts it
    r = s.get(f"{API}/agents/ana/prompt")
    assert r.status_code == 200
    # Attempt a tiny run; may take long - skip if slow. We just verify endpoint accepts it.
    # Need a ref_id: use narrative doc
    narr = next(d for d in s.get(f"{API}/c/strategy").json() if d["key"] == "narrative")
    payload = {"task": "ana.ask", "ref_type": "strategy", "ref_id": narr["id"],
               "input": {"message": "Say the single word OK for a sanity test."}}
    r = s.post(f"{API}/run", json=payload, timeout=180)
    assert r.status_code in (200, 201), r.text
    body = r.json()
    assert body.get("id") or body.get("output") is not None


def test_no_em_dash_in_strategy(s):
    for d in s.get(f"{API}/c/strategy").json():
        for k, v in d.items():
            if isinstance(v, str):
                assert "\u2014" not in v, f"em dash in {d.get('key')}.{k}"
