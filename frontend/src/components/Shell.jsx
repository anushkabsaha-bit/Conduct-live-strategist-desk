import React, { useEffect, useState } from "react";
import ReadOnlyGuard, { ModeStrip } from "./ReadOnlyGuard";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PenLine, Compass, Mic, BookOpen, Rocket, Sparkles, Radar, Users, Newspaper, LineChart, Bot, Library, Search, ListChecks, Menu, X, MoreHorizontal, ChevronDown, Target, Home, Feather, Clapperboard, Gamepad2, FileText, Gauge } from "lucide-react";
import { list } from "../lib/api";
import { searchApi } from "./Room";

export const ROOMS = [
  { to: "/", label: "Start", icon: Home },
  { to: "/writing", label: "The writing", icon: Feather },
  { to: "/strategy/film", label: "The customer story", icon: Clapperboard },
  { to: "/score", label: "SAP Score", icon: Gamepad2 },
  { to: "/strategy/brief", label: "Campaign brief", icon: FileText },
  { to: "/strategy/measure", label: "Did it work?", icon: Gauge },
  { to: "/desk", label: "Daily Desk", icon: LayoutDashboard, more: true },
  { to: "/strategy", label: "Launch Strategy", icon: Target, more: true },
  { to: "/content", label: "Content Desk", icon: PenLine, more: true },
  { to: "/narrative", label: "Narrative Room", icon: Compass, more: true },
  { to: "/founder", label: "Founder & Exec Comms", icon: Mic, more: true },
  { to: "/stories", label: "Product & Customer Stories", icon: BookOpen, more: true },
  { to: "/radar", label: "Opportunity Radar", icon: Radar, more: true },
  { to: "/launch", label: "Integrated Launch", icon: Rocket, more: true },
  { to: "/campaigns", label: "Campaign Studio", icon: Sparkles, more: true },
  { to: "/people", label: "People & Culture", icon: Users , more: true },
  { to: "/media", label: "Reputation & Media", icon: Newspaper , more: true },
  { to: "/impact", label: "Impact & Learning", icon: LineChart , more: true },
  { to: "/agents", label: "Agent Room", icon: Bot , more: true },
  { to: "/library", label: "Source Library", icon: Library , more: true },
];
const PATH = { tasks: "/desk", drafts: "/content", stories: "/stories", campaigns: "/campaigns", opportunities: "/radar", projects: "/desk", calendar: "/desk" };

function SearchBox() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState([]);
  const nav = useNavigate();
  useEffect(() => { if (q.length < 2) { setRes([]); return; } const t = setTimeout(() => searchApi(q).then(setRes), 250); return () => clearTimeout(t); }, [q]);
  const go = (r) => { setQ(""); nav(r.coll === "workspaces" ? `/${r.room}?id=${r.id}` : r.coll === "drafts" ? `/content?draft=${r.id}` : PATH[r.coll]); };
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-linen/40" />
      <input data-testid="global-search" className="field-dark !pl-9 !py-1.5" placeholder="Search drafts, tasks, rooms…" value={q} onChange={(e) => setQ(e.target.value)} />
      {res.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-linen text-chocolate border-2 border-chocolate z-50 max-h-80 overflow-auto" data-testid="search-results">
          {res.map((r) => <button key={r.coll + r.id} onClick={() => go(r)} className="w-full text-left px-3 py-2 border-b border-chocolate/20 hover:bg-botticelli/30 font-mono text-xs"><span className="kicker text-tangelo mr-2">{r.room || r.coll}</span>{r.label}</button>)}
        </div>
      )}
    </div>
  );
}

export default function Shell() {
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(true);
  const [openTasks, setOpenTasks] = useState(0);
  const loc = useLocation();
  useEffect(() => { setOpen(false); list("tasks").then((t) => setOpenTasks(t.filter((x) => x.status !== "done").length)).catch(() => {}); }, [loc.pathname]);
  const current = ROOMS.find((r) => loc.pathname === r.to) || ROOMS.find((r) => r.to !== "/" && loc.pathname.startsWith(r.to));
  const inMore = !!current?.more;
  const [moreOpen, setMoreOpen] = useState(inMore);
  useEffect(() => { if (inMore) setMoreOpen(true); }, [inMore]);
  const item = (r, mobile) => (
    <NavLink key={r.to} to={r.to} end title={r.label} data-testid={`${mobile ? "m-" : ""}nav-${r.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
      className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 border-l-[3px] transition-colors ${isActive ? "border-tangelo bg-linen/10 text-linen" : "border-transparent text-linen/55 hover:text-linen hover:bg-linen/5"}`}>
      <r.icon className="w-4 h-4 shrink-0" />{(wide || mobile) && <span className="font-mono text-[10px] tracking-[0.14em] uppercase truncate">{r.label}</span>}
    </NavLink>
  );
  const nav = (mobile) => (
    <nav className="flex flex-col gap-0.5 py-3" data-testid={mobile ? "mobile-nav" : "main-nav"}>
      {(wide || mobile) && <p className="px-4 pb-1 font-mono text-[9px] tracking-[0.2em] uppercase text-linen/35">Show the work</p>}
      {ROOMS.filter((r) => !r.more).map((r) => item(r, mobile))}
      <button data-testid={`${mobile ? "m-" : ""}nav-more-toggle`} onClick={() => setMoreOpen(!moreOpen)} className="flex items-center gap-3 px-4 py-2.5 mt-2 text-linen/55 hover:text-linen border-t border-linen/10" title="How I Work: desk, rooms, agents and research">
        <MoreHorizontal className="w-4 h-4 shrink-0" />{(wide || mobile) && <span className="font-mono text-[10px] tracking-[0.14em] uppercase flex-1 text-left">How I Work</span>}{(wide || mobile) && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />}
      </button>
      {moreOpen && ROOMS.filter((r) => r.more).map((r) => item(r, mobile))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-ink text-linen flex">
      <div className="grain" aria-hidden="true" />
      <aside className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r border-linen/15 bg-ink transition-[width] duration-300 ${wide ? "w-60" : "w-14"}`}>
        <button onClick={() => setWide(!wide)} data-testid="sidebar-toggle" className="h-14 px-4 flex items-center gap-2 border-b border-linen/15 font-display uppercase text-xl">{wide ? <>conduct<span className="text-tangelo">/</span></> : <Menu className="w-4 h-4" />}</button>
        <div className="flex-1 overflow-y-auto scroll-thin">{nav(false)}</div>
        {wide && <p className="p-4 font-mono text-[9px] tracking-[0.14em] uppercase text-linen/40">Independent portfolio by Anushka Saha. Not affiliated with or approved by Conduct.</p>}
      </aside>
      {open && <div className="lg:hidden fixed inset-0 z-[60] bg-ink/95 overflow-y-auto"><button className="p-4" onClick={() => setOpen(false)} data-testid="mobile-nav-close"><X className="w-5 h-5" /></button>{nav(true)}</div>}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-linen/15 h-14 px-4 md:px-8 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setOpen(true)} data-testid="mobile-nav-open"><Menu className="w-5 h-5" /></button>
          <NavLink to="/" data-testid="brand-home" className="font-mono text-[10px] tracking-[0.18em] uppercase text-linen/60 hover:text-tangelo shrink-0 hidden sm:block">Start</NavLink>
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-linen shrink-0 truncate" data-testid="current-room">/ {current?.label || ""}</span>
          <SearchBox />
          <NavLink to="/desk" data-testid="open-tasks-indicator" className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-linen/70 hover:text-tangelo shrink-0"><ListChecks className="w-4 h-4" />{openTasks} open</NavLink>
        </header>
        <ModeStrip />
        <main><ReadOnlyGuard><Outlet /></ReadOnlyGuard></main>
        <footer className="px-5 md:px-10 py-8 border-t border-linen/15"><p className="font-display uppercase text-4xl leading-none">conduct<span className="text-tangelo">/</span></p></footer>
      </div>
    </div>
  );
}
