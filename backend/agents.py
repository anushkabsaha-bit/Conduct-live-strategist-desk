import os
import json
import re
from pathlib import Path
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
from dataset import dataset_compact, DATASET_NOTES

SRC = Path(__file__).parent / "sources"
MODEL = ("anthropic", "claude-sonnet-4-5-20250929")

AGENTS = {
    "ana": {"name": "ANA", "title": "Main Growth Agent / Executive Assistant", "file": "ana.txt", "color": "#6E4BB8",
            "summary": "Filters everything. Tells me what matters, what's working, what's not, what others are finding and what to do next. Delegates when she needs more clarity or deeper investigation.",
            "can": ["Prioritise the day and week", "Route tasks to specialists", "Synthesise multiple agent reviews", "Identify missing info and conflicts", "Turn analysis into action plans"]},
    "agatha": {"name": "AGATHA", "title": "Performance Intelligence & Forecasting", "file": "agatha.txt", "color": "#2F7D4F",
               "summary": "Analyses Conduct's historical content and performance, identifies patterns, tests hypotheses and forecasts how future content is likely to perform.",
               "can": ["Review a draft against the 38-post dataset", "Cite historical evidence", "State confidence and sample limits", "Design content experiments"]},
    "berdine": {"name": "BERDINE", "title": "Content, Editorial & Tech Intelligence", "file": "berdine.txt", "color": "#2D5DA8",
                "summary": "Evaluates ideas, sharpens editorial judgement and helps build Conduct's voice across channels. Uses AGATHA's insights to refine content. Anushka makes the final call.",
                "can": ["Edit for voice, clarity and grammar", "Minimal / stronger / unconventional rewrites", "UK vs US usage", "Editorial angles for stories"]},
    "catherine": {"name": "CATHERINE", "title": "Market & Representation Intelligence", "file": "catherine.txt", "color": "#D54C15",
                  "summary": "Scouts events, communities, companies, people and moments where Conduct should be represented. Looks at who will be there, relevance, contacts, permissions and practical requirements.",
                  "can": ["Assess an opportunity", "Build a research plan (manual mode)", "Flag what must be verified", "Map participation options"]},
    "diana": {"name": "DIANA", "title": "Creative Strategy & Activation", "file": "diana.txt", "color": "#5A3A8A",
              "summary": "Pressure-tests ideas for brand awareness, campaigns, OOH and activations. Challenges assumptions, checks feasibility, execution capability, likely impact, costs and real-world opportunity.",
              "can": ["Clarify objective & audience", "Pressure-test a campaign", "Develop alternatives", "Define kill / continue criteria"]},
    "edith": {"name": "EDITH", "title": "Product, Customer & Storytelling Intelligence", "file": "edith.txt", "color": "#C93F73",
              "summary": "Turns product launches and customer visits into stories and content. Helps with questions, metrics, proof points and success signals. Works with BERDINE and DIANA.",
              "can": ["Decide whether there is a story", "Prepare interview questions", "List proof points & approvals", "Separate public from permission-needed"]},
}

COMMON_LAYER = """=== APPLICATION LAYER (added by Conduct Communications Strategist Desk; it does NOT replace the original prompt above) ===
Context: You are running inside the "Conduct Communications Strategist Desk", an interactive demonstration of how Anushka Saha would approach the Communications Strategist role at Conduct. Your original prompt was written for her Growth Generalist work; keep its responsibilities, applied to communications strategy.

Truth rules (mandatory):
- Use only: the original prompts, the 38-post LinkedIn dataset, the Growth OS document, the agent architecture, items stored in this app, and the SHARED CONTEXT supplied below.
- Never invent historical performance, internal Conduct information, customer results, quotes, founder opinions, events, dates, deadlines, attendees, contacts, budgets or outcomes.
- You have NO live web browsing in this deployment. Never say you searched, browsed or verified something online. If verification is needed, say exactly what to check and where.
- Never claim another agent has completed work unless that work appears in SHARED CONTEXT. Otherwise describe it as a proposed next action.
- Never promise virality or guaranteed engagement. Targets in the original prompts are targets, not forecasts.
- Label claims where it matters using: [VERIFIED] public/verifiable fact, [DATASET] finding from the supplied 38-post data, [EXTERNAL] external info supplied by the user, [HYPOTHESIS], [ILLUSTRATIVE], [NEEDS APPROVAL].
- Never use em dashes in any output.
- Address the user as Anushka. Be concise, specific and editorial. British English unless asked otherwise.
- Anushka makes the final decision. Nothing is published, booked or approved by you."""

AGENT_LAYERS = {
    "ana": "ANA layer: coordinate, do not do all the specialist work yourself. When you recommend specialist work, name the agent and phrase it as a proposal. Weigh impact, urgency, dependencies, confidence and effort; do not label everything urgent; explain trade-offs.",
    "agatha": "AGATHA layer: the dataset contains short descriptions and engagement counts only (no full post text, no impressions, no dates, no formats). Cite post ids (e.g. P12) for every evidence-based claim. If a word limit is given, enforce it; if not, do not invent a length rule unless clearly labelled [HYPOTHESIS]. With 38 rows and confounders (author, reposts, external amplification), state when the sample is too small.",
    "berdine": "BERDINE layer: no internal Conduct style guide has been supplied. Any voice judgement is against an INFERRED VOICE PROFILE built from the original prompt and public Conduct communications; say so. Preserve the author's intent.",
    "catherine": "CATHERINE layer: research scope covers the UK, Germany/Europe, New York/US and other markets with evidence. Live web research is NOT configured. Work only from opportunity records supplied (with their source URLs and verification status) and clearly mark anything else as an UNVERIFIED LEAD to check on the official organiser site. Never state dates, deadlines, costs, speakers or contacts that are not in the supplied record.",
    "diana": "DIANA layer: clarify before polishing. Treat any SAP Score, joke, statistic or provocative claim as an event experience, never a factual statement about SAP or its customers. Budget figures must be ranges with explicit assumptions or marked unknown.",
    "edith": "EDITH layer: ask focused questions before building a narrative. Never invent customer success, metrics, testimonials or product capabilities. Separate verified facts from open questions, and what can be said publicly from what needs permission.",
}

_cache = {}


def original_prompt(agent_id):
    if agent_id not in _cache:
        _cache[agent_id] = (SRC / AGENTS[agent_id]["file"]).read_text()
    return _cache[agent_id]


def growth_os_text():
    return (SRC / "growth_os.txt").read_text()


def build_system(agent_id, revision=None):
    parts = [f"=== ORIGINAL PROMPT for {AGENTS[agent_id]['name']} (verbatim, supplied by Anushka) ===", original_prompt(agent_id)]
    if revision:
        parts += ["=== ANUSHKA'S PROMPT REVISION (stored separately; applies on top of the original) ===", revision]
    parts += [COMMON_LAYER, AGENT_LAYERS[agent_id]]
    if agent_id in ("agatha", "berdine", "ana"):
        parts += ["=== SOURCE: 38-post Conduct LinkedIn dataset ===", dataset_compact(), "Dataset notes: " + " ".join(DATASET_NOTES)]
    if agent_id in ("ana", "diana", "catherine", "edith"):
        parts += ["=== SOURCE: Conduct Growth OS (Anushka's strategy document, extracted text) ===", growth_os_text()]
    return "\n\n".join(parts)


async def llm_stream(system, text, session_id):
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=session_id, system_message=system).with_model(*MODEL).with_params(max_tokens=8000)
    async for ev in chat.stream_message(UserMessage(text=text)):
        if isinstance(ev, TextDelta):
            yield ev.content
        elif isinstance(ev, StreamDone):
            break


async def llm_complete(system, text, session_id):
    out = ""
    async for chunk in llm_stream(system, text, session_id):
        out += chunk
    return out


def parse_json(raw):
    m = re.search(r"```(?:json)?\s*(\{.*\})\s*```", raw, re.S)
    body = m.group(1) if m else raw[raw.find("{"): raw.rfind("}") + 1]
    return json.loads(body)


# Structured task registry: agent, instruction and JSON shape the agent must return.
TASKS = {
    "ana.briefing": ("ana", "Produce today's briefing for Anushka from the DESK STATE. Pick at most 3-5 priorities, ranked. Explain why each matters and the recommended action. Delegations are PROPOSALS only.",
                     {"greeting": "one-line greeting", "briefing": "3-5 sentence briefing in ANA's voice", "priorities": [{"rank": 1, "title": "", "why_it_matters": "", "deadline": "date or 'not set'", "owner": "agent or person", "next_action": "", "impact": "high|medium|low", "urgency": "high|medium|low", "effort": "high|medium|low", "confidence": "high|medium|low", "tradeoff": ""}], "proposed_delegations": [{"agent": "", "task": "", "reason": ""}], "missing_information": [""], "risks": [""], "deprioritised": [{"item": "", "reason": ""}]}),
    "agatha.review": ("agatha", "Review the DRAFT as an editorial-performance analyst against the 38-post dataset. Cite post ids. Give before/after edits whose 'before' is an exact substring of the draft.",
                      {"headline": "one-sentence verdict in AGATHA's voice", "observations": [{"point": "", "label": "DATASET|HYPOTHESIS|STRATEGY", "evidence_post_ids": ["P12"]}], "edits": [{"id": "a1", "type": "hook|structure|clarity|length|cta", "before": "exact substring", "after": "", "rationale": "", "evidence_post_ids": []}], "alternative_openings": [{"text": "", "why": ""}], "preferred_opening": 0, "relevant_posts": [{"post_id": "P12", "why_relevant": ""}], "performance_view": "realistic range-style view, no guarantees", "word_limit_check": "within / over by N / no limit supplied", "confidence": "low|medium|high", "confidence_reason": "", "hypotheses": [""], "experiment": {"hypothesis": "", "test": "", "success_metric": "", "continue_if": "", "stop_if": ""}}),
    "berdine.review": ("berdine", "Edit the DRAFT as Conduct's editor. Do not rewrite everything. Identify what works, what does not, what is missing. 'before' must be an exact substring of the draft.",
                       {"headline": "one-sentence verdict in BERDINE's voice", "voice_profile_note": "state that voice is an inferred profile", "what_works": [""], "inconsistent_with_voice": [""], "unclear_or_jargon": [{"phrase": "", "issue": "", "suggestion": ""}], "audience_fit": "", "cut": [""], "keep": [""], "uk_us_notes": [""], "edits": [{"id": "b1", "before": "exact substring", "after": "", "rationale": ""}], "minimal_edit": "full text", "stronger_rewrite": "full text", "unconventional_version": "full text", "most_important_edits": [""], "flag_for_diana": "or empty"}),
    "ana.synthesis": ("ana", "Synthesise the AGATHA and BERDINE reviews in SHARED CONTEXT for this draft. Do not add new specialist analysis. Identify agreement, conflicts and a single recommended edit list. 'before' must be an exact substring of the CURRENT draft text.",
                      {"summary": "", "agreements": [""], "conflicts": [{"issue": "", "agatha": "", "berdine": "", "ana_view": ""}], "recommended_edits": [{"id": "s1", "from_agent": "agatha|berdine|both", "before": "exact substring", "after": "", "rationale": "", "priority": "high|medium|low"}], "outstanding_concerns": [""], "next_step": ""}),
    "edith.story_brief": ("edith", "Assess whether the STORY record contains a real story. Ask focused questions first. Do not invent a narrative.",
                          {"verdict": "story|not_yet|no_story", "assessment": "", "what_we_know": [{"fact": "", "status": "verified|stated_unsourced|unverified"}], "questions_to_establish": [{"question": "", "ask_whom": ""}], "interview_questions": {"product": [""], "engineering": [""], "leadership": [""], "customer": [""]}, "proof_points_needed": [""], "approvals_needed": [""], "public_now": [""], "needs_permission": [""], "audience": "", "candidate_core_message": "[HYPOTHESIS] ...", "evidence_plan": [{"step": "", "owner": ""}], "handoff_to_berdine": "", "handoff_to_diana": ""}),
    "berdine.story_angles": ("berdine", "Propose editorial angles for the STORY using EDITH's brief in SHARED CONTEXT. If evidence is insufficient, say so and give angles that only use what is known.",
                             {"ready": False, "readiness_note": "", "options": [{"option": "A safest|B high upside|C high risk", "hook": "", "concept": "", "why_it_could_work": "", "audience": "", "platform": "", "format": "", "risk": ""}], "recommended": "", "why": "", "needs_from_anushka": [""]}),
    "diana.story_campaign": ("diana", "Suggest campaign or distribution possibilities for the STORY, only if genuinely relevant. Use SHARED CONTEXT.",
                             {"worth_a_campaign": "yes|maybe|no", "reason": "", "ideas": [{"name": "", "concept": "", "effort": "", "dependency": ""}], "distribution": [{"channel": "", "why": ""}], "small_test": ""}),
    "ana.next_steps": ("ana", "Using SHARED CONTEXT for this record, identify next steps, owners and dependencies. Do not redo specialist work.",
                       {"summary": "", "next_steps": [{"step": "", "owner": "", "depends_on": "", "when": ""}], "dependencies": [""], "open_questions": [""], "decision_needed_from_anushka": ""}),
    "diana.campaign": ("diana", "Pressure-test the CAMPAIGN. First clarify, then develop the strongest version, alternatives, a practical plan and a recommendation.",
                       {"clarifying_questions": [{"question": "", "why_it_matters": ""}], "challenge": {"verdict": "strong idea needing refinement|fundamental problems", "issues": [""]}, "strongest_version": {"concept": "", "hook": "", "experience": "", "why_people_participate": "", "what_they_remember": ""}, "alternatives": [{"name": "", "concept": "", "tradeoff": ""}], "resources": [""], "budget": {"range": "range or unknown", "assumptions": [""], "unknowns": [""]}, "dependencies": [""], "permissions_approvals": [""], "risks": [""], "timeline": [{"phase": "", "what": ""}], "distribution": [""], "success_metrics": [""], "continue_if": [""], "kill_if": [""], "small_test": "", "claims_caution": "", "recommendation": "test|develop|reject", "recommendation_reason": ""}),
    "catherine.campaign_events": ("catherine", "For the CAMPAIGN, identify which saved OPPORTUNITIES (in DESK STATE) could host it and the participation constraints. Anything not in the records is an UNVERIFIED LEAD.",
                                  {"fit_from_saved": [{"opportunity_id": "", "name": "", "fit": "", "constraints": ""}], "unverified_leads": [{"name": "", "why": "", "check_at": "official organiser site"}], "participation_constraints": [""], "what_to_verify": [""]}),
    "edith.campaign_evidence": ("edith", "For the CAMPAIGN, identify product or technical evidence that could strengthen it, and what Conduct must not imply.",
                                {"evidence_that_would_help": [""], "questions_for_product": [""], "questions_for_engineering": [""], "must_not_imply": [""], "approvals": [""]}),
    "ana.campaign_summary": ("ana", "Summarise feasibility, risks, dependencies and next steps for the CAMPAIGN from SHARED CONTEXT. Anushka decides test/develop/reject.",
                             {"summary": "", "feasibility": "", "risks": [""], "dependencies": [""], "next_steps": [""], "options": [{"choice": "test|develop|reject", "what_it_means": ""}], "ana_leaning": "", "why": ""}),
    "catherine.assess": ("catherine", "Assess the OPPORTUNITY record. Only use facts in the record; list every field that is unconfirmed.",
                         {"verdict": "pursue|watch|skip", "relevance": "", "audience_fit": "", "what_conduct_could_contribute": "", "plausible_roles": [{"role": "speaker|sponsor|attendee|partner|community|exhibitor", "plausibility": "high|medium|low", "why": ""}], "cost_note": "", "preparation": [""], "logistics": [""], "risks": [""], "reasons_not_to_pursue": [""], "facts_to_verify": [""], "next_action": "", "confidence": "low|medium|high", "evidence_quality": ""}),
    "catherine.research_plan": ("catherine", "No live browsing is configured. Produce a research plan for the QUERY and, separately, candidate leads from general knowledge that MUST be verified. Never give dates or deadlines for leads.",
                                {"mode_note": "Manual research plan: no live browsing performed.", "interpretation": "", "search_queries": [""], "official_sources_to_check": [{"source": "", "why": ""}], "candidate_leads": [{"name": "", "type": "", "market": "", "why_relevant": "", "status": "UNVERIFIED LEAD"}], "selection_criteria": [""], "questions_before_committing": [""]}),
    "ana.prioritise_opportunities": ("ana", "Rank the OPPORTUNITIES supplied for Conduct. Explain trade-offs. Prefer verified records; treat unverified items as conditional.",
                                     {"ranking": [{"opportunity_id": "", "name": "", "rank": 1, "why": "", "conditional_on": ""}], "recommended_next": "", "ask_diana_for": "", "missing_information": [""]}),
    "diana.opportunity_concept": ("diana", "Develop a possible creative participation concept for the OPPORTUNITY. Clarify first; keep claims safe; note costs as unknown unless supplied.",
                                  {"objective": "", "audience": "", "concept": "", "hook": "", "format": "", "what_we_need": [""], "cost_uncertainties": [""], "approvals": [""], "small_test": "", "kill_if": [""]}),
}


from tasks_extra import EXTRA_TASKS  # noqa: E402
TASKS.update(EXTRA_TASKS)


def task_prompt(task_id, payload):
    _, instruction, shape = TASKS[task_id]
    return (f"TASK: {instruction}\n\n{payload}\n\nReturn ONLY one JSON object in a ```json fenced block matching this shape (fill every key; use empty lists when nothing applies):\n"
            + json.dumps(shape, indent=1))
