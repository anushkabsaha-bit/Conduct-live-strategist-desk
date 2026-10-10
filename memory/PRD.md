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

## Backlog
- P0: Live research integration (Perplexity/Tavily) for CATHERINE with source + date checked capture
- P1: File upload/ingestion via object storage with processing status; drag-and-drop calendar moves; Google Calendar sync
- P1: Inline edit of opportunity fields; project detail page
- P2: Publishing integrations (LinkedIn/Substack) behind explicit approval; access control for deployment
