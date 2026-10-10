import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getRun, listRuns, startRun } from "../lib/api";

export function useRuns(task, refType, refId) {
  const [runs, setRuns] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    const r = await listRuns({ task, ref_type: refType || undefined, ref_id: refId || undefined, limit: 10 });
    if (alive.current) setRuns(r);
    return r;
  }, [task, refType, refId]);

  useEffect(() => { alive.current = true; setRuns([]); refresh().catch(() => {}); return () => { alive.current = false; }; }, [refresh]);

  const run = useCallback(async (input) => {
    setRunning(true); setError("");
    try {
      const r = await startRun(task, refType, refId, input);
      let cur = r;
      while (cur.status === "running") {
        await new Promise((res) => setTimeout(res, 2500));
        cur = await getRun(r.id);
      }
      if (cur.status !== "ok") throw new Error(cur.error || "Agent run failed");
      await refresh();
      return cur;
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      if (alive.current) setError(msg);
      toast.error(msg);
      return null;
    } finally {
      if (alive.current) setRunning(false);
    }
  }, [task, refType, refId, refresh]);

  return { runs, latest: runs[0], running, error, run, refresh };
}
