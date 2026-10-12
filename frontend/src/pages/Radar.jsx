import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Plus, FolderPlus, Ban } from "lucide-react";
import { Btn, Empty, Field, Kicker, Note, PageHead, Tag } from "../components/kit";
import { Claim } from "../components/Output";
import AgentRunCard from "../components/AgentRunCard";
import AskAna from "../components/AskAna";
import { create, list, listRuns, recordDecision, update } from "../lib/api";
import { OPP_STATUS, VERIF, todayISO } from "../lib/meta";

const TYPES = ["developer_conference", "tech_conference", "enterprise_sap_event", "hackathon", "community_idea", "community", "podcast_media", "roundtable", "partnership", "other"];
const MARKETS = ["UK", "Germany / Europe", "US", "Other"];
const PRIORITY = ["London, United Kingdom", "New York City, United States", "San Francisco Bay Area, United States", "Germany (Berlin and other tech hubs)"];
const SHORT = { "London, United Kingdom": "London", "New York City, United States": "New York City", "San Francisco Bay Area, United States": "the San Francisco Bay Area", "Germany (Berlin and other tech hubs)": "Germany" };
const PLACES = { London: /london|\buk\b|united kingdom|britain/i, "New York City": /new york|nyc/i, "San Francisco Bay Area": /san francisco|bay area|silicon valley/i, Germany: /german|berlin|munich|hamburg|frankfurt|walldorf/i };
const joinList = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
const autoQuery = (p) => `Find ${p.types} across ${joinList((p.markets.length ? p.markets : PRIORITY).map((m) => SHORT[m] || m))} over the ${p.date_range}.`;
const withQuery = (p) => (p.queryEdited ? p : { ...p, query: autoQuery(p) });
const loadPlan = () => {
  const base = { markets: PRIORITY, extra: [], types: "developer conferences, hackathons, enterprise technology events and relevant communities", date_range: "next 12 to 18 months", queryEdited: false };
  try { const s = JSON.parse(localStorage.getItem("radarPlan")); if (s?.markets) return { ...base, ...s }; } catch {}
  return withQuery(base);
};
const toMarket = (m = "") => (/london|united kingdom|\buk\b/i.test(m) ? "UK" : /german|berlin|europe/i.test(m) ? "Germany / Europe" : /new york|san francisco|united states|\bus\b/i.test(m) ? "US" : "Other");
const runMarkets = (r) => { const m = r.input?.markets; return Array.isArray(m) ? m : m ? String(m).split(",").map((x) => x.trim()).filter(Boolean) : []; };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const groupByMarket = (opps, markets = []) => {
  const g = {};
  opps.forEach((x, i) => { const k = markets.find((m) => m === x.market) || markets.find((m) => (x.market || "").toLowerCase().includes((SHORT[m] || m).replace("the ", "").toLowerCase())) || x.market || "Unspecified market"; (g[k] = g[k] || []).push({ x, i }); });
  return [...markets.filter((m) => g[m]).map((m) => [m, g[m]]), ...Object.entries(g).filter(([k]) => !markets.includes(k))];
};

function MarketPicker({ plan, setPlan }) {
  const [add, setAdd] = useState("");
  const all = [...PRIORITY, ...(plan.extra || [])];
  const set = (markets) => setPlan(withQuery({ ...plan, markets }));
  const toggle = (m) => set(plan.markets.includes(m) ? plan.markets.filter((x) => x !== m) : all.filter((x) => plan.markets.includes(x) || x === m));
  return (
    <div data-testid="market-picker">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2"><span className="kicker">Markets · searched together, priorities not limits</span>
        <span className="flex gap-3"><button data-testid="markets-all" onClick={() => set(PRIORITY)} className="font-mono text-[10px] uppercase tracking-[0.12em] underline-grow">All four priority markets</button><button data-testid="markets-reset-query" onClick={() => setPlan({ ...plan, queryEdited: false, query: autoQuery(plan) })} className="font-mono text-[10px] uppercase tracking-[0.12em] underline-grow">Rewrite question from markets</button></span></div>
      <div className="flex flex-wrap gap-2">
        {all.map((m) => { const on = plan.markets.includes(m); return (
          <span key={m} className={`inline-flex items-stretch border-2 ${on ? "border-chocolate bg-chocolate text-linen" : "border-chocolate/30"}`}>
            <button data-testid={`market-${slug(m)}`} aria-pressed={on} onClick={() => toggle(m)} className="px-3 py-1.5 font-mono text-[11px]">{on ? "✓ " : ""}{m}</button>
            <button data-testid={`market-only-${slug(m)}`} onClick={() => set([m])} title="Search only this market" className={`px-2 font-mono text-[9px] uppercase border-l ${on ? "border-linen/30" : "border-chocolate/30"} hover:text-tangelo`}>Only</button>
            {!PRIORITY.includes(m) && <button data-testid={`market-remove-${slug(m)}`} onClick={() => setPlan(withQuery({ ...plan, extra: plan.extra.filter((x) => x !== m), markets: plan.markets.filter((x) => x !== m) }))} className="px-2 text-[11px] hover:text-tangelo">×</button>}
          </span>); })}
        <span className="inline-flex"><input data-testid="market-add-input" className="field !w-40 !py-1 !text-[11px]" placeholder="Add a city or market" value={add} onChange={(e) => setAdd(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && add.trim() && !all.includes(add.trim())) { setPlan(withQuery({ ...plan, extra: [...(plan.extra || []), add.trim()], markets: [...plan.markets, add.trim()] })); setAdd(""); } }} /></span>
      </div>
      {!plan.markets.length && <p className="font-mono text-[10px] text-tangelo mt-1">No market selected, so the search covers all four priority markets.</p>}
    </div>
  );
}

function QueryCheck({ plan, setPlan }) {
  const sel = (plan.markets.length ? plan.markets : PRIORITY).join(" ");
  const missing = Object.entries(PLACES).filter(([, re]) => re.test(plan.query) && !re.test(sel)).map(([k]) => k);
  if (!missing.length) return <p className="font-mono text-[10px] text-chocolate/60 mt-1" data-testid="query-consistent">CATHERINE searches exactly the selected markets.</p>;
  return <p className="font-mono text-[11px] text-tangelo mt-1" data-testid="query-mismatch">Your question mentions {missing.join(", ")}, which isn't selected. CATHERINE will search only the selected markets. <button onClick={() => setPlan({ ...plan, queryEdited: false, query: autoQuery(plan) })} className="underline">Rewrite the question</button></p>;
}

function PerMarket({ o, r }) {
  const pm = o.per_market || [];
  if (!pm.length) return null;
  return <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2" data-testid="per-market">{pm.map((p, i) => <div key={i} className={`p-2 border font-mono text-[11px] ${p.found ? "border-chocolate/30" : "border-tangelo"}`}><p className="font-bold">{p.market}</p><p>{p.found ? `${p.found} found` : "Nothing verifiable found"}</p>{p.note && <p className="opacity-70">{p.note}</p>}</div>)}</div>;
}
const BLANK = { name: "", type: "tech_conference", market: "UK", location: "", start_date: "", end_date: "", deadline: "Unknown", source_url: "", verification: "needs_validation", audience: "", relevance: "", cost: "Unknown", notes: "", status: "new", contacts: "None publicly verified" };

function OppForm({ onSaved }) {
  const [f, setF] = useState(BLANK);
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    await create("opportunities", { ...f, source_checked: f.source_url ? `${todayISO()} (added manually by Anushka)` : "", verification: f.source_url ? f.verification : f.verification === "verified_dates" ? "needs_validation" : f.verification });
    setF(BLANK); toast.success("Opportunity saved"); onSaved();
  };
  return (
    <div className="grid md:grid-cols-4 gap-3 border-2 border-chocolate p-5 bg-paper" data-testid="opp-form">
      <div className="md:col-span-2"><Field label="Name"><input data-testid="opp-name-input" className="field" value={f.name} onChange={s("name")} /></Field></div>
      <Field label="Type"><select className="field" value={f.type} onChange={s("type")}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Market"><select className="field" value={f.market} onChange={s("market")}>{MARKETS.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Location"><input className="field" value={f.location} onChange={s("location")} /></Field>
      <Field label="Start date"><input type="date" className="field" value={f.start_date} onChange={s("start_date")} /></Field>
      <Field label="End date"><input type="date" className="field" value={f.end_date} onChange={s("end_date")} /></Field>
      <Field label="Deadline (separate)"><input className="field" value={f.deadline} onChange={s("deadline")} /></Field>
      <div className="md:col-span-2"><Field label="Official source URL"><input data-testid="opp-url-input" className="field" value={f.source_url} onChange={s("source_url")} placeholder="https://organiser-site…" /></Field></div>
      <Field label="Verification"><select className="field" value={f.verification} onChange={s("verification")}>{Object.keys(VERIF).map((k) => <option key={k} value={k}>{VERIF[k].label}</option>)}</select></Field>
      <Field label="Cost"><input className="field" value={f.cost} onChange={s("cost")} /></Field>
      <div className="md:col-span-2"><Field label="Why relevant"><textarea className="field" rows={2} value={f.relevance} onChange={s("relevance")} /></Field></div>
      <div className="md:col-span-2"><Field label="Notes"><textarea className="field" rows={2} value={f.notes} onChange={s("notes")} /></Field></div>
      <p className="md:col-span-3 font-mono text-[10px] text-chocolate/60 self-center">Without a source URL, an item cannot be marked verified.</p>
      <Btn variant="accent" data-testid="opp-save-btn" onClick={save} disabled={!f.name}>Save opportunity</Btn>
    </div>
  );
}

function OppRow({ o, reload, cmp, toggleCmp, selected, onSelect, detail }) {
  const open = !!detail;
  const past = o.end_date && o.end_date < todayISO();
  const set = async (patch) => { await update("opportunities", o.id, patch); reload(); };
  const reject = async () => { await set({ status: "rejected" }); await recordDecision({ ref_type: "opportunity", ref_id: o.id, choice: "rejected", note: `Rejected ${o.name}` }); };
  const toProject = async () => {
    const runs = await listRuns({ ref_type: "opportunity", ref_id: o.id });
    const latest = Object.values(runs.reduce((m, r) => ({ [r.task]: r, ...m }), {}));
    const p = await create("projects", { name: `Pursue: ${o.name}`, status: "active", origin: "opportunity", opportunity_id: o.id,
      context: { opportunity: o, sources: [o.source_url].filter(Boolean), agent_findings: latest.map((r) => ({ task: r.task, run_id: r.id, at: r.created_at, output: r.output })), open_questions: latest.flatMap((r) => r.output.facts_to_verify || r.output.missing_information || []) } });
    await create("tasks", { title: `Next step for ${o.name}`, agent: "catherine", due: "", importance: "medium", kind: "research", status: "open", project_id: p.id, why: o.relevance, next_action: latest.find((r) => r.output.next_action)?.output.next_action || "Verify open facts on the official source", context: { project_id: p.id, source: o.source_url } });
    await set({ status: "converted" });
    await recordDecision({ ref_type: "opportunity", ref_id: o.id, choice: "converted_to_project", note: `Project ${p.id}` });
    toast.success("Converted into a trackable project with its research and open questions");
  };
  return (
    <div data-testid={`opp-row-${o.id}`} className={`border-b border-chocolate/25 ${o.status === "rejected" ? "opacity-45" : ""}`}>
      {!detail && <div onClick={onSelect} className={`grid md:grid-cols-[28px_1.6fr_1fr_1fr_1fr_120px] gap-3 items-center py-3 px-2 cursor-pointer transition-colors ${selected ? "bg-botticelli/30" : "hover:bg-paper"}`}>
        <input type="checkbox" data-testid={`opp-compare-${o.id}`} checked={cmp} onClick={(e) => e.stopPropagation()} onChange={toggleCmp} className="accent-tangelo w-4 h-4" />
        <div>
          <p className="font-mono text-sm font-bold">{o.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1"><span className={`font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-0.5 ${VERIF[o.verification]?.cls}`}>{VERIF[o.verification]?.label}</span>{past && <Tag tone="solid">Past</Tag>}<Tag>{o.type.replace(/_/g, " ")}</Tag></div>
        </div>
        <p className="font-mono text-xs">{o.market}<br /><span className="text-chocolate/60">{o.location}</span></p>
        <p className="font-mono text-xs">{o.start_date ? `${o.start_date}${o.end_date && o.end_date !== o.start_date ? ` → ${o.end_date}` : ""}` : <span className="text-tangelo">Date unconfirmed</span>}<br /><span className="text-chocolate/60">Deadline: {o.deadline || "Unknown"}</span></p>
        <div>{o.source_url ? <a href={o.source_url} target="_blank" rel="noreferrer" data-testid={`opp-source-${o.id}`} className="inline-flex items-center gap-1 font-mono text-[11px] text-tangelo underline-grow">Official source <ExternalLink className="w-3 h-3" /></a> : <span className="font-mono text-[11px] text-chocolate/50">No source yet</span>}<p className="font-mono text-[9px] text-chocolate/50 mt-0.5">{o.source_checked && `Checked ${o.source_checked}`}</p></div>
        <select data-testid={`opp-status-${o.id}`} onClick={(e) => e.stopPropagation()} className="field !py-1 !text-[11px]" value={o.status} onChange={(e) => set({ status: e.target.value })}>{OPP_STATUS.map((x) => <option key={x}>{x}</option>)}</select>
      </div>}
      {open && (
        <div className="pb-8 space-y-5" data-testid={`opp-detail-${o.id}`}>
          <p className="font-display uppercase text-3xl leading-none">{o.name}</p>
          <div className="flex flex-wrap gap-2 items-center"><span className={`font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-0.5 ${VERIF[o.verification]?.cls}`}>{VERIF[o.verification]?.label}</span>{past && <Tag tone="solid">Past</Tag>}<span className="font-mono text-xs">{o.start_date || "Date unconfirmed"} · {o.location}</span>{o.source_url && <a href={o.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[11px] text-tangelo underline-grow">Official source <ExternalLink className="w-3 h-3" /></a>}</div>
          <div className="grid md:grid-cols-2 gap-4 font-mono text-xs">
            <p><span className="kicker text-tangelo block">Audience</span>{o.audience}</p>
            <p><span className="kicker text-tangelo block">Why relevant</span><Claim text={o.relevance} /></p>
            <p><span className="kicker text-tangelo block">Cost</span>{o.cost}</p>
            <p className="md:col-span-2"><span className="kicker text-tangelo block">Notes</span>{o.notes}</p>
            <p><span className="kicker text-tangelo block">Contacts</span>{o.contacts}</p>
          </div>
          <Field label="Next action"><input className="field" defaultValue={o.next_action} onBlur={(e) => set({ next_action: e.target.value })} /></Field>
          <AgentRunCard agent="catherine" task="catherine.assess" refType="opportunity" refId={o.id} label="Assess" />
          <AgentRunCard agent="diana" task="diana.opportunity_concept" refType="opportunity" refId={o.id} label="Develop a campaign idea with DIANA" hint="DIANA receives this event's details, audience, dates, participation notes and source link, plus CATHERINE's assessment if run." />
          <AgentRunCard agent="catherine" task="catherine.constraints" refType="opportunity" refId={o.id} label="Practical constraints of DIANA's idea" hint="Run after DIANA. Reviews her concept against this opportunity's requirements." />
          <AskAna refType="opportunity" refId={o.id} title={o.name} />
          <AgentRunCard dark agent="ana" task="ana.next_steps" refType="opportunity" refId={o.id} label="Consolidated next steps" />
          <div className="flex flex-wrap gap-2">
            <Btn data-testid={`opp-project-${o.id}`} onClick={toProject} disabled={o.status === "converted"}><FolderPlus className="w-3.5 h-3.5" />{o.status === "converted" ? "Already a project" : "I approve: make it a project"}</Btn>
            <Btn variant="line" data-testid={`opp-reject-${o.id}`} onClick={reject}><Ban className="w-3.5 h-3.5" />Reject</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Radar() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("verified");
  const [q, setQ] = useState({ text: "", market: "", type: "", status: "", from: "", to: "" });
  const [cmp, setCmp] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selId, setSelId] = useState(null);
  const [plan, setPlanRaw] = useState(loadPlan);
  const setPlan = (p) => { setPlanRaw(p); localStorage.setItem("radarPlan", JSON.stringify(p)); };
  const load = useCallback(() => list("opportunities").then(setItems), []);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => items.filter((o) =>
    (!q.text || `${o.name} ${o.relevance} ${o.location}`.toLowerCase().includes(q.text.toLowerCase())) && (!q.market || o.market === q.market) && (!q.type || o.type === q.type) && (!q.status || o.status === q.status) &&
    (!q.from || (o.start_date && o.start_date >= q.from)) && (!q.to || (o.start_date && o.start_date <= q.to)) &&
    (tab === "all" || (tab === "verified" ? ["verified_dates", "live_official"].includes(o.verification) : !["verified_dates", "live_official"].includes(o.verification)))
  ).sort((a, b) => (a.start_date || "9").localeCompare(b.start_date || "9")), [items, q, tab]);
  const byMonth = useMemo(() => filtered.reduce((m, o) => { const k = o.start_date ? new Date(o.start_date + "T12:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "Undated"; (m[k] = m[k] || []).push(o); return m; }, {}), [filtered]);
  const sq = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  const saveLead = async (l) => { await create("opportunities", { ...BLANK, name: l.name, type: l.type || "other", market: l.market || "Other", relevance: l.why_relevant, verification: "needs_validation", notes: "Unverified lead suggested by CATHERINE (manual mode, no live browsing). Verify on the official organiser site.", source_checked: "" }); toast.success("Saved as a lead needing validation"); load(); };
  const compared = items.filter((o) => cmp.includes(o.id));

  return (
    <div>
      <PageHead n="05" kicker="Opportunity Radar" title="Where should Conduct" accent=" show up?" sub="Discover, verify, prioritise. Nothing becomes a commitment because an agent suggested it." />
      <section className="bg-linen text-chocolate px-5 md:px-10 pb-16 space-y-10">
        <div className="bg-tangelo text-linen p-5" data-testid="research-mode-banner">
          <p className="kicker mb-1">Live research: connected (Claude web search via the Emergent key)</p>
          <p className="font-mono text-xs leading-relaxed">"Live search" runs real web searches and returns the URL behind every result. Secondary sources (aggregators, blogs) are flagged for checking on the organiser's own site, and anything CATHERINE could not find is listed as not found. The research plan, assessments and constraints cards do not search; they work from saved records. Seeded records were checked by the builder before launch.</p>
        </div>

        <div>
          <Kicker n="A">Research request · CATHERINE</Kicker>
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <div className="md:col-span-4"><MarketPicker plan={plan} setPlan={setPlan} /></div>
            <div className="md:col-span-4"><Field label="Question"><input data-testid="research-query-input" className="field" value={plan.query} onChange={(e) => setPlan({ ...plan, query: e.target.value, queryEdited: true })} /></Field><QueryCheck plan={plan} setPlan={setPlan} /></div>
            <div className="md:col-span-2"><Field label="Opportunity types"><input data-testid="research-types-input" className="field" value={plan.types} onChange={(e) => setPlan(withQuery({ ...plan, types: e.target.value }))} /></Field></div>
            <div className="md:col-span-2"><Field label="Date range"><input data-testid="research-date-input" className="field" value={plan.date_range} onChange={(e) => setPlan(withQuery({ ...plan, date_range: e.target.value }))} /></Field></div>
          </div>
          <AgentRunCard agent="catherine" task="catherine.live_research" label={`Live search · ${plan.markets.length === PRIORITY.length && PRIORITY.every((m) => plan.markets.includes(m)) ? "all four priority markets" : plan.markets.join(", ") || "all four priority markets"}`} testid="live-research" getInput={() => ({ query: plan.query, markets: plan.markets.length ? plan.markets : PRIORITY, types: plan.types, date_range: plan.date_range, today: todayISO() })} hint="Runs real web searches, at least a few per selected market. Takes 1 to 3 minutes."
            render={(o, r) => (
              <div className="space-y-4" data-testid="live-results">
                <p className="font-mono text-xs"><Claim text={o.query_interpreted} /></p>
                <p className="font-mono text-[11px] text-chocolate/60" data-testid="live-searched-markets">Markets searched: {runMarkets(r).join(" · ") || "not recorded"} · {r.input?.date_range}</p>
                <PerMarket o={o} r={r} />
                {groupByMarket(o.opportunities || [], runMarkets(r)).map(([mk, list]) => (<div key={mk} className="space-y-2" data-testid={`live-group-${slug(mk)}`}><p className="font-display uppercase text-xl border-b-2 border-chocolate pb-1">{mk} <span className="font-mono text-[10px] text-chocolate/60 normal-case">{list.length} found</span></p>
                {list.map(({ x, i }) => {
                  const saved = items.some((it) => it.source_url === x.source_url && it.name === x.name);
                  return (
                    <div key={i} className="border border-chocolate/30 p-3 grid md:grid-cols-[1fr_auto] gap-3" data-testid={`live-result-${i}`}>
                      <div className="font-mono text-xs space-y-1">
                        <p className="font-bold text-sm">{x.name} <span className={`ml-1 font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-0.5 ${x.source_type === "official" ? VERIF.live_official.cls : VERIF.live_secondary.cls}`}>{x.source_type === "official" ? "Official source" : "Secondary source, verify"}</span></p>
                        <p>{[x.city, x.country].filter(Boolean).join(", ") || x.location || "Location not found"} · <b>Dates:</b> {x.start_date}{x.end_date && x.end_date !== x.start_date ? ` to ${x.end_date}` : ""} · <b>Deadline:</b> {x.deadline} · <b>Cost:</b> {x.cost_source ? <a href={x.cost_source} target="_blank" rel="noreferrer" className="underline">{x.cost}</a> : "not found in a source"}</p>
                        {x.audience && <p className="text-chocolate/80"><span className="text-tangelo">Audience · </span>{x.audience}</p>}
                        <p className="text-chocolate/80"><span className="text-tangelo">Participation · </span>{x.participation_options || "not found"}</p>
                        <p className="text-chocolate/80"><span className="text-tangelo">Evidence · </span>{x.evidence}</p>
                        <p className="text-chocolate/80"><span className="text-tangelo">Why Conduct · </span>{x.why_relevant}</p>
                        {x.unknowns?.length > 0 && <p className="text-chocolate/60">Unknown: {x.unknowns.join("; ")}</p>}
                        {x.next_action && <p className="text-chocolate/80"><span className="text-tangelo">Next · </span>{x.next_action}</p>}
                        <a href={x.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-tangelo underline-grow">{x.source_url} <ExternalLink className="w-3 h-3" /></a>
                        <p className="text-chocolate/50">Checked {x.date_checked || r.created_at.slice(0, 10)}</p>
                      </div>
                      <Btn variant="line" className="!py-1 self-start" data-testid={`live-save-${i}`} disabled={saved} onClick={async () => {
                        const dt = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : "");
                        const rec = await create("opportunities", { ...BLANK, name: x.name, type: TYPES.includes(x.type) ? x.type : "other", market: toMarket(x.market), research_market: x.market, city: x.city || "", country: x.country || "", date_checked: x.date_checked || r.created_at.slice(0, 10), live_run_id: r.id, unknowns: x.unknowns || [], cost_source: x.cost_source || "", location: [x.city, x.country].filter(Boolean).join(", ") || x.location, start_date: dt(x.start_date), end_date: dt(x.end_date), deadline: x.deadline, cost: x.cost, source_url: x.source_url, verification: x.source_type === "official" ? "live_official" : "live_secondary", audience: x.audience, relevance: x.why_relevant, participation: x.participation_options, next_action: x.next_action, notes: `Live search ${r.created_at.slice(0, 10)} (run ${r.id.slice(0, 8)}). Evidence: ${x.evidence}. Unknown: ${(x.unknowns || []).join("; ")}`, source_checked: `${r.created_at.slice(0, 10)} (live web search)` });
                        toast.success("Saved with its source, location and unknowns. Opening it so you can pass it to DIANA."); await load(); setSelId(rec.id); setTimeout(() => document.querySelector("[data-testid^=opp-detail]")?.scrollIntoView({ behavior: "smooth" }), 300);
                      }}>{saved ? "Saved" : "Save and open"}</Btn>
                    </div>
                  );
                })}</div>))}
                {!(o.opportunities || []).length && <Note>No verifiable opportunities came back for these markets. That's a real result, not an error. Try a wider date range or different types.</Note>}
                {o.could_not_find?.length > 0 && <div><p className="kicker text-tangelo mb-1">Could not find</p>{o.could_not_find.map((x, i) => <p key={i} className="font-mono text-xs">· {x}</p>)}</div>}
                {o.caveats && <Note>{o.caveats}</Note>}
              </div>
            )} />
          <AgentRunCard agent="catherine" task="catherine.research_plan" label="Research plan (no search)" getInput={() => plan}
            render={(o) => (
              <div className="space-y-5">
                <Tag tone="solid">{o.mode_note}</Tag>
                <p className="font-mono text-sm"><Claim text={o.interpretation} /></p>
                <div><p className="kicker text-tangelo mb-2">Search queries to run</p>{(o.search_queries || []).map((x, i) => <p key={i} className="font-mono text-xs py-1 border-b border-chocolate/15">{x}</p>)}</div>
                <div><p className="kicker text-tangelo mb-2">Official sources to check</p>{(o.official_sources_to_check || []).map((x, i) => <p key={i} className="font-mono text-xs py-1">{x.source}, <span className="text-chocolate/70">{x.why}</span></p>)}</div>
                <div data-testid="research-leads"><p className="kicker text-tangelo mb-2">Candidate leads, UNVERIFIED</p>
                  {(o.candidate_leads || []).map((l, i) => (
                    <div key={i} className="flex flex-wrap items-start justify-between gap-3 py-2 border-b border-chocolate/15">
                      <div className="font-mono text-xs"><span className="font-bold">{l.name}</span> · {l.market} · {l.type}<p className="text-chocolate/70">{l.why_relevant}</p></div>
                      <Btn variant="line" className="!py-1" data-testid={`save-lead-${i}`} onClick={() => saveLead(l)}>Save as lead</Btn>
                    </div>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><p className="kicker text-tangelo mb-2">Selection criteria</p>{(o.selection_criteria || []).map((x, i) => <p key={i} className="font-mono text-xs py-0.5">· {x}</p>)}</div>
                  <div><p className="kicker text-tangelo mb-2">Before committing</p>{(o.questions_before_committing || []).map((x, i) => <p key={i} className="font-mono text-xs py-0.5">· {x}</p>)}</div>
                </div>
              </div>
            )} />
        </div>

        <div className="grid xl:grid-cols-[180px_minmax(0,1fr)_420px] gap-6 items-start" data-testid="radar-workspace">
          <aside className="space-y-5 xl:sticky xl:top-20" data-testid="radar-lists">
            <div><p className="kicker text-tangelo mb-2">Saved lists</p>{[["", "All"], ["saved", "Saved"], ["shortlisted", "Shortlisted"], ["watch", "Watching"], ["converted", "Projects"], ["rejected", "Rejected"]].map(([k, l]) => <button key={l} data-testid={`list-${l.toLowerCase()}`} onClick={() => { setQ({ ...q, status: k }); setTab("all"); }} className={`block w-full text-left font-mono text-xs py-1.5 px-2 ${q.status === k ? "bg-chocolate text-linen" : "hover:bg-paper"}`}>{l} <span className="opacity-60">({k ? items.filter((o) => o.status === k).length : items.length})</span></button>)}</div>
            <div><p className="kicker text-tangelo mb-2">Categories</p>{TYPES.filter((t) => items.some((o) => o.type === t)).map((t) => <button key={t} onClick={() => setQ({ ...q, type: q.type === t ? "" : t })} className={`block w-full text-left font-mono text-[11px] py-1 px-2 ${q.type === t ? "bg-tangelo text-linen" : "hover:bg-paper"}`}>{t.replace(/_/g, " ")}</button>)}</div>
          </aside>
          <div className="min-w-0">
          <Kicker n="B">Opportunities</Kicker>
          <div className="grid md:grid-cols-6 gap-3 mb-4" data-testid="opp-filters">
            <div className="md:col-span-2"><input data-testid="opp-search" className="field" placeholder="Search…" value={q.text} onChange={sq("text")} /></div>
            <select data-testid="opp-filter-market" className="field" value={q.market} onChange={sq("market")}><option value="">All markets</option>{MARKETS.map((m) => <option key={m}>{m}</option>)}</select>
            <select data-testid="opp-filter-type" className="field" value={q.type} onChange={sq("type")}><option value="">All types</option>{TYPES.map((m) => <option key={m}>{m}</option>)}</select>
            <input type="date" className="field" value={q.from} onChange={sq("from")} title="From" />
            <input type="date" className="field" value={q.to} onChange={sq("to")} title="To" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex gap-1">
              {[["verified", "Verified calendar"], ["validate", "Needs validation"], ["all", "All"]].map(([k, l]) => <button key={k} data-testid={`opp-tab-${k}`} onClick={() => setTab(k)} className={`font-mono text-[10px] tracking-[0.14em] uppercase px-4 py-2 border-2 ${tab === k ? "bg-chocolate text-linen border-chocolate" : "border-chocolate/40 hover:border-tangelo"}`}>{l}</button>)}
              <select className="field !w-auto ml-2" value={q.status} onChange={sq("status")}><option value="">Any status</option>{OPP_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <Btn variant="accent" data-testid="opp-add-btn" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Add opportunity</Btn>
          </div>
          {showForm && <div className="mb-6"><OppForm onSaved={() => { load(); setShowForm(false); }} /></div>}
          {!filtered.length ? <Empty title="Nothing matches.">Adjust filters or add an opportunity with its official source.</Empty> :
            tab === "verified" ? Object.entries(byMonth).map(([m, xs]) => (
              <div key={m} className="mb-6"><p className="font-display uppercase text-3xl text-tangelo mb-1">{m}</p><div className="border-t-2 border-chocolate">{xs.map((o) => <OppRow key={o.id} o={o} reload={load} cmp={cmp.includes(o.id)} toggleCmp={() => setCmp(cmp.includes(o.id) ? cmp.filter((x) => x !== o.id) : [...cmp, o.id])} selected={selId === o.id} onSelect={() => setSelId(o.id)} />)}</div></div>
            )) : <div className="border-t-2 border-chocolate">{filtered.map((o) => <OppRow key={o.id} o={o} reload={load} cmp={cmp.includes(o.id)} toggleCmp={() => setCmp(cmp.includes(o.id) ? cmp.filter((x) => x !== o.id) : [...cmp, o.id])} selected={selId === o.id} onSelect={() => setSelId(o.id)} />)}</div>}
        </div>
          <aside className="xl:sticky xl:top-20 border-2 border-chocolate bg-paper p-5 max-h-[85vh] overflow-y-auto scroll-thin" data-testid="radar-detail">
            {items.find((o) => o.id === selId) ? <OppRow detail o={items.find((o) => o.id === selId)} reload={load} /> : <Empty title="Select an opportunity.">Details, CATHERINE's assessment, DIANA's campaign idea and next steps open here.</Empty>}
          </aside>
        </div>

        {compared.length > 1 && (
          <div data-testid="opp-compare-table">
            <Kicker n="C">Compare</Kicker>
            <div className="overflow-x-auto scroll-thin border-2 border-chocolate">
              <table className="w-full min-w-[700px] font-mono text-xs">
                <tbody>{["name", "verification", "market", "location", "start_date", "deadline", "audience", "relevance", "cost", "status", "source_url"].map((k) => (
                  <tr key={k} className="border-b border-chocolate/20"><td className="kicker text-tangelo p-3 w-36 bg-paper">{k.replace("_", " ")}</td>{compared.map((o) => <td key={o.id} className="p-3 align-top">{k === "source_url" && o[k] ? <a href={o[k]} target="_blank" rel="noreferrer" className="text-tangelo underline-grow">open</a> : o[k] || ", "}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <Kicker n="D">ANA · prioritise</Kicker>
          <Note className="mb-3">{cmp.length ? `ANA will rank the ${cmp.length} selected opportunities.` : "Select opportunities with the checkboxes, or ANA will rank all non-rejected ones."}</Note>
          <AgentRunCard dark agent="ana" task="ana.prioritise_opportunities" label="Prioritise candidates" getInput={() => ({ opportunity_ids: cmp })} />
        </div>
      </section>
    </div>
  );
}
