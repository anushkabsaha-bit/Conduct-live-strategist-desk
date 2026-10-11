import { useCallback, useEffect, useState } from "react";
import { http, list, update, recordDecision } from "./api";

export const LABELS = {
  verified: { t: "Verified public", c: "bg-[#2F7D4F] text-linen" },
  interpretation: { t: "Interpretation", c: "bg-botticelli text-chocolate" },
  proposed: { t: "Proposed idea", c: "bg-tangelo text-linen" },
  hypothesis: { t: "Hypothesis to test", c: "border border-chocolate text-chocolate" },
  confirm: { t: "Needs Conduct confirmation", c: "bg-chocolate text-linen" },
  illustrative: { t: "Illustrative, not verified", c: "border-2 border-tangelo text-tangelo" },
};

export function useStrategy() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => list("strategy").then((d) => setDocs(Object.fromEntries(d.map((x) => [x.key, x])))).catch(() => setError("Could not load the strategy workspace. Check the connection and retry.")), []);
  useEffect(() => { load(); }, [load]);
  const save = async (key, patch) => {
    const doc = await update("strategy", docs[key].id, patch);
    setDocs((s) => ({ ...s, [key]: doc }));
    return doc;
  };
  return { docs, error, save, reload: load };
}

export const logDecision = (doc, label, choice, note) => recordDecision({ ref_type: "strategy", ref_id: doc.id, label, choice, note });
export const scoreStats = () => http.get("/score/stats").then((r) => r.data);
export const scoreEvent = (type, result) => http.post("/score/events", { type, result }).catch(() => {});
export const clearScore = () => http.delete("/score/events").then((r) => r.data);

export function computeScore(cfg, picks) {
  const total = cfg.questions.reduce((s, q, i) => s + (q.options[picks[i]]?.points || 0), 0);
  const score = Math.max(0, Math.min(100, total));
  const result = cfg.results.find((r) => score >= r.min && score <= r.max) || cfg.results[cfg.results.length - 1];
  return { score, result };
}

export function useLocalDoc(doc, save, key) {
  const [d, setD] = useState(doc);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (doc) setD(doc); }, [doc]);
  const dirty = doc && JSON.stringify(d) !== JSON.stringify(doc);
  const persist = async () => {
    setBusy(true);
    try { const { id, created_at, updated_at, key: k, ...rest } = d; await save(key, rest); return true; }
    catch { return false; } finally { setBusy(false); }
  };
  return { d, setD, dirty, busy, persist };
}
