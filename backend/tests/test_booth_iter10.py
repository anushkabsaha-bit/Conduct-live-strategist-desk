"""Iter10 — SAP Score booth campaign expansion in place."""
import os, requests, pytest
from pathlib import Path

def _load_env():
    env = Path("/app/frontend/.env").read_text().splitlines()
    for line in env:
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError("REACT_APP_BACKEND_URL missing")

BASE = _load_env().rstrip("/")
BOOTH_ID = "df7ec172-6f55-4fe1-a975-08b554124815"


@pytest.fixture
def owner():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def visitor():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "X-View-As": "visitor", "X-Visitor-Id": "iter10-vis"})
    return s


class TestCampaignsNoDupe:
    def test_exactly_two_campaigns(self, owner):
        r = owner.get(f"{BASE}/api/c/campaigns")
        assert r.status_code == 200
        data = r.json()
        names = sorted([c["name"] for c in data])
        assert len(data) == 2, f"expected 2, got {len(data)}: {names}"
        assert "New campaign" in names
        assert "SAP Score booth" in names

    def test_booth_id_and_fields_unchanged(self, owner):
        r = owner.get(f"{BASE}/api/c/campaigns")
        booth = [c for c in r.json() if c["name"] == "SAP Score booth"][0]
        assert booth["id"] == BOOTH_ID
        assert booth["brief"].startswith("A physical Conduct photo booth")
        assert booth["concept"].startswith("SAP Score: 21%")
        assert booth["decision"] == "develop"
        for k in ["brief","audience","objective","insight","concept","resources","budget","dependencies","risks","distribution","metrics","kill_criteria"]:
            assert k in booth and booth[k]
        # timeline/alternatives filled
        assert booth.get("timeline","").strip()
        assert booth.get("alternatives","").strip()
        # story expanded
        assert "story" in booth
        s = booth["story"]
        assert len(s["why"]["elements"]) == 6
        assert len(s["why"]["chain"]) == 4
        assert len(s["journey"]) == 6
        assert len(s["recruitment"]["steps"]) == 5
        assert len(s["commercial"]["chain"]) == 7
        assert len(s["commercial"]["failures"]) == 4
        assert len(s["phases"]) == 8
        assert len(s["budget"]) == 6
        assert len(s["decisions"]) == 9

    def test_no_em_dash_in_story(self, owner):
        r = owner.get(f"{BASE}/api/c/campaigns")
        booth = [c for c in r.json() if c["name"] == "SAP Score booth"][0]
        import json
        blob = json.dumps(booth["story"])
        assert "\u2014" not in blob, "em dash found in booth story"


class TestStrategyMeasure:
    def test_metrics_17_with_booth(self, owner):
        r = owner.get(f"{BASE}/api/c/strategy")
        assert r.status_code == 200
        docs = r.json()
        measure = [d for d in docs if d.get("key") == "measure"][0]
        assert len(measure["metrics"]) == 17
        booth_metrics = [m for m in measure["metrics"] if m.get("campaign") == "booth"]
        assert len(booth_metrics) == 8
        areas = {m["area"] for m in booth_metrics}
        assert "Booth activation" in areas
        assert "Booth: recruitment (tracked separately)" in areas
        for m in booth_metrics:
            assert "can" in m and "cannot" in m and "period" in m

    def test_score_config_unchanged(self, owner):
        r = owner.get(f"{BASE}/api/c/strategy")
        docs = r.json()
        cfg = [d for d in docs if d.get("key") == "score_config"][0]
        assert len(cfg["questions"]) == 3
        for q in cfg["questions"]:
            assert len(q["options"]) == 3


class TestVisitorForbidden:
    def test_put_campaign_403(self, visitor):
        r = visitor.put(f"{BASE}/api/c/campaigns/{BOOTH_ID}", json={"brief": "hack"})
        assert r.status_code == 403
