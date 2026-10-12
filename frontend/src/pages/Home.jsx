import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const ENTRIES = [
  { n: "01", to: "/writing", t: "The writing", d: "Drafts about a problem most enterprise teams know but rarely name: the documentation stops matching the system. Shown with the edits I made and the reasons for them.", k: "Drafts, edits, evidence" },
  { n: "02", to: "/strategy/film", t: "The customer story", d: "How I'd develop a film from Conduct's public Freudenberg collaboration without pretending I've interviewed anyone.", k: "Film concept" },
  { n: "03", to: "/score", t: "SAP Score", d: "A one-minute campaign prototype. Three questions about where the explanation for your systems really lives.", k: "Play it" },
  { n: "04", to: "/strategy/measure", t: "Did it work?", d: "What I'd measure, what I'd count as failure, and the result that would change my mind, all decided before any results arrive.", k: "Measurement plan" },
];

const HOW = [["/desk", "Daily Desk"], ["/content", "Content Desk"], ["/strategy/narrative", "Narrative & evidence"], ["/strategy/brief", "Campaign brief"], ["/radar", "Opportunity Radar"], ["/agents", "Agent Room"], ["/library", "Sources"]];

export default function Home() {
  return (
    <div className="bg-linen text-chocolate" data-testid="home-page">
      <header className="px-5 md:px-10 pt-14 md:pt-20 pb-12 max-w-5xl">
        <p className="kicker text-tangelo mb-5 animate-rise">Independent portfolio · Communications Strategist, Conduct</p>
        <h1 className="font-display uppercase leading-[0.9] text-4xl sm:text-5xl lg:text-6xl animate-rise" style={{ animationDelay: "60ms" }}>The system changed. <span className="text-tangelo">Did the story?</span></h1>
        <p className="font-serifit text-xl md:text-2xl leading-snug mt-6 max-w-3xl animate-rise" style={{ animationDelay: "120ms" }} data-testid="home-intro">
          I'm Anushka. This is how I'd take one complicated idea from Conduct's public work, keeping SAP process documentation connected to reality, and turn it into writing, a customer story, a small campaign and an honest test of whether it worked.
        </p>
        <p className="font-mono text-[11px] mt-4 opacity-60 max-w-2xl">Built only from public material. Not commissioned, reviewed or approved by Conduct. Nothing here has been published or tested on a real audience.</p>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-chocolate" data-testid="home-entries">
        {ENTRIES.map((e, i) => (
          <div key={e.n} className={`group relative p-6 md:p-8 border-b-2 border-chocolate sm:[&:nth-child(odd)]:border-r-2 lg:border-r-2 lg:last:border-r-0 transition-colors duration-300 animate-rise ${i === 2 ? "bg-chocolate text-linen hover:bg-ink" : "hover:bg-paper"}`} style={{ animationDelay: `${180 + i * 70}ms` }}>
            <Link to={e.to} data-testid={`home-entry-${e.n}`} className="absolute inset-0" aria-label={e.t} />
            <div className="flex justify-between items-start mb-14"><span className="font-mono text-xs text-tangelo">{e.n}</span><ArrowUpRight className="w-5 h-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div>
            <p className="font-display uppercase text-3xl xl:text-4xl leading-none mb-4">{e.t}</p>
            <p className="font-mono text-xs leading-relaxed opacity-80 mb-6">{e.d}</p>
            <span className="kicker text-tangelo">{e.k}</span>
            {e.n === "03" && <Link to="/campaigns?booth=1" data-testid="home-booth-link" className="relative z-10 inline-block mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-botticelli hover:text-tangelo">The booth campaign</Link>}
          </div>
        ))}
      </div>
      <div className="px-5 md:px-10 py-8 bg-ink text-linen flex flex-wrap items-baseline gap-x-6 gap-y-2" data-testid="home-how-i-work">
        <span className="kicker text-botticelli">How I work</span>
        {HOW.map(([to, l]) => <Link key={to} to={to} className="font-mono text-[11px] uppercase tracking-[0.12em] text-linen/70 hover:text-tangelo">{l}</Link>)}
      </div>
    </div>
  );
}
