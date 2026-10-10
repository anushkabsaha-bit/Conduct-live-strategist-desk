import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import { Btn, Empty, Field, Kicker, Note, PageHead, Tag } from "../components/kit";
import { usePosts } from "../components/Output";
import { create, http, list, remove } from "../lib/api";
import { AGENTS, fmtDate } from "../lib/meta";

const TABS = [["prompts", "Original agent prompts"], ["posts", "Historical posts & data"], ["strategy", "Growth OS strategy"], ["architecture", "Agent architecture"], ["public", "Public sources & research"], ["work", "Drafts, projects & decisions"]];
const LOOP = ["Observe", "Analyse", "Find opportunities", "Create / Develop", "Challenge / Pressure-test", "Execute", "Measure", "Learn", "Repeat"];
const ARCH = [
  ["ana", "Filters everything. Tells me what matters, what's working, what's not, what others are finding and what to do next. Delegates when she needs more clarity or deeper investigation.", "Delegation / direction to all five specialists; synthesises & prioritises."],
  ["agatha", "Analyses Conduct's historical content and performance, identifies patterns, tests hypotheses and forecasts how future content is likely to perform.", "Two-way collaboration with BERDINE; insight flow with EDITH."],
  ["berdine", "Evaluates ideas, sharpens editorial judgement and helps build Conduct's voice across channels (LinkedIn, Substack, Medium, app, etc.). Tracks tech & content trends. Uses Agatha's insights to refine content. I make the final call.", "Two-way with AGATHA; works with EDITH."],
  ["catherine", "Scouts events, communities, companies, people and moments across the UK & Europe where Conduct should be represented. Looks at who will be there, tech concentration, relevance, contacts, permissions and practical requirements.", "Two-way collaboration with DIANA; insight flow to EDITH."],
  ["diana", "Pressure-tests ideas for brand awareness, campaigns, OOH and activations. Challenges assumptions, checks feasibility, execution capability, likely impact, costs and real-world opportunity.", "Two-way with CATHERINE; insight flow to EDITH."],
  ["edith", "Turns product launches and customer visits into stories and content. Helps with questionnaires, questions, metrics, proof points and success signals. For launches, clarifies owners, departments, voice, agency briefs and success metrics. Works with Berdine & Diana to create content and campaigns.", "Receives insight from AGATHA, CATHERINE, DIANA; works with BERDINE."],
];

function Posts() {
  const { posts, summary } = usePosts();
  const [params] = useSearchParams();
  const [sort, setSort] = useState("id");
  const hl = params.get("post");
  const rows = useMemo(() => [...posts].sort((a, b) => sort === "id" ? a.id.localeCompare(b.id) : (b[sort] ?? -1) - (a[sort] ?? -1)), [posts, sort]);
  if (!summary) return <Note>Loading dataset…</Note>;
  return (
    <div data-testid="posts-table">
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-chocolate/30 mb-6">
        {[["Rows", summary.rows], ["Likes (rows)", summary.likes_sum.toLocaleString()], ["Comments (rows)", summary.comments_sum.toLocaleString()], ["Reposts (rows)", summary.reposts_sum]].map(([k, v]) => (
          <div key={k} className="border-r border-b border-chocolate/30 p-5"><p className="font-display text-4xl text-tangelo leading-none">{v}</p><p className="kicker text-chocolate/70 mt-2">{k}</p></div>
        ))}
      </div>
      <ul className="mb-6 space-y-1">{summary.notes.map((n) => <li key={n} className="font-mono text-[11px] text-chocolate/80">· {n}</li>)}</ul>
      <div className="flex gap-2 mb-3 items-center"><span className="kicker text-tangelo">Sort</span>{["id", "likes", "comments", "reposts"].map((s) => <button key={s} data-testid={`posts-sort-${s}`} onClick={() => setSort(s)} className={`font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-1 border ${sort === s ? "bg-chocolate text-linen" : "border-chocolate/40"}`}>{s}</button>)}</div>
      <div className="overflow-x-auto scroll-thin border-2 border-chocolate">
        <table className="w-full min-w-[800px] font-mono text-xs">
          <thead className="bg-chocolate text-linen"><tr>{["Id", "Month", "Post (description)", "Likes", "Comments", "Reposts", "Note"].map((h) => <th key={h} className="kicker text-left px-3 py-2.5">{h}</th>)}</tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id} id={p.id} className={`border-b border-chocolate/20 ${hl === p.id ? "bg-tangelo/20" : "hover:bg-botticelli/20"}`}>
              <td className="px-3 py-2.5 text-tangelo">{p.id}</td><td className="px-3 py-2.5">{p.month}</td><td className="px-3 py-2.5 max-w-md">{p.description}</td>
              {["likes", "comments", "reposts"].map((k) => <td key={k} className="px-3 py-2.5">{p[k] ?? <span className="text-chocolate/40">n/a</span>}</td>)}
              <td className="px-3 py-2.5 text-chocolate/60 italic max-w-xs">{p.note}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function Prompts({ sources }) {
  const [open, setOpen] = useState(null);
  const [text, setText] = useState("");
  useEffect(() => { if (open) http.get(`/agents/${open}/prompt`).then((r) => setText(r.data.original)); }, [open]);
  return (
    <div className="space-y-2">
      {sources.filter((s) => s.category === "original_prompts").map((s) => (
        <div key={s.id} className="border-2 border-chocolate">
          <button data-testid={`prompt-source-${s.ref}`} onClick={() => setOpen(open === s.ref ? null : s.ref)} className="w-full flex flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-paper transition-colors" style={{ borderLeft: `6px solid ${AGENTS[s.ref]?.color}` }}>
            <span className="font-display uppercase text-2xl">{s.title}</span>
            <span className="flex gap-2"><Tag tone="green">{s.status}</Tag><Tag>{s.kind}</Tag><span className="font-mono text-[10px]">{s.detail}</span></span>
          </button>
          {open === s.ref && <pre className="whitespace-pre-wrap font-mono text-[11px] p-4 bg-paper max-h-[480px] overflow-auto border-t border-chocolate/30">{text || "Loading…"}</pre>}
        </div>
      ))}
      <Note className="pt-2">Originals are read-only. Revisions are stored separately in the Agent Room prompt registry.</Note>
    </div>
  );
}

function Strategy() {
  const [t, setT] = useState("");
  useEffect(() => { http.get("/sources/growth-os").then((r) => setT(r.data.text)).catch(() => setT("")); }, []);
  return <div className="max-w-3xl"><Tag tone="green" className="mb-4">Ingested · text extracted from PDF</Tag><p className="font-mono text-sm leading-relaxed whitespace-pre-wrap" data-testid="growth-os-text">{t || "Loading…"}</p></div>;
}

function Architecture() {
  return (
    <div className="space-y-8" data-testid="architecture">
      <Tag tone="blue">Transcribed manually from the supplied diagram image</Tag>
      <div className="grid md:grid-cols-3 gap-0 border-t border-l border-chocolate/30">
        {ARCH.map(([id, d, rel]) => (
          <div key={id} className="border-r border-b border-chocolate/30 p-6" style={{ borderTop: `5px solid ${AGENTS[id].color}` }}>
            <p className="font-display uppercase text-3xl" style={{ color: AGENTS[id].color }}>{AGENTS[id].name}</p>
            <p className="kicker text-chocolate/70 mb-3">{AGENTS[id].title}</p>
            <p className="font-mono text-xs leading-relaxed mb-3">{d}</p>
            <p className="font-hand text-lg text-chocolate/70">{rel}</p>
          </div>
        ))}
      </div>
      <div className="bg-chocolate text-linen p-6"><p className="kicker text-botticelli mb-4">The operating loop</p><div className="flex flex-wrap gap-2 items-center">{LOOP.map((l, i) => <React.Fragment key={l}><span className="font-display uppercase text-xl">{l}</span>{i < LOOP.length - 1 && <span className="text-tangelo">→</span>}</React.Fragment>)}</div></div>
    </div>
  );
}

function PublicSources({ sources, reload }) {
  const [opps, setOpps] = useState([]);
  const [f, setF] = useState({ title: "", url: "", detail: "" });
  useEffect(() => { list("opportunities").then(setOpps); }, []);
  const add = async () => { await create("sources", { ...f, category: "public_sources", kind: "url", status: "reference (not ingested)", ref: "", created_by_user: true }); setF({ title: "", url: "", detail: "" }); toast.success("Source saved as a reference"); reload(); };
  return (
    <div className="space-y-8">
      <div>
        {sources.filter((s) => s.category === "public_sources" || s.category === "historical_posts" || s.category === "strategy" || s.category === "architecture").map((s) => (
          <div key={s.id} className="flex flex-wrap justify-between gap-3 py-3 border-b border-chocolate/25">
            <div><p className="font-mono text-sm font-bold">{s.title}</p><p className="font-mono text-[11px] text-chocolate/70">{s.detail}</p></div>
            <div className="flex items-center gap-3"><Tag tone={s.status === "ingested" ? "green" : "line"}>{s.status}</Tag>{s.url && <a href={s.url} target="_blank" rel="noreferrer" className="text-tangelo"><ExternalLink className="w-4 h-4" /></a>}{!["original_prompts"].includes(s.category) && s.created_by_user && <button onClick={async () => { await remove("sources", s.id); reload(); }}><Trash2 className="w-4 h-4" /></button>}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-4 gap-3 border-2 border-chocolate p-4 bg-paper" data-testid="add-source-form">
        <Field label="Title"><input data-testid="source-title-input" className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="URL"><input data-testid="source-url-input" className="field" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
        <Field label="What it supports"><input className="field" value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} /></Field>
        <div className="flex items-end"><Btn variant="accent" data-testid="source-add-btn" onClick={() => add().then(() => {})} disabled={!f.title}>Add reference</Btn></div>
        <p className="md:col-span-4 font-mono text-[10px] text-chocolate/60">File upload/ingestion is not configured in this deployment — references are stored as links, not ingested content.</p>
      </div>
      <div>
        <Kicker>Research records (opportunity sources)</Kicker>
        {opps.map((o) => (
          <div key={o.id} className="flex flex-wrap justify-between gap-3 py-2 border-b border-chocolate/20 font-mono text-xs">
            <span>{o.name} <span className="text-chocolate/60">· {o.verification.replace("_", " ")} · checked {o.source_checked || "—"}</span></span>
            {o.source_url ? <a href={o.source_url} target="_blank" rel="noreferrer" className="text-tangelo underline-grow">{o.source_url}</a> : <span className="text-chocolate/50">no source</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Work() {
  const [d, setD] = useState({ drafts: [], projects: [], decisions: [] });
  const load = useCallback(async () => setD({ drafts: await list("drafts"), projects: await list("projects"), decisions: await list("decisions") }), []);
  useEffect(() => { load(); }, [load]);
  const del = async (c, id) => { if (window.confirm("Delete this item?")) { await remove(c, id); load(); } };
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {[["drafts", "Drafts", (x) => `${x.title} · v${x.versions.length} · ${x.status}`], ["projects", "Projects", (x) => `${x.name} · ${x.status}`], ["decisions", "Decisions log", (x) => `${x.choice} — ${x.note || ""} · ${fmtDate(x.created_at)}`]].map(([c, t, fn]) => (
        <div key={c} data-testid={`work-${c}`}>
          <p className="font-display uppercase text-2xl mb-3">{t}</p>
          {d[c].length ? d[c].map((x) => (
            <div key={x.id} className="flex justify-between gap-2 py-2 border-b border-chocolate/20 font-mono text-xs">
              <span>{fn(x)}{c === "projects" && x.context?.sources?.length > 0 && <a href={x.context.sources[0]} target="_blank" rel="noreferrer" className="block text-tangelo">source</a>}</span>
              <button onClick={() => del(c, x.id)} className="text-chocolate/40 hover:text-tangelo shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )) : <Empty title="Nothing yet.">Items you create appear here.</Empty>}
        </div>
      ))}
    </div>
  );
}

export default function Library() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || (params.get("post") ? "posts" : "prompts");
  const [sources, setSources] = useState([]);
  const load = useCallback(() => list("sources").then(setSources), []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <PageHead n="07" kicker="Source Library" title="Source library" accent="." sub="What each claim stands on. Supplied materials, verified public sources, research collected here, and your own work." />
      <section className="bg-linen text-chocolate px-5 md:px-10 pb-16">
        <div className="flex flex-wrap gap-1 mb-8" data-testid="library-tabs">
          {TABS.map(([k, l]) => <button key={k} data-testid={`library-tab-${k}`} onClick={() => setParams({ tab: k })} className={`font-mono text-[10px] tracking-[0.14em] uppercase px-4 py-2 border-2 transition-colors ${tab === k ? "bg-chocolate text-linen border-chocolate" : "border-chocolate/40 hover:border-tangelo"}`}>{l}</button>)}
        </div>
        {tab === "prompts" && <Prompts sources={sources} />}
        {tab === "posts" && <Posts />}
        {tab === "strategy" && <Strategy />}
        {tab === "architecture" && <Architecture />}
        {tab === "public" && <PublicSources sources={sources} reload={load} />}
        {tab === "work" && <Work />}
      </section>
    </div>
  );
}
