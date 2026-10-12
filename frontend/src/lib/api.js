import axios from "axios";
import { toast } from "sonner";
import { modeHeaders, loadMode, isOwnerNow } from "./mode";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const http = axios.create({ baseURL: API });
http.interceptors.request.use((c) => { Object.entries(modeHeaders()).forEach(([k, v]) => { c.headers[k] = v; }); return c; });
http.interceptors.response.use((r) => r, (e) => { if (e.response?.status === 403) toast.error(e.response.data?.detail || "Read-only portfolio."); return Promise.reject(e); });
loadMode(http);

export const list = (c) => http.get(`/c/${c}`).then((r) => r.data);
export const create = (c, body) => http.post(`/c/${c}`, body).then((r) => r.data);
export const update = (c, id, body) => http.put(`/c/${c}/${id}`, body).then((r) => r.data);
export const copyDraft = (id) => http.post(`/drafts/${id}/copy`).then((r) => r.data);
export const remove = (c, id) => http.delete(`/c/${c}/${id}`).then((r) => r.data);

export const startRun = (task, ref_type, ref_id, input) => http.post("/run", { task, ref_type, ref_id, input }).then((r) => r.data);
export const getRun = (id) => http.get(`/runs/${id}`).then((r) => r.data);
export const listRuns = (params) => http.get("/runs", { params }).then((r) => r.data);

export const recordDecision = (body) => (isOwnerNow() ? create("decisions", body) : Promise.resolve(null));

export async function streamChat(agent, body, onDelta) {
  const res = await fetch(`${API}/agents/${agent}/chat`, { method: "POST", headers: { "Content-Type": "application/json", ...modeHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Chat failed (${res.status})`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop();
    for (const p of parts) {
      if (!p.startsWith("data: ")) continue;
      const ev = JSON.parse(p.slice(6));
      if (ev.error) throw new Error(ev.error);
      if (ev.delta) onDelta(ev.delta);
    }
  }
}
