export const AGENTS = {
  ana: { name: "ANA", title: "Main Growth Agent / EA", color: "#6E4BB8" },
  agatha: { name: "AGATHA", title: "Performance Intelligence & Forecasting", color: "#2F7D4F" },
  berdine: { name: "BERDINE", title: "Content, Editorial & Tech Intelligence", color: "#2D5DA8" },
  catherine: { name: "CATHERINE", title: "Market & Representation Intelligence", color: "#D54C15" },
  diana: { name: "DIANA", title: "Creative Strategy & Activation", color: "#5A3A8A" },
  edith: { name: "EDITH", title: "Product, Customer & Storytelling", color: "#C93F73" },
};
export const AGENT_IDS = Object.keys(AGENTS);

export const CATEGORIES = {
  planning: { label: "Planning", to: "/agents?agent=ana" },
  performance: { label: "Performance", to: "/agents?agent=agatha" },
  product_story: { label: "Product story", to: "/stories" },
  founder: { label: "Founder", to: "/stories" },
  engineering: { label: "Engineering", to: "/stories" },
  editorial: { label: "Editorial", to: "/content" },
  editorial_review: { label: "Editorial review", to: "/content" },
  publishing: { label: "Publishing", to: "/content" },
  production: { label: "Production", to: "/campaigns" },
  opportunities: { label: "Opportunities", to: "/radar" },
  campaign: { label: "Campaign", to: "/campaigns" },
};

export const STAGES = ["Idea", "Research", "Evidence Needed", "Interview Ready", "Drafting", "Approval", "Ready to Publish", "Published"];

export const VERIF = {
  verified_dates: { label: "Dates verified", cls: "bg-[#2F7D4F] text-linen" },
  needs_validation: { label: "Needs validation", cls: "bg-botticelli text-chocolate" },
  idea: { label: "Idea, not an event", cls: "border border-chocolate/50 text-chocolate" },
  live_official: { label: "Live search · official source", cls: "bg-[#2F7D4F] text-linen" },
  live_secondary: { label: "Live search · secondary source, verify", cls: "bg-botticelli text-chocolate" },
};

export const OPP_STATUS = ["new", "saved", "watch", "shortlisted", "rejected", "converted"];

export const NAV = [
  { to: "/", label: "Daily Desk", n: "01" },
  { to: "/content", label: "Content Desk", n: "02" },
  { to: "/stories", label: "Stories", n: "03" },
  { to: "/campaigns", label: "Campaign Studio", n: "04" },
  { to: "/radar", label: "Opportunity Radar", n: "05" },
  { to: "/agents", label: "Agent Room", n: "06" },
  { to: "/library", label: "Source Library", n: "07" },
];

export const human = (k) => k.replace(/_/g, " ");
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
export const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
