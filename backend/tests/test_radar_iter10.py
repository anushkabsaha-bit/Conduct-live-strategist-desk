"""Iter 10 — Opportunity Radar / CATHERINE live_research normalization tests.

Covers:
  - live_research_input() normalises string -> list
  - empty markets -> 4 priority defaults
  - search_brief present
  - older runs with markets as string are preserved and listing doesn't crash
  - visitor mode blocks POST /api/run (403)
  - the real 4-market run (da2302d0) is still retained

We import live_research_input directly to avoid firing a real (costly) LLM run.
"""
import os
import sys
import requests
import pytest

sys.path.insert(0, "/app/backend")
from server import live_research_input, PRIORITY_MARKETS  # noqa: E402

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- unit: live_research_input ----------

class TestLiveResearchInput:
    def test_priority_markets_default_count(self):
        assert len(PRIORITY_MARKETS) == 4
        assert "London, United Kingdom" in PRIORITY_MARKETS
        assert "Germany (Berlin and other tech hubs)" in PRIORITY_MARKETS

    def test_string_market_normalised_to_list(self):
        out = live_research_input({"markets": "London"})
        assert out["markets"] == ["London"]
        assert "London" in out["search_brief"]
        assert out["types"]
        assert out["date_range"]

    def test_csv_string_market_normalised_to_list(self):
        out = live_research_input({"markets": "London, Berlin"})
        assert out["markets"] == ["London", "Berlin"]

    def test_empty_markets_defaults_to_priority(self):
        out = live_research_input({})
        assert out["markets"] == PRIORITY_MARKETS
        assert "search_brief" in out
        # brief includes all 4 priority markets
        for m in PRIORITY_MARKETS:
            assert m in out["search_brief"]

    def test_none_markets_defaults_to_priority(self):
        out = live_research_input({"markets": None})
        assert out["markets"] == PRIORITY_MARKETS

    def test_whitespace_only_filtered(self):
        out = live_research_input({"markets": ["   ", ""]})
        assert out["markets"] == PRIORITY_MARKETS

    def test_list_passthrough(self):
        ms = ["London, United Kingdom", "Germany (Berlin and other tech hubs)"]
        out = live_research_input({"markets": ms, "types": "hackathons", "date_range": "next 6 months"})
        assert out["markets"] == ms
        assert "hackathons" in out["search_brief"]
        assert "next 6 months" in out["search_brief"]


# ---------- integration: existing runs ----------

class TestRunsListing:
    def test_runs_list_does_not_crash_on_legacy_string_markets(self, session):
        r = session.get(f"{BASE}/runs?task=catherine.live_research")
        assert r.status_code == 200
        rs = r.json()
        assert isinstance(rs, list) and len(rs) >= 1
        # Make sure at least some runs exist and listing works regardless of markets shape
        for run in rs:
            m = run.get("input", {}).get("markets")
            assert m is None or isinstance(m, (list, str))

    def test_real_4market_run_retained(self, session):
        r = session.get(f"{BASE}/runs/da2302d0-3288-49fe-a2ba-32b5c7f41698")
        assert r.status_code == 200
        doc = r.json()
        assert doc["input"]["markets"] == PRIORITY_MARKETS
        assert len(doc["output"]["opportunities"]) == 16
        assert len(doc["output"]["per_market"]) == 4

    def test_legacy_single_market_string_run_still_fetchable(self, session):
        # 816e7eea has markets stored as the string "Germany / Europe"
        r = session.get(f"{BASE}/runs/816e7eea-a2f4-4bf0-bc56-371ec942924e")
        assert r.status_code == 200
        doc = r.json()
        assert isinstance(doc["input"]["markets"], str)


# ---------- integration: visitor mode blocks run ----------

class TestVisitorModeBlocksRun:
    def test_visitor_cannot_post_run(self, session):
        r = session.post(
            f"{BASE}/run",
            json={"task": "catherine.live_research", "input": {"markets": ["London"]}},
            headers={"x-view-as": "visitor"},
        )
        assert r.status_code == 403

    def test_owner_mode_endpoint(self, session):
        r = session.get(f"{BASE}/mode")
        assert r.status_code == 200
        assert r.json()["mode"] == "owner"

    def test_visitor_mode_endpoint(self, session):
        r = session.get(f"{BASE}/mode", headers={"x-view-as": "visitor"})
        assert r.status_code == 200
        assert r.json()["mode"] == "visitor"


# ---------- integration: opportunities CRUD basics for radar ----------

class TestOpportunitiesCRUD:
    def test_list_opportunities(self, session):
        r = session.get(f"{BASE}/c/opportunities")
        assert r.status_code == 200
        xs = r.json()
        assert isinstance(xs, list) and len(xs) >= 1

    def test_opportunity_shape(self, session):
        xs = session.get(f"{BASE}/c/opportunities").json()
        o = xs[0]
        # required fields for radar table + detail
        for f in ["id", "name", "market", "status", "verification"]:
            assert f in o
        # mongo _id must not leak
        assert "_id" not in o
