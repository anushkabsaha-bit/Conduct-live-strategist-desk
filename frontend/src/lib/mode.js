import { useEffect, useState } from "react";

const params = new URLSearchParams(window.location.search);
if (params.get("as") === "visitor") sessionStorage.setItem("viewAs", "visitor");
if (params.get("as") === "owner") sessionStorage.removeItem("viewAs");

export const viewAs = () => sessionStorage.getItem("viewAs") || "";
export const visitorId = () => {
  let v = localStorage.getItem("visitorId");
  if (!v) { v = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); localStorage.setItem("visitorId", v); }
  return v;
};
export const modeHeaders = () => ({ "X-Visitor-Id": visitorId(), ...(viewAs() ? { "X-View-As": viewAs() } : {}) });

let cached = null;
let pending = null;
const subs = new Set();
export function loadMode(http) {
  if (!pending) pending = http.get("/mode").then((r) => { cached = r.data; subs.forEach((f) => f(cached)); return cached; }).catch(() => { cached = { mode: "visitor", note: "Read-only portfolio." }; subs.forEach((f) => f(cached)); return cached; });
  return pending;
}
export function useMode() {
  const [m, setM] = useState(cached);
  useEffect(() => { subs.add(setM); if (cached) setM(cached); return () => subs.delete(setM); }, []);
  return { ready: !!m, owner: m?.mode === "owner", note: m?.note || "" };
}
export const isOwnerNow = () => cached?.mode === "owner";
