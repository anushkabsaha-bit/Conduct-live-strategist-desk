# Conduct Communications Strategist Desk — PRD

## Original problem statement (summary)
Interactive AI-powered working desk demonstrating how Anushka Saha would run the Communications Strategist role at Conduct. Six distinct agents (ANA, AGATHA, BERDINE, CATHERINE, DIANA, EDITH) built from her original Zapier prompts (preserved verbatim, app layer separate). Workspaces: Daily Desk, Content Desk, Product & Customer Stories, Campaign Studio, Opportunity Radar, Agent Room, Source Library. Must match the visual identity of https://anushkabsaha-bit.github.io/Conduct/. Never invent facts; distinguish verified / dataset / external / hypothesis / illustrative / needs approval. No auto publishing.

## User choices
- LLM: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929) via Emergent LLM key
- Access control: none (open demo)
- Live web research: skipped → CATHERINE runs in clearly labelled MANUAL mode (no browsing)
- Prompts: BERDINE pasted in chat; ANA/AGATHA/CATHERINE/DIANA/EDITH from PDFs

## Source inspection
- 6 prompts stored verbatim in /app/backend/sources/*.txt (read-only); revisions stored in `prompt_revisions`
- LinkedIn dataset: 38 rows (month, short description, likes, comments, reposts). Likes sum = 7,079 (matches Growth OS). No full post text, dates, impressions, formats. Blank cells = null.
- Growth OS PDF: text extracted (90-day plan, outsider test, SAP Score reference)
- Architecture diagram: transcribed manually (image)
- Opportunities seeded with dates verified by builder web search (WeAreDevelopers 2026, DSAG-Jahreskongress 2026, SAP TechEd 2026, London Tech Week 2026) + needs-validation leads + community idea

## Architecture
- FastAPI (`server.py` generic CRUD `/api/c/{coll}`, `/api/run` async structured agent tasks + `/api/runs/{id}` polling, `/api/agents/{id}/chat` SSE streaming persisted even on disconnect, prompt registry), `agents.py` (registry, app layer, TASKS JSON schemas), `seed.py`, `dataset.py`
- Shared context: every run/chat linked to a record gets the record + latest recorded findings from other agents + decisions
- React: Shell + 7 pages; AgentRunCard/useRuns, Output renderer (claim labels + clickable post-evidence chips), WeekCalendar/BlockDialog, MakeTask

## Implemented (2026-10-10)
- Daily Desk: title, time-based greeting, date, ANA briefing (ranked priorities, trade-offs, proposed delegations, make task), today/deadlines/approvals, priorities, quick actions, Mon–Fri editable calendar (add/edit/move/complete/delete, weekly recurrence, start work → agent)
- Content Desk: drafts, format/audience/objective/word limit, versions, AGATHA + BERDINE independent reviews, ANA synthesis, accept/reject → new version, before/after diff, human approval & manual-publish record
- Stories: 8-stage pipeline, facts with verification status, questions, approvals, EDITH/BERDINE/DIANA/ANA runs
- Campaign Studio: SAP Score example concept, full brief fields, DIANA/CATHERINE/EDITH/ANA runs, test/develop/reject decisions
- Opportunity Radar: manual-mode banner, research plan, filters, verified calendar vs validation, compare, reject, convert to project (+task with context), ANA prioritise, DIANA concept
- Agent Room: 6 agents, own histories, linked shared context & findings, handoffs (recorded), flag missing info, prompt viewer + revisions
- Source Library: prompts, posts table, Growth OS, architecture, public sources/research, drafts/projects/decisions
- Tested: iteration_1 backend 25/25, frontend flows pass; Scenario A verified end to end

## Iteration 2 (corrective build, 2026-10-10)
- Shell: collapsible left sidebar (13 rooms), top bar with current room, global search (/api/search), open-task count, mobile drawer
- New rooms via generic workspace engine (`workspaces` collection, Room.jsx + Rooms.jsx config): Narrative Room, Founder & Exec Comms (incl. 5-minute founder conversation), Integrated Launch (user-set statuses Planning→Completed), People & Culture, Reputation & Media, Impact & Learning. Each: worked example (labelled interpretation/illustrative/hypothetical), editable fields, chained agent steps with shared context, export (.md), handoffs with persistent context panel, make task
- Content Desk stages A–D + One idea, different formats (EDITH direction, AGATHA evidence patterns incl. hook-length as hypothesis, BERDINE write/adapt/editorial note), export, save adapted draft as separate draft
- Stories: Freudenberg public LinkedIn source, verified fact, handoff to Content Desk / Launch
- Radar: 3-pane (saved lists, results, detail) + CATHERINE → DIANA → CATHERINE constraints → ANA next steps
- Daily Desk: day/week calendar, top-5 priorities with status
- Reliability: max_tokens 8000, auto-retry once on malformed JSON, server-side em-dash sanitising, indexes
- AGATHA receives results recorded in Impact & Learning
- Tested: iteration_2 + iteration_3 (backend 25/25, frontend in-scope 100%)

## Backlog
- P0: Live research integration (Perplexity/Tavily) for CATHERINE with source + date checked capture
- P1: File upload/ingestion via object storage with processing status; drag-and-drop calendar moves; Google Calendar sync
- P1: Inline edit of opportunity fields; project detail page
- P2: Publishing integrations (LinkedIn/Substack) behind explicit approval; access control for deployment

## Iteration 3 (strategist as main character, 2026-10-10)
- Freudenberg draft "Enterprise software has a documentation problem" seeded with brief (seed.py + DB)
- New AGATHA/BERDINE/ANA review schemas (strongest idea, biggest weakness, sentence verdicts, success beyond engagement, experiments; BERDINE human vs company copy, customer name-drop check, one revised draft; ANA agreements/conflicts/evidence vs hypothesis/unknowns/two decisions, no winner)
- My Editorial Decision section (side-by-side, agent compare, notes, reflection, facts to check, decision + reasoning + history, status chip); only it changes draft status
- Run cards show what the agent actually received (stored on run)
- Founder room: illustrative scenario without URL; three approaches (big idea / practical story / challenging question)
- Tested iteration_4: 7/7

## Iteration 4 (selective improvements, 2026-10-10)
- Decision-first Daily Desk (My desk: recorded decisions, outstanding questions/fact checks, next actions) above ANA briefing
- Sidebar: Core work (6) + collapsible More (7); nothing removed
- Founder conversation notes: conversation meta + pasted words; edith.founder_notes classifies DIRECT QUOTE / PARAPHRASE / INTERPRETATION / NEEDS SIGN-OFF
- LIVE research: Anthropic web_search server tool via Emergent key for catherine.live_research and catherine.event_audience; results carry source URL, official/secondary flag, dates and deadline separately, unknowns; save to radar with verification live_official/live_secondary
- Tested iteration_5: 6/6. Test data reset afterwards (Freudenberg draft back to v1, no decision)
- Known limit: live search tends to return aggregator (secondary) sources; official-site verification remains manual

## Iteration 5 (Launch Strategy, additive, 2026-10-11)
- Backup before changes: mongodump at /app/backups/pre_strategy_*; git checkpoint 976bd66
- New Core nav item "Launch Strategy" (/strategy) with tabs: Overview, /strategy/narrative, /score (full screen, outside shell), /strategy/measure
- backend/strategy.py: seeded once (meta k=strategy_seeded) into `strategy` collection (narrative, score_config, measure) + 3 drafts (series=launch_narrative) in `drafts`, so they're reviewable in Content Desk with AGATHA/BERDINE. Existing records untouched
- Narrative: labelled core narrative + sources S1-S4 (S1 LinkedIn could not be fetched automatically, flagged), 3 audiences + priority choice, 3 drafts editable/versioned with line-by-line evidence panel + claim checks, compare + preferred direction, questions for Conduct
- SAP Score: 3 questions, deterministic points, 4 bands (Growth OS lines), polaroid result card, copy (image/text), PNG download (html-to-image), restart; anonymous counts via /api/score/events, /api/score/stats (labelled prototype test data), DELETE to clear
- Measure: hypothesis picker, 9 metrics/6 areas, thresholds as planning assumptions, lock before launch, actuals (autosave on blur) vs assumption, Continue/Change/Stop history, failure analysis + notes
- Decisions log to `decisions` (ref_type strategy, label) -> Daily Desk; Conduct questions -> Daily Desk outstanding questions; Campaign Studio SAP Score links to /strategy
- Tested iteration_6: backend 6/6, frontend all flows pass; 2 minor fixes applied (actual autosave, option warning). Test data reset to seed
