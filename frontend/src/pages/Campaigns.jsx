import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Btn, Empty, Field, Kicker, PageHead, Tag } from "../components/kit";
import AgentRunCard from "../components/AgentRunCard";
import { create, list, recordDecision, remove, update } from "../lib/api";

const FIELDS = [["brief", "Campaign brief"], ["audience", "Audience"], ["objective", "Objective"], ["insight", "Core insight"], ["concept", "Creative concept"], ["alternatives", "Alternative concepts"], ["resources", "Required resources"], ["budget", "Budget estimates & assumptions"], ["dependencies", "Dependencies"], ["risks", "Risks"], ["timeline", "Execution timeline"], ["distribution", "Distribution plan"], ["metrics", "Success metrics"], ["kill_criteria", "Kill / continuation criteria"]];

export default function Campaigns() {
  const [items, setItems] = useState([]);
  const [id, setId] = useState(null);
  const load = useCallback(async () => { const d = await list("campaigns"); setItems(d); setId((c) => c || d[0]?.id); }, []);
  useEffect(() => { load(); }, [load]);
  const c = items.find((x) => x.id === id);
  const save = async (patch) => { await update("campaigns", id, patch); load(); };
  const add = async () => { const n = await create("campaigns", { name: "New campaign", status: "draft", event: "", provenance: "", decision: "", ...Object.fromEntries(FIELDS.map(([k]) => [k, ""])) }); await load(); setId(n.id); };
  const decide = async (choice) => {
    await save({ decision: choice, status: choice === "reject" ? "rejected" : choice === "test" ? "testing_planned" : "in_development" });
    await recordDecision({ ref_type: "campaign", ref_id: id, choice, note: `Anushka chose to ${choice} "${c.name}"` });
    toast.success(`Decision recorded: ${choice}`);
  };
  const del = async () => { await remove("campaigns", id); setId(null); load(); };
  return (
    <div>
      <PageHead n="04" kicker="Campaign Studio" title="Campaign studio" accent="." sub="'Wouldn't it be funny if…' becomes a plan only after DIANA has tried to break it." />
      <section className="bg-linen text-chocolate px-5 md:px-10 pb-16">
        <div className="flex flex-wrap gap-2 mb-10" data-testid="campaign-tabs">
          {items.map((x, i) => (
            <button key={x.id} data-testid={`campaign-tab-${x.id}`} onClick={() => setId(x.id)} className={`text-left px-5 py-4 border-2 transition-colors ${x.id === id ? "bg-chocolate text-linen border-chocolate" : "border-chocolate/40 hover:border-tangelo hover:text-tangelo"}`}>
              <span className="block font-mono text-[10px] tracking-[0.2em] mb-1 text-tangelo">{String(i + 1).padStart(2, "0")} /</span>
              <span className="font-display uppercase text-xl md:text-2xl leading-none">{x.name}</span>
            </button>
          ))}
          <Btn variant="accent" data-testid="new-campaign-btn" onClick={add}><Plus className="w-3.5 h-3.5" />New</Btn>
        </div>
        {!c ? <Empty title="No campaign yet.">Start a brief.</Empty> : (
          <div className="space-y-10" key={c.id}>
            <div className="flex flex-wrap gap-2">
              <Tag tone="solid" data-testid="campaign-status">{c.status.replace(/_/g, " ")}</Tag>
              {c.decision && <Tag tone="dark">Decision: {c.decision}</Tag>}
              {c.provenance && <Tag tone="blue">{c.provenance}</Tag>}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Campaign name"><input data-testid="campaign-name-input" className="field" defaultValue={c.name} onBlur={(e) => save({ name: e.target.value })} /></Field>
              <Field label="Event / context"><input className="field" defaultValue={c.event} onBlur={(e) => save({ event: e.target.value })} /></Field>
              {FIELDS.map(([k, label]) => (
                <Field key={k} label={label}><textarea data-testid={`campaign-${k}-input`} className="field" rows={3} defaultValue={c[k]} onBlur={(e) => save({ [k]: e.target.value })} /></Field>
              ))}
            </div>
            <Kicker>DIANA leads · CATHERINE on events · EDITH on evidence · ANA prioritises</Kicker>
            <AgentRunCard agent="diana" task="diana.campaign" refType="campaign" refId={c.id} label="Pressure-test" hint="DIANA clarifies first, then develops the strongest version, alternatives, plan, metrics and kill criteria." />
            <div className="grid xl:grid-cols-2 gap-6">
              <AgentRunCard agent="catherine" task="catherine.campaign_events" refType="campaign" refId={c.id} label="Where could it run?" hint="Uses saved Opportunity Radar records. Anything else is labelled an unverified lead." />
              <AgentRunCard agent="edith" task="edith.campaign_evidence" refType="campaign" refId={c.id} label="Product evidence" />
            </div>
            <AgentRunCard dark agent="ana" task="ana.campaign_summary" refType="campaign" refId={c.id} label="Feasibility summary" hint="Best after DIANA, CATHERINE and EDITH have run — ANA only summarises recorded work." />
            <div className="bg-chocolate text-linen p-6" data-testid="campaign-decision">
              <p className="kicker text-botticelli mb-2">Your decision</p>
              <p className="font-mono text-xs text-linen/70 mb-4">Agents recommend. You decide. Nothing is booked or approved until you choose.</p>
              <div className="flex flex-wrap gap-2">
                {["test", "develop", "reject"].map((x) => <Btn key={x} variant={c.decision === x ? "accent" : "lineDark"} data-testid={`decision-${x}`} onClick={() => decide(x)}>{x}</Btn>)}
              </div>
            </div>
            <Btn variant="ghost" data-testid="campaign-delete-btn" onClick={del}><Trash2 className="w-3.5 h-3.5" />Delete campaign</Btn>
          </div>
        )}
      </section>
    </div>
  );
}
