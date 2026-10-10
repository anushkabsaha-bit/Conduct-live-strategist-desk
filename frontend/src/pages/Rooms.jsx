import React from "react";
import Room from "../components/Room";

const AUDIENCES = ["Enterprise technology leaders", "Engineers and developers", "Business stakeholders", "Partners and consultants", "Potential employees"];
const FREUD = "Conduct publicly posted that it is working on a brand-new feature with Freudenberg, aimed at keeping SAP process documentation accurate, current and connected to reality. Source: https://www.linkedin.com/posts/conduct-ai_were-working-on-a-brand-new-feature-at-conduct-activity-7498006623475445762-LvUs";

export const NARRATIVE = {
  key: "narrative", n: "08", title: "Narrative Room", noun: "narrative", sub: "What should Conduct be known for, and how does that change for each audience?",
  statuses: ["draft", "in review", "approved"],
  fields: [
    { k: "core", label: "Core narrative (editable)", wide: true, rows: 4 },
    { k: "audience", label: "Audience", options: AUDIENCES }, { k: "audience_b", label: "Compare with audience", options: AUDIENCES },
    { k: "positioning", label: "Product positioning", rows: 3 }, { k: "founder_themes", label: "Founder themes", rows: 3 },
    { k: "misconceptions", label: "Questions & misconceptions", rows: 3 }, { k: "evidence", label: "Supporting evidence", rows: 3 },
  ],
  example: { name: "Conduct core narrative (interpretation of public material)", label: "Interpretation of Conduct's public mission and positioning. Not an internal positioning document. Edit freely.", data: {
    core: "Conduct is a London-founded AI company building an AI operating system for enterprise software, starting with SAP. Its stated mission is to make IT the innovation powerhouse of every company. Enterprise systems hold years of business logic, configuration and customisation that teams struggle to understand and change; Conduct uses AI and system context to help them understand those systems and move through change faster and with more confidence.",
    audience: "Enterprise technology leaders", audience_b: "Engineers and developers",
    positioning: "Starts with SAP because those environments are complex, highly customised and hard to change.",
    misconceptions: "Is it another SAP consultancy? Is it a chatbot on top of SAP? What does 'AI operating system' actually mean?",
    evidence: "Public: SAP partnership posts (P07, P08), $60m raise post (P13), Freudenberg feature post. Outsider test: 10 people needed ~5 posts to explain Conduct." } },
  steps: [
    { agent: "berdine", task: "berdine.narrative_adapt", label: "Adapt for the selected audience", hint: "Answers: what does Conduct do, and why should this audience care? Shows reasoning for each change." },
    { agent: "berdine", task: "berdine.narrative_compare", label: "Same idea, two audiences", input: (w) => ({ audience_a: w.data?.audience, audience_b: w.data?.audience_b }) },
  ],
  handoffs: [{ key: "founder", label: "Founder Comms", path: "/founder", status: "draft", map: (w) => ({ topic: w.data?.core }) }, { key: "content", label: "Content Desk" }],
};

export const FOUNDER = {
  key: "founder", n: "09", title: "Founder & Executive Comms", noun: "briefing", sub: "I gather context, speak to the founder, find the strongest point of view, test it, edit it and agree the final version with them. The agents help with the legwork.",
  statuses: ["draft", "in review", "approved by speaker", "delivered"],
  fields: [
    { k: "speaker", label: "Speaker", ph: "e.g. Jan Philipp Haas (illustrative scenario only)" }, { k: "event", label: "Conference name" },
    { k: "event_url", label: "Event URL (optional, official)" }, { k: "audience", label: "Audience" },
    { k: "scenario", label: "No URL? Choose an illustrative scenario", options: ["Enterprise transformation conference (CIOs, SAP leaders)", "Developer conference (engineers)", "Founder and investor stage", "Partner and consultant roundtable", "University / graduate talent event"] },
    { k: "objective", label: "Objective" }, { k: "key_message", label: "Key message I think matters", rows: 2 }, { k: "sources", label: "Source material available", rows: 2 },
    { k: "topic", label: "Topic", rows: 3 }, { k: "session", label: "Session details available", rows: 3 },
    { k: "founder_notes", label: "Founder's own words (from a real conversation)", wide: true, rows: 3, ph: "Paste only what the founder actually said" },
  ],
  example: { name: "Illustrative: founder at an enterprise transformation conference", label: "ILLUSTRATIVE scenario. No confirmed appearance. Nothing here is attributed to the founder.", data: {
    speaker: "Jan Philipp Haas (illustrative)", event: "SAP TechEd 2026 (used as a real event example; no booking implied)", event_url: "https://www.sap.com/events/teched.html",
    audience: "SAP developers, architects, enterprise IT leaders", topic: "Why complex system dependencies matter in enterprise software transformation, how business and technical teams build a shared understanding, and where AI can help.", session: "Not supplied." } },
  steps: [
    { agent: "catherine", task: "catherine.event_audience", label: "Audience & event research", hint: "Uses only the supplied event details and URL. No live browsing; unverified items are listed to check." },
    { agent: "edith", task: "edith.founder_messages", label: "Three approaches: big idea, practical story, challenging question" },
    { agent: "berdine", task: "berdine.founder_language", label: "Develop the language" },
    { agent: "ana", task: "ana.speaker_briefing", label: "Consolidated speaker briefing" },
    { agent: "edith", task: "edith.founder_conversation", label: "Five-minute founder conversation" },
  ],
  handoffs: [{ key: "content", label: "Content Desk" }, { key: "media", label: "Media Desk", path: "/media", status: "draft" }],
};

export const LAUNCH = {
  key: "launch", n: "10", title: "Integrated Launch", noun: "launch", sub: "A launch planner where every status is your decision, and every channel can be cut.",
  statuses: ["Planning", "Research", "Drafting", "Review", "Approved", "Ready to Launch", "Completed"],
  fields: [
    { k: "objective", label: "Launch objective", rows: 2 }, { k: "audience", label: "Audience", rows: 2 },
    { k: "facts", label: "Verified product facts", wide: true, rows: 3 }, { k: "message", label: "Central message", rows: 2 },
    { k: "channels", label: "Channels in scope (remove any)", rows: 3 }, { k: "milestones", label: "Milestones, owners & deadlines (editable)", rows: 4 },
    { k: "approvals", label: "Approval requirements", rows: 2 }, { k: "measurement", label: "Measurement plan", rows: 2 },
  ],
  example: { name: "HYPOTHETICAL launch: keeping process documentation current", label: "HYPOTHETICAL launch for demonstration. No real launch is verified.", data: {
    objective: "Help enterprise IT leaders understand the problem of documentation drifting from reality, and Conduct's approach to it.", audience: "CIOs, SAP leaders, process owners; secondary: engineers, candidates", facts: FREUD,
    channels: "Founder communications\nWebsite / blog\nLinkedIn (company + founder)\nProduct & customer story\nPartner communications\nSales enablement\nRecruiting\nEvents & community", approvals: "Product, engineering, Freudenberg (if named), leadership" } },
  steps: [
    { agent: "edith", task: "edith.launch_facts", label: "Verify product information" },
    { agent: "berdine", task: "berdine.launch_copy", label: "Narrative & channel copy" },
    { agent: "agatha", task: "agatha.launch_measurement", label: "Measurement approach" },
    { agent: "catherine", task: "catherine.launch_opportunities", label: "External opportunities" },
    { agent: "diana", task: "diana.launch_creative", label: "Creative concept & activations" },
    { agent: "ana", task: "ana.launch_plan", label: "Consolidated launch plan" },
  ],
  handoffs: [{ key: "content", label: "Content Desk" }, { key: "impact", label: "Impact & Learning", path: "/impact", status: "planned", map: (w) => ({ objective: w.data?.objective, audience: w.data?.audience, type: "Integrated launch" }) }],
};

export const PEOPLE = {
  key: "people", n: "11", title: "People & Culture", noun: "story brief", sub: "Why would a strong engineer choose Conduct over another AI company? Answer with evidence, not adjectives.",
  statuses: ["draft", "interviewing", "drafting", "approval", "published"],
  fields: [
    { k: "question", label: "The question", wide: true, rows: 2 }, { k: "format", label: "Tool", options: ["Engineer interview brief", "Employee story", "Candidate-facing content", "Recruitment event", "Employer brand video", "New starter comms", "Internal announcement", "All-hands / offsite comms"] },
    { k: "public_evidence", label: "Public evidence (job ads, posts, product news)", rows: 3 }, { k: "responses", label: "Actual interview responses (paste)", wide: true, rows: 4, ph: "Leave empty and the story is labelled DEMONSTRATION" },
  ],
  example: { name: "Engineer considering Conduct", label: "Uses public material only. Any interview is a DEMONSTRATION until real responses are pasted.", data: {
    question: "Help me develop an employer brand story for an engineer who is considering joining Conduct.", format: "Engineer interview brief",
    public_evidence: "Dataset joiner posts (P11 Jake Goldman joining as an engineer; P34 Building and scaling engineering team). Mission: make IT the innovation powerhouse of every company. Technical problem: understanding complex, customised SAP estates with AI." } },
  steps: [
    { agent: "edith", task: "edith.talent_evidence", label: "Technical questions & evidence" },
    { agent: "berdine", task: "berdine.talent_story", label: "Interview questions & story" },
    { agent: "diana", task: "diana.talent_format", label: "How to film or present it" },
    { agent: "ana", task: "ana.talent_approvals", label: "Approvals & distribution" },
  ],
  handoffs: [{ key: "content", label: "Content Desk" }],
};

export const MEDIA = {
  key: "media", n: "12", title: "Reputation & Media", noun: "media prep", sub: "Prepare, verify, approve. Nothing is ever sent from here.",
  statuses: ["draft", "awaiting confirmation", "approved", "not responding"],
  fields: [
    { k: "question", label: "Journalist question", wide: true, rows: 2 }, { k: "publication", label: "Publication / context (only if real)" },
    { k: "facts", label: "Approved company facts", rows: 3 }, { k: "scenario", label: "Hypothetical issue (for holding statement)", rows: 2 },
  ],
  example: { name: "Can enterprise teams trust AI with legacy systems?", label: "Hypothetical enquiry for practice. No real journalist or coverage.", data: { question: "Can enterprise teams trust AI to understand complex legacy systems?", publication: "Hypothetical", facts: "Public positioning only (see Narrative Room)." } },
  steps: [
    { agent: "edith", task: "edith.media_facts", label: "Concern & facts required" },
    { agent: "berdine", task: "berdine.media_response", label: "Draft response" },
    { agent: "ana", task: "ana.media_approvals", label: "Confirmations & approval steps" },
  ],
  handoffs: [{ key: "founder", label: "Founder Comms", path: "/founder", status: "draft", map: (w) => ({ topic: w.data?.question }) }],
};

export const IMPACT = {
  key: "impact", n: "13", title: "Impact & Learning", noun: "result", sub: "Judge each piece against what it was meant to do. Fewer likes can still be a win.",
  statuses: ["planned", "measuring", "reviewed"],
  fields: [
    { k: "type", label: "Objective type", options: ["Content performance", "Audience understanding", "Event participation", "Employer brand", "Product storytelling", "Integrated launch"] },
    { k: "objective", label: "Objective", rows: 2 }, { k: "audience", label: "Audience" }, { k: "baseline", label: "Baseline (dataset or entered)", rows: 2 },
    { k: "measures", label: "Success measures", rows: 2 }, { k: "results", label: "Actual results (enter real numbers only)", rows: 3 },
    { k: "channel_meta", label: "Channel, format, opening, length, publish date", rows: 2 }, { k: "lessons", label: "Lessons learned (yours)", rows: 2 },
  ],
  example: { name: "Outsider test: did people understand Conduct?", label: "Uses the Growth OS outsider test; no new results invented.", data: { type: "Audience understanding", objective: "Reduce how many posts an outsider needs before explaining Conduct.", audience: "People unfamiliar with Conduct", baseline: "Growth OS: 10 people, average five posts to explain Conduct. Dataset average 186 likes / 27.5 comments / 6.6 reposts per post.", measures: "Posts needed to explain; accuracy of explanation; follow-up questions" } },
  steps: [
    { agent: "agatha", task: "agatha.impact_review", label: "Evaluate against the objective" },
    { agent: "ana", task: "ana.impact_next", label: "Next step" },
  ],
  handoffs: [{ key: "content", label: "Content Desk" }],
};

export const NarrativeRoom = () => <Room cfg={NARRATIVE} />;
export const FounderRoom = () => <Room cfg={FOUNDER} />;
export const LaunchRoom = () => <Room cfg={LAUNCH} />;
export const PeopleRoom = () => <Room cfg={PEOPLE} />;
export const MediaRoom = () => <Room cfg={MEDIA} />;
export const ImpactRoom = () => <Room cfg={IMPACT} />;
