import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpRight, Check, Trash2, ChevronDown } from "lucide-react";
import { AgentChip, Btn, Empty, Kicker, Tag } from "../components/kit";
import { Claim } from "../components/Output";
import AgentRunCard from "../components/AgentRunCard";
import MakeTask from "../components/MakeTask";
import WeekCalendar, { blocksOn } from "../components/WeekCalendar";
import BlockDialog from "../components/BlockDialog";
import { list, remove, update } from "../lib/api";
import { AGENTS, fmtDate, todayISO } from "../lib/meta";

const greet = () => { const h = new Date().getHours(); return h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening"; };
const IMP = { high: 0, medium: 1, low: 2 };

const QUICK = [
  ["Write or review content", "/content", "berdine"],
  ["Prepare a founder briefing", "/founder", "edith"],
  ["Develop a product story", "/stories", "edith"],
  ["Research opportunities", "/radar", "catherine"],
  ["Plan a launch", "/launch", "ana"],
  ["Plan a campaign", "/campaigns", "diana"],
  ["Review communications impact", "/impact", "agatha"],
];

function Briefing({ o, nav }) {
  return (
    <div className="space-y-8">
      <p className="font-serifit italic text-2xl md:text-3xl leading-snug" data-testid="ana-briefing-text"><Claim text={o.briefing} /></p>
      <div>
        <p className="kicker text-botticelli mb-3">Ranked priorities</p>
        <div className="border-t border-linen/25">
          {(o.priorities || []).map((p, i) => (
            <div key={i} data-testid={`ana-priority-${i}`} className="grid md:grid-cols-[48px_1fr_220px] gap-3 py-4 border-b border-linen/20">
              <span className="font-display text-3xl text-tangelo leading-none">{String(p.rank || i + 1).padStart(2, "0")}</span>
              <div>
                <p className="font-mono text-sm font-bold mb-1"><Claim text={p.title} /></p>
                <p className="font-mono text-xs text-linen/80 mb-1"><span className="text-botticelli">Why · </span><Claim text={p.why_it_matters} /></p>
                <p className="font-mono text-xs text-linen/80 mb-1"><span className="text-botticelli">Next · </span><Claim text={p.next_action} /></p>
                {p.tradeoff && <p className="font-mono text-[11px] text-linen/60 italic"><span className="text-botticelli not-italic">Trade-off · </span><Claim text={p.tradeoff} /></p>}
                <div className="mt-2"><MakeTask dark testid={`priority-make-task-${i}`} title={p.title} agent={Object.keys(AGENTS).find((a) => (p.owner || "").toLowerCase().includes(a))} why={p.why_it_matters} nextAction={p.next_action} context={{ source: "ana.briefing", priority: p }} /></div>
              </div>
              <div className="flex md:flex-col gap-1.5 flex-wrap md:items-end">
                <Tag tone="lineDark">Due {p.deadline}</Tag>
                <Tag tone="lineDark">Impact {p.impact}</Tag><Tag tone="lineDark">Urgency {p.urgency}</Tag><Tag tone="lineDark">Effort {p.effort}</Tag><Tag tone="lineDark">Confidence {p.confidence}</Tag>
              </div>
            </div>
          ))}
        </div>
      </div>
      {!!o.proposed_delegations?.length && (
        <div>
          <p className="kicker text-botticelli mb-3">Proposed delegations, not yet run</p>
          <div className="grid md:grid-cols-2 gap-3">
            {o.proposed_delegations.map((d, i) => {
              const a = Object.keys(AGENTS).find((x) => (d.agent || "").toLowerCase().includes(x));
              return (
                <div key={i} className="border border-linen/30 p-4">
                  <div className="flex items-center justify-between mb-2"><AgentChip id={a} /><Tag tone="lineDark">Proposal</Tag></div>
                  <p className="font-mono text-xs mb-1"><Claim text={d.task} /></p>
                  <p className="font-mono text-[11px] text-linen/60 mb-3"><Claim text={d.reason} /></p>
                  {a && <Btn variant="lineDark" data-testid={`delegate-open-${i}`} onClick={() => nav(`/agents?agent=${a}&prefill=${encodeURIComponent(`ANA proposed: ${d.task}. Reason: ${d.reason}`)}`)}>Open {AGENTS[a].name}<ArrowUpRight className="w-3.5 h-3.5" /></Btn>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-6">
        {[["Missing information", o.missing_information], ["Risks", o.risks], ["Deprioritised", (o.deprioritised || []).map((d) => `${d.item}, ${d.reason}`)]].map(([t, xs]) => (
          <div key={t}><p className="kicker text-botticelli mb-2">{t}</p><ul className="space-y-1.5">{(xs || []).map((x, i) => <li key={i} className="font-mono text-xs text-linen/80"><span className="text-tangelo mr-2">×</span><Claim text={x} /></li>)}</ul></div>
        ))}
      </div>
    </div>
  );
}

function MyDesk({ strat = [], decisions, drafts, stories, open, tasks }) {
  const name = (d) => d.label || drafts.find((x) => x.id === d.ref_id)?.title || stories.find((x) => x.id === d.ref_id)?.title || d.ref_type;
  const editorial = decisions.filter((d) => !String(d.choice).startsWith("status:")).slice(0, 6);
  const questions = [
    ...drafts.filter((d) => (d.decision?.facts_to_check || "").trim()).map((d) => ({ k: d.id, t: d.decision.facts_to_check, w: `Fact check · ${d.title}`, to: `/content?draft=${d.id}` })),
    ...(strat.find((x) => x.key === "narrative")?.questions || []).slice(0, 3).map((q, i) => ({ k: "sq" + i, t: q, w: "Question for Conduct · Launch strategy", to: "/strategy/narrative#questions" })),
    ...stories.flatMap((s) => (s.open_questions || []).slice(0, 2).map((q, i) => ({ k: s.id + i, t: q, w: `Story · ${s.title}`, to: "/stories" }))),
  ].slice(0, 7);
  const undecided = drafts.filter((d) => !d.decision?.final && d.versions?.[0]?.text);
  return (
    <section className="bg-linen text-chocolate px-5 md:px-10 pb-14" data-testid="my-desk">
      <Kicker n="A">My desk · decisions, questions and next actions</Kicker>
      <div className="grid md:grid-cols-3 border-t border-l border-chocolate/30">
        <div className="border-r border-b border-chocolate/30 p-6" data-testid="my-decisions">
          <p className="font-display uppercase text-2xl mb-4">Decisions I've recorded</p>
          {editorial.length ? editorial.map((d) => (
            <div key={d.id} className="py-2 border-b border-chocolate/20 font-mono text-xs"><span className="kicker text-tangelo block">{fmtDate(d.created_at)} · {name(d)}</span><b>{d.choice}</b>{d.note ? `: ${d.note}` : ""}</div>
          )) : <Empty title="No decisions yet.">Record one in Content Desk under My editorial decision.</Empty>}
          {undecided.length > 0 && <p className="font-mono text-[11px] mt-3"><span className="text-tangelo">Waiting on my judgement: </span>{undecided.map((d) => <Link key={d.id} to={`/content?draft=${d.id}`} className="underline-grow mr-2">{d.title}</Link>)}</p>}
        </div>
        <div className="border-r border-b border-chocolate/30 p-6" data-testid="my-questions">
          <p className="font-display uppercase text-2xl mb-4">Outstanding questions</p>
          {questions.length ? questions.map((q) => <Link key={q.k} to={q.to} className="block py-2 border-b border-chocolate/20 font-mono text-xs hover:text-tangelo"><span className="kicker text-tangelo block">{q.w}</span>{q.t}</Link>) : <Empty title="Nothing open.">Facts to check and story questions collect here.</Empty>}
        </div>
        <div className="border-r border-b border-chocolate/30 p-6" data-testid="my-next-actions">
          <p className="font-display uppercase text-2xl mb-4">Next actions</p>
          {open.slice(0, 5).map((t) => <div key={t.id} className="py-2 border-b border-chocolate/20 font-mono text-xs"><span className="kicker text-tangelo block">{t.due ? `Due ${t.due}` : "No date"} · {t.status}</span>{t.next_action || t.title}</div>)}
          {!open.length && <Empty title="Clear.">No open tasks.</Empty>}
        </div>
      </div>
    </section>
  );
}

function TaskRow({ t, reload }) {
  const [open, setOpen] = useState(false);
  const done = t.status === "done";
  const toggle = async () => { await update("tasks", t.id, { status: done ? "open" : "done" }); reload(); };
  const del = async () => { await remove("tasks", t.id); toast.success("Task deleted"); reload(); };
  return (
    <div data-testid={`task-row-${t.id}`} className="border-b border-chocolate/25 py-3">
      <div className="flex items-start gap-3">
        <button data-testid={`task-toggle-${t.id}`} onClick={toggle} className={`mt-0.5 w-5 h-5 border-2 border-chocolate flex items-center justify-center shrink-0 transition-colors ${done ? "bg-chocolate text-linen" : "hover:bg-tangelo/20"}`}>{done && <Check className="w-3 h-3" />}</button>
        <div className="flex-1 min-w-0">
          <p className={`font-mono text-sm ${done ? "line-through opacity-50" : ""}`}>{t.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {AGENTS[t.agent] ? <AgentChip id={t.agent} /> : <Tag>{t.agent}</Tag>}
            <select data-testid={`task-status-${t.id}`} className="font-mono text-[10px] uppercase bg-transparent border border-chocolate/40 px-1" value={t.status} onChange={async (e) => { await update("tasks", t.id, { status: e.target.value }); reload(); }}>{["open", "in_progress", "done", "approved"].map((x) => <option key={x}>{x}</option>)}</select><Tag>{t.kind?.replace("_", " ")}</Tag>{t.project_id && <Tag tone="dark">Project linked</Tag>}{t.due && <Tag tone="blue">Due {t.due}</Tag>}{t.illustrative && <Tag>Illustrative</Tag>}
          </div>
        </div>
        <button onClick={() => setOpen(!open)} data-testid={`task-expand-${t.id}`} className="text-chocolate/60 hover:text-tangelo"><ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} /></button>
        <button onClick={del} data-testid={`task-delete-${t.id}`} className="text-chocolate/40 hover:text-tangelo"><Trash2 className="w-4 h-4" /></button>
      </div>
      {open && (
        <div className="ml-8 mt-3 font-mono text-xs space-y-1.5 text-chocolate/85">
          {t.why && <p><span className="text-tangelo">Why · </span>{t.why}</p>}
          {t.next_action && <p><span className="text-tangelo">Next · </span>{t.next_action}</p>}
          {t.context && Object.keys(t.context).length > 0 && <pre className="whitespace-pre-wrap bg-paper border border-chocolate/30 p-2 text-[10px] max-h-48 overflow-auto">{JSON.stringify(t.context, null, 1)}</pre>}
        </div>
      )}
    </div>
  );
}

export default function DailyDesk() {
  const nav = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [stories, setStories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [strat, setStrat] = useState([]);
  const [sel, setSel] = useState(null);
  const load = useCallback(() => {
    list("calendar").then(setBlocks); list("tasks").then(setTasks); list("drafts").then(setDrafts); list("stories").then(setStories); list("projects").then(setProjects); list("decisions").then(setDecisions); list("strategy").then(setStrat).catch(() => {});
  }, []);
  useEffect(load, [load]);
  const today = todayISO();
  const todays = blocksOn(blocks, today);
  const open = tasks.filter((t) => t.status !== "done").sort((a, b) => (IMP[a.importance] ?? 1) - (IMP[b.importance] ?? 1) || (a.due || "z").localeCompare(b.due || "z"));
  const approvals = [...drafts.filter((d) => d.status === "in_review").map((d) => ({ k: d.id, t: d.title, w: "Draft in review", to: "/content" })), ...stories.filter((s) => s.stage === "Approval").map((s) => ({ k: s.id, t: s.title, w: "Story at approval", to: "/stories" })), ...tasks.filter((t) => t.kind === "approval" && t.status !== "done").map((t) => ({ k: t.id, t: t.title, w: "Approval task", to: "/content" }))];
  const followups = open.filter((t) => ["follow_up", "research", "decision"].includes(t.kind));
  const deadlines = open.filter((t) => t.due).sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div>
      <section className="bg-linen text-chocolate px-5 md:px-10 pt-12 md:pt-16 pb-12">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Tag tone="solid">Desk</Tag><Tag>Communications Strategist</Tag><Tag tone="blue">Conduct · London / NYC</Tag>
        </div>
        <h1 data-testid="desk-title" className="font-display uppercase leading-[0.92] text-[11vw] md:text-[6.4vw] max-w-[95%] animate-rise">
          <span className="text-chocolate">Conduct</span> <span className="text-tangelo">Communications</span><br /><span className="outline-text">Strategist Desk</span>
        </h1>
        <div className="mt-10 grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-7">
            <p data-testid="desk-greeting" className="font-serifit italic text-4xl md:text-5xl leading-tight">{greet()}, Anushka.</p>
            <p className="font-mono text-sm md:text-base mt-3 text-chocolate/85">Here's what's on your desk today.</p>
          </div>
          <div className="md:col-span-5 md:text-right">
            <p className="kicker text-tangelo">Today</p>
            <p data-testid="desk-date" className="font-display uppercase text-3xl md:text-4xl">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <p className="font-hand text-xl text-chocolate/70 mt-6 -rotate-1">calendar blocks & tasks here are illustrative, not booked Conduct meetings.</p>
      </section>

      <MyDesk strat={strat} decisions={decisions} drafts={drafts} stories={stories} open={open} tasks={tasks} />
      <section className="bg-chocolate text-linen px-5 md:px-10 py-14 md:py-20">
        <Kicker n="B" dark>Supporting view · ANA's briefing from saved tasks and project state (runs only when you ask)</Kicker>
        <AgentRunCard dark agent="ana" task="ana.briefing" label="Daily briefing" testid="ana-briefing"
          hint="ANA reviews today's blocks, open tasks, drafts, stories and opportunity statuses, then ranks what deserves attention. Press Run to generate today's briefing."
          onDone={load} render={(o) => <Briefing o={o} nav={nav} />} />
      </section>

      <section className="bg-linen text-chocolate px-5 md:px-10 py-14 md:py-20">
        <Kicker n="C">Today at a glance</Kicker>
        <div className="grid md:grid-cols-12 border-t border-l border-chocolate/30">
          <div className="md:col-span-5 border-r border-b border-chocolate/30 p-6" data-testid="today-blocks">
            <p className="font-display uppercase text-2xl mb-4">Today's calendar</p>
            {todays.length ? todays.map((b) => (
              <button key={b.id} onClick={() => setSel(b)} data-testid={`today-block-${b.id}`} className="w-full text-left grid grid-cols-[90px_1fr] gap-3 py-2.5 border-b border-chocolate/20 hover:bg-botticelli/20 transition-colors">
                <span className="font-mono text-xs text-tangelo">{b.start}–{b.end}</span>
                <span className="font-mono text-xs"><span className={b.status === "done" ? "line-through opacity-50" : ""}>{b.title}</span><span className="ml-2">{b.agents?.map((a) => <AgentChip key={a} id={a} className="mr-1 !px-1 !text-[8px]" />)}</span></span>
              </button>
            )) : <Empty title="Nothing on the calendar today.">No work blocks scheduled. Add one in the weekly calendar below, or ask ANA to help plan.</Empty>}
          </div>
          <div className="md:col-span-4 border-r border-b border-chocolate/30 p-6" data-testid="deadlines">
            <p className="font-display uppercase text-2xl mb-4">Deadlines</p>
            {deadlines.length ? deadlines.slice(0, 6).map((t) => (
              <div key={t.id} className="flex justify-between gap-3 py-2 border-b border-chocolate/20 font-mono text-xs"><span>{t.title}</span><span className={`shrink-0 ${t.due < today ? "text-tangelo" : "text-chocolate/60"}`}>{t.due}</span></div>
            )) : <Empty title="No deadlines set.">Tasks with due dates appear here.</Empty>}
          </div>
          <div className="md:col-span-3 border-r border-b border-chocolate/30 p-6" data-testid="approvals">
            <p className="font-display uppercase text-2xl mb-4">Waiting for approval</p>
            {approvals.length ? approvals.map((a) => (
              <Link key={a.k} to={a.to} className="block py-2 border-b border-chocolate/20 font-mono text-xs hover:text-tangelo transition-colors"><span className="kicker text-tangelo block">{a.w}</span>{a.t}</Link>
            )) : <Empty title="Nothing waiting.">Drafts in review and stories at approval show here.</Empty>}
          </div>
        </div>
      </section>

      <section className="bg-linen text-chocolate px-5 md:px-10 pb-14 md:pb-20">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-7" data-testid="priorities-list">
            <Kicker n="D">Today's priorities · from your saved tasks, by importance then due date</Kicker>
            {open.length ? open.slice(0, 5).map((t) => <TaskRow key={t.id} t={t} reload={load} />) : <Empty title="Clear desk.">No open tasks. Turn any agent recommendation into a task with "Make task".</Empty>}
            {open.length > 5 && <details className="mt-4"><summary className="kicker text-tangelo cursor-pointer" data-testid="more-tasks">{open.length - 5} more open tasks</summary>{open.slice(5).map((t) => <TaskRow key={t.id} t={t} reload={load} />)}</details>}
            {followups.length > 0 && <p className="font-mono text-[11px] text-chocolate/60 mt-4">{followups.length} research / decision follow-ups among these.</p>}
          </div>
          <div className="md:col-span-5" data-testid="quick-actions">
            <Kicker n="E">Quick actions</Kicker>
            <div className="border-t-2 border-chocolate">
              {QUICK.map(([label, to, a], i) => (
                <Link key={label} to={to} data-testid={`quick-action-${i}`} className="group flex items-center justify-between gap-4 py-4 border-b border-chocolate/30 hover:bg-chocolate hover:text-linen hover:px-4 transition-[background-color,color,padding] duration-300">
                  <span className="font-display uppercase text-xl md:text-2xl leading-none">{label}</span>
                  <span className="flex items-center gap-2"><AgentChip id={a} /><ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" /></span>
                </Link>
              ))}
            </div>
            {projects.length > 0 && (
              <div className="mt-10" data-testid="projects-list">
                <p className="kicker text-tangelo mb-3">Projects</p>
                {projects.map((p) => (
                  <div key={p.id} className="border-b border-chocolate/25 py-2 font-mono text-xs flex justify-between gap-2"><span>{p.name}</span><Tag>{p.status}</Tag></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-linen text-chocolate px-5 md:px-10 pb-20 border-t border-chocolate/20 pt-14">
        <Kicker n="F">The working week</Kicker>
        <WeekCalendar blocks={blocks} reload={load} />
      </section>
      <BlockDialog open={!!sel} block={sel} onClose={() => setSel(null)} onSaved={load} />
    </div>
  );
}
