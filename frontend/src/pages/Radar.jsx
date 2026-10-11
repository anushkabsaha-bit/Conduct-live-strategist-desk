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
  const [plan, setPlan] = useState({ query: "Could Conduct be represented at a relevant developer event in Germany next year?", markets: "Germany / Europe", types: "developer conferences, hackathons, communities", date_range: "next 12–18 months" });
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
            <div className="md:col-span-4"><Field label="Question"><input data-testid="research-query-input" className="field" value={plan.query} onChange={(e) => setPlan({ ...plan, query: e.target.value })} /></Field></div>
            <Field label="Markets"><input className="field" value={plan.markets} onChange={(e) => setPlan({ ...plan, markets: e.target.value })} /></Field>
            <Field label="Opportunity types"><input className="field" value={plan.types} onChange={(e) => setPlan({ ...plan, types: e.target.value })} /></Field>
            <Field label="Date range"><input className="field" value={plan.date_range} onChange={(e) => setPlan({ ...plan, date_range: e.target.value })} /></Field>
          </div>
          <AgentRunCard agent="catherine" task="catherine.live_research" label="Live search" testid="live-research" getInput={() => ({ ...plan, today: todayISO() })} hint="Runs real web searches. Takes 1 to 3 minutes."
            render={(o, r) => (
              <div className="space-y-4" data-testid="live-results">
                <p className="font-mono text-xs"><Claim text={o.query_interpreted} /></p>
                <p className="font-mono text-[11px] text-chocolate/60">Searched for: {(o.searched_for || []).join(" · ")}</p>
                {(o.opportunities || []).map((x, i) => {
                  const saved = items.some((it) => it.source_url === x.source_url && it.name === x.name);
                  return (
                    <div key={i} className="border border-chocolate/30 p-3 grid md:grid-cols-[1fr_auto] gap-3" data-testid={`live-result-${i}`}>
                      <div className="font-mono text-xs space-y-1">
                        <p className="font-bold text-sm">{x.name} <span className={`ml-1 font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-0.5 ${x.source_type === "official" ? VERIF.live_official.cls : VERIF.live_secondary.cls}`}>{x.source_type === "official" ? "Official source" : "Secondary source, verify"}</span></p>
                        <p>{x.location} · {x.market} · <b>Dates:</b> {x.start_date}{x.end_date && x.end_date !== x.start_date ? ` to ${x.end_date}` : ""} · <b>Deadline:</b> {x.deadline} · <b>Cost:</b> {x.cost}</p>
                        <p className="text-chocolate/80"><span className="text-tangelo">Evidence · </span>{x.evidence}</p>
                        <p className="text-chocolate/80"><span className="text-tangelo">Why Conduct · </span>{x.why_relevant}</p>
                        {x.unknowns?.length > 0 && <p className="text-chocolate/60">Unknown: {x.unknowns.join("; ")}</p>}
                        <a href={x.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-tangelo underline-grow">{x.source_url} <ExternalLink className="w-3 h-3" /></a>
                      </div>
                      <Btn variant="line" className="!py-1 self-start" data-testid={`live-save-${i}`} disabled={saved} onClick={async () => {
                        const dt = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : "");
                        await create("opportunities", { ...BLANK, name: x.name, type: TYPES.includes(x.type) ? x.type : "other", market: MARKETS.includes(x.market) ? x.market : "Other", location: x.location, start_date: dt(x.start_date), end_date: dt(x.end_date), deadline: x.deadline, cost: x.cost, source_url: x.source_url, verification: x.source_type === "official" ? "live_official" : "live_secondary", audience: x.audience, relevance: x.why_relevant, participation: x.participation_options, next_action: x.next_action, notes: `Live search ${r.created_at.slice(0, 10)} (run ${r.id.slice(0, 8)}). Evidence: ${x.evidence}. Unknown: ${(x.unknowns || []).join("; ")}`, source_checked: `${r.created_at.slice(0, 10)} (live web search)` });
                        toast.success("Saved to the radar with its source and unknowns"); load();
                      }}>{saved ? "Saved" : "Save to radar"}</Btn>
                    </div>
                  );
                })}
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
