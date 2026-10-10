import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Repeat, Check } from "lucide-react";
import { Btn } from "./kit";
import BlockDialog from "./BlockDialog";
import { AGENTS, CATEGORIES } from "../lib/meta";

const H0 = 8, H1 = 18, PX = 52;
const iso = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const mins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const mondayOf = (d) => { const x = new Date(d); x.setHours(12); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

export function blocksOn(blocks, dateISO) {
  const wd = new Date(dateISO + "T12:00").getDay();
  return blocks.filter((b) => b.date === dateISO || (b.recurrence === "weekly" && b.date < dateISO && new Date(b.date + "T12:00").getDay() === wd)).sort((a, b) => a.start.localeCompare(b.start));
}

export default function WeekCalendar({ blocks, reload }) {
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const [sel, setSel] = useState(null);
  const days = useMemo(() => [0, 1, 2, 3, 4].map((i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return d; }), [monday]);
  const today = iso(new Date());
  const shift = (n) => { const d = new Date(monday); d.setDate(d.getDate() + n * 7); setMonday(d); };
  return (
    <div data-testid="week-calendar">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Btn variant="line" data-testid="cal-prev-week" onClick={() => shift(-1)}><ChevronLeft className="w-3.5 h-3.5" /></Btn>
          <Btn variant="line" data-testid="cal-this-week" onClick={() => setMonday(mondayOf(new Date()))}>This week</Btn>
          <Btn variant="line" data-testid="cal-next-week" onClick={() => shift(1)}><ChevronRight className="w-3.5 h-3.5" /></Btn>
          <span className="font-mono text-xs ml-2">w/c {days[0].toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        <Btn variant="accent" data-testid="cal-add-block" onClick={() => setSel({ date: iso(days[0]) })}><Plus className="w-3.5 h-3.5" />Add block</Btn>
      </div>
      <div className="overflow-x-auto scroll-thin border-2 border-chocolate bg-paper">
        <div className="min-w-[880px] grid grid-cols-[52px_repeat(5,1fr)]">
          <div className="border-b-2 border-chocolate bg-chocolate" />
          {days.map((d) => (
            <div key={iso(d)} className={`border-b-2 border-l border-chocolate px-3 py-2 ${iso(d) === today ? "bg-tangelo text-linen" : "bg-chocolate text-linen"}`}>
              <p className="kicker">{d.toLocaleDateString("en-GB", { weekday: "long" })}</p>
              <p className="font-display text-2xl leading-none">{d.getDate()}</p>
            </div>
          ))}
          <div className="relative" style={{ height: (H1 - H0) * PX }}>
            {Array.from({ length: H1 - H0 }, (_, i) => <span key={i} className="absolute right-2 font-mono text-[10px] text-chocolate/50" style={{ top: i * PX + 2 }}>{String(H0 + i).padStart(2, "0")}:00</span>)}
          </div>
          {days.map((d) => (
            <div key={iso(d)} className="relative border-l border-chocolate/30" style={{ height: (H1 - H0) * PX, backgroundImage: `repeating-linear-gradient(to bottom, rgba(102,57,36,.12) 0 1px, transparent 1px ${PX}px)` }}>
              {blocksOn(blocks, iso(d)).map((b) => {
                const top = ((mins(b.start) - H0 * 60) / 60) * PX, h = Math.max(((mins(b.end) - mins(b.start)) / 60) * PX - 3, 22);
                const col = AGENTS[b.agents?.[0]]?.color || "#663924";
                return (
                  <button key={b.id} data-testid={`cal-block-${b.id}`} onClick={() => setSel(b)}
                    className={`absolute left-1 right-1 text-left px-2 py-1 overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg ${b.status === "done" ? "opacity-50" : ""} ${b.status === "cancelled" ? "line-through opacity-40" : ""}`}
                    style={{ top, height: h, background: "#f9e8d4", borderLeft: `4px solid ${col}`, outline: "1px solid rgba(102,57,36,.25)" }}>
                    <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-chocolate/60 flex items-center gap-1">{b.start}–{b.end}{b.recurrence === "weekly" && <Repeat className="w-2.5 h-2.5" />}{b.status === "done" && <Check className="w-2.5 h-2.5" />}</p>
                    <p className="font-mono text-[11px] leading-tight text-chocolate font-bold">{b.title}</p>
                    {h > 50 && <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-tangelo mt-0.5">{CATEGORIES[b.category]?.label}</p>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="font-mono text-[10px] text-chocolate/60 mt-3">Blocks marked illustrative are example activities, not booked Conduct meetings. Editing a weekly block edits the series.</p>
      <BlockDialog open={!!sel} block={sel} onClose={() => setSel(null)} onSaved={reload} />
    </div>
  );
}
