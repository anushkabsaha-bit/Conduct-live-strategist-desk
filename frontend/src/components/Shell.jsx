import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { NAV } from "../lib/meta";

const MARQUEE = "Observe  ✳  Analyse  ✳  Find  ✳  Create  ✳  Challenge  ✳  Execute  ✳  Measure  ✳  Learn  ✳  Repeat  ✳  ";

export default function Shell() {
  return (
    <div className="min-h-screen bg-ink text-linen">
      <div className="grain" aria-hidden="true" />
      <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-linen/15">
        <div className="px-5 md:px-10 flex items-center gap-6 h-14">
          <NavLink to="/" data-testid="brand-home" className="font-display uppercase text-2xl leading-none shrink-0">conduct<span className="text-tangelo">/</span><span className="hidden lg:inline font-mono text-[10px] tracking-[0.2em] text-linen/50 ml-3 align-middle">Strategist Desk</span></NavLink>
          <nav className="flex gap-5 overflow-x-auto scroll-thin flex-1 justify-end" data-testid="main-nav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"} data-testid={`nav-${n.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                className={({ isActive }) => `shrink-0 font-mono text-[10px] tracking-[0.18em] uppercase py-1 underline-grow transition-colors ${isActive ? "active text-linen" : "text-linen/55 hover:text-linen"}`}>
                <span className="text-tangelo mr-1.5">{n.n}</span>{n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
      <div className="overflow-hidden py-3 border-y bg-chocolate text-linen border-chocolate mt-0">
        <div className="marquee-track flex whitespace-nowrap w-max">
          <span className="font-mono text-xs tracking-[0.15em] uppercase pr-2">{MARQUEE}{MARQUEE}</span>
          <span className="font-mono text-xs tracking-[0.15em] uppercase pr-2">{MARQUEE}{MARQUEE}</span>
        </div>
      </div>
      <footer className="px-5 md:px-10 py-10 flex flex-wrap justify-between gap-4 items-end">
        <p className="font-display uppercase text-5xl md:text-7xl leading-none">conduct<span className="text-tangelo">/</span></p>
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-linen/50 max-w-md">An interactive demonstration by Anushka Saha. Calendar items, tasks and concepts are illustrative unless marked verified. Agents surface things — Anushka decides what ships.</p>
      </footer>
    </div>
  );
}
