# Backend regression - iteration 5
# Covers: /api/ identity, web_research flag, draft/decision persistence, live_research web_search=true
import os, requests, pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
DRAFT_ID = "01054c5e-1b45-4801-8172-6089d23a89b8"


class TestApiIdentity:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        d = r.json()
        assert d["web_research"] == "anthropic_web_search"
        assert d["llm"] == "configured"


class TestFreudenbergDraft:
    def test_draft_exists_and_has_decision(self):
        r = requests.get(f"{BASE_URL}/api/c/drafts/{DRAFT_ID}")
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == DRAFT_ID
        assert d["title"] == "Enterprise software has a documentation problem"
        # After iteration-5 workflow should be at v2
        assert len(d["versions"]) >= 2
        # Decision recorded with TEST: reasoning
        assert d.get("decision"), "decision must exist"
        assert d["decision"]["final"] == "Keep as draft"
        assert d["decision"]["reasoning"].startswith("TEST:")
        assert len(d["decision"].get("history", [])) >= 1


class TestLiveResearch:
    def test_runs_have_web_search_flag(self):
        r = requests.get(f"{BASE_URL}/api/runs", params={"task": "catherine.live_research", "limit": 5})
        assert r.status_code == 200
        runs = r.json()
        assert len(runs) >= 1
        for run in runs:
            if run["status"] == "ok":
                assert run.get("web_search") is True, f"web_search flag missing on run {run['id']}"
                break
        else:
            pytest.fail("No successful catherine.live_research run found")


class TestFounderNotes:
    def test_edith_founder_notes_runs_exist(self):
        r = requests.get(f"{BASE_URL}/api/runs", params={"task": "edith.founder_notes", "limit": 3})
        assert r.status_code == 200
        runs = r.json()
        assert len(runs) >= 1
        ok = [x for x in runs if x["status"] == "ok"]
        assert ok, "At least one successful edith.founder_notes run expected"
        out = ok[0]["output"]
        # Items should contain KIND values from the allowed set
        items = out.get("items", [])
        assert items, "items array should be non-empty"
        kinds = {i.get("kind") for i in items}
        allowed = {"DIRECT QUOTE", "PARAPHRASE", "INTERPRETATION", "NEEDS SIGN-OFF"}
        assert kinds.issubset(allowed) and kinds, f"Unexpected kinds: {kinds}"
