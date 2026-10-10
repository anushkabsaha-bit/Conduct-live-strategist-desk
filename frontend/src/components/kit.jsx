import React from "react";
import { Loader2 } from "lucide-react";
import { AGENTS } from "../lib/meta";

export const Kicker = ({ n, children, dark }) => (
  <div className="flex items-center gap-4 mb-5">
    {n && <span className={`font-mono text-xs tracking-[0.2em] ${dark ? "text-botticelli" : "text-tangelo"}`}>{n}</span>}
    <span className={`h-px flex-1 ${dark ? "bg-linen/25" : "bg-chocolate/30"}`} />
    <span className={`kicker ${dark ? "text-linen/60" : "text-chocolate/70"}`}>{children}</span>
  </div>
);

export const PageHead = ({ n, kicker, title, accent, sub, children }) => (
  <section className="bg-linen text-chocolate px-5 md:px-10 pt-12 md:pt-16 pb-10 md:pb-14">
    <Kicker n={n}>{kicker}</Kicker>
    <h1 className="font-display uppercase leading-[0.92] text-4xl sm:text-5xl lg:text-6xl max-w-6xl animate-rise">
      {title}{accent && <span className="text-tangelo">{accent}</span>}
    </h1>
    {sub && <p className="font-serifit italic text-lg md:text-xl text-chocolate/80 mt-5 max-w-3xl">{sub}</p>}
    {children}
  </section>
);

export const Tag = ({ children, tone = "line", className = "", ...p }) => {
  const tones = { line: "border border-chocolate/50 text-chocolate/85", solid: "bg-tangelo text-linen", blue: "bg-botticelli text-chocolate", dark: "bg-chocolate text-linen", lineDark: "border border-linen/40 text-linen/85", green: "bg-[#2F7D4F] text-linen" };
  return <span className={`inline-block px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase ${tones[tone]} ${className}`} {...p}>{children}</span>;
};

export const Btn = ({ children, variant = "dark", className = "", loading, ...p }) => {
  const v = {
    dark: "bg-chocolate text-linen hover:bg-tangelo",
    accent: "bg-tangelo text-linen hover:bg-chocolate",
    line: "border border-chocolate/60 text-chocolate hover:bg-chocolate hover:text-linen",
    lineDark: "border border-linen/50 text-linen hover:bg-linen hover:text-chocolate",
    ghost: "text-chocolate/80 hover:text-tangelo",
  };
  return (
    <button className={`inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] uppercase px-4 py-2.5 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${v[variant]} ${className}`} disabled={loading || p.disabled} {...p}>
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{children}
    </button>
  );
};

export const AgentChip = ({ id, className = "" }) => {
  const a = AGENTS[id];
  if (!a) return <Tag>{id || "—"}</Tag>;
  return <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] uppercase px-2 py-0.5 text-linen ${className}`} style={{ background: a.color }}>{a.name}</span>;
};

export const Field = ({ label, children, dark }) => (
  <label className="block">
    <span className={`kicker block mb-1.5 ${dark ? "text-linen/60" : "text-tangelo"}`}>{label}</span>
    {children}
  </label>
);

export const Empty = ({ title, children, dark }) => (
  <div className={`border border-dashed p-6 ${dark ? "border-linen/30 text-linen/70" : "border-chocolate/40 text-chocolate/70"}`}>
    <p className="font-hand text-2xl mb-1">{title}</p>
    <div className="font-mono text-xs leading-relaxed">{children}</div>
  </div>
);

export const Note = ({ children, className = "" }) => <p className={`font-mono text-[11px] italic opacity-70 ${className}`}>{children}</p>;

export const Panel = ({ children, className = "", dark, ...p }) => (
  <div className={`${dark ? "bg-chocolate text-linen" : "bg-linen text-chocolate border-2 border-chocolate"} ${className}`} {...p}>{children}</div>
);
