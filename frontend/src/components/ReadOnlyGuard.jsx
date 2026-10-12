import React, { useEffect, useRef } from "react";
import { useMode, viewAs } from "../lib/mode";

const SEL = "input, textarea, select";
const lock = (root) => root.querySelectorAll(SEL).forEach((el) => {
  if (el.closest("[data-editable]")) { if (el.dataset.ro) { el.readOnly = false; el.disabled = false; delete el.dataset.ro; } return; }
  if (el.dataset.ro) return;
  el.dataset.ro = "1";
  if (el.tagName === "SELECT" || ["checkbox", "radio", "date", "time", "datetime-local", "range", "file"].includes(el.type)) el.disabled = true;
  else el.readOnly = true;
});

export function ModeStrip() {
  const { ready, owner } = useMode();
  if (!ready) return null;
  const previewing = viewAs() === "visitor";
  return (
    <div data-testid="mode-strip" className={`px-5 md:px-10 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase flex flex-wrap gap-x-4 gap-y-1 items-center ${owner ? "bg-[#2F7D4F] text-linen" : "bg-paper text-chocolate border-b border-chocolate/20"}`}>
      {owner ? <><span data-testid="mode-owner">Working environment · editing on</span><a href="?as=visitor" data-testid="view-as-visitor" className="underline-grow">View as a visitor</a></>
        : <><span data-testid="mode-visitor">Read-only portfolio</span><span className="normal-case tracking-normal opacity-70">Play SAP Score, open the evidence, or make your own copy of a draft. Copies stay in this browser and aren't private.</span>{previewing && <a href="?as=owner" data-testid="back-to-editing" className="underline-grow text-tangelo">Back to editing</a>}</>}
    </div>
  );
}

export default function ReadOnlyGuard({ children }) {
  const { ready, owner } = useMode();
  const ref = useRef(null);
  useEffect(() => {
    document.body.classList.toggle("visitor", ready && !owner);
    if (!ready || owner || !ref.current) return;
    const root = ref.current;
    lock(root);
    const ob = new MutationObserver(() => lock(root));
    ob.observe(root, { childList: true, subtree: true });
    return () => ob.disconnect();
  }, [ready, owner]);
  return <div ref={ref}>{children}</div>;
}
