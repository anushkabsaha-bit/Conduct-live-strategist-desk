from datetime import datetime, timedelta, timezone
import uuid

ILL = "Illustrative work block, not a confirmed Conduct meeting."


def _id():
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc).isoformat()


def week_monday(d=None):
    d = d or datetime.now(timezone.utc).date()
    return d - timedelta(days=d.weekday())


def calendar_blocks(monday):
    B = [
        (0, "09:00", "10:00", "Weekly communications planning", "planning", "Set the week's communications priorities and decide what is worth shipping.", "", ["ana"], "weekly"),
        (0, "10:30", "11:30", "Review last week's content performance", "performance", "Look at what performed, what did not, and why, with AGATHA and the 38-post baseline.", "", ["agatha"], "weekly"),
        (0, "13:00", "14:00", "Team priorities & editorial planning", "planning", "Align editorial slate with team priorities.", "Comms team (illustrative)", ["ana", "berdine"], "none"),
        (0, "14:30", "17:00", "Draft & research time", "editorial", "Protected writing and research block.", "", ["berdine"], "weekly"),
        (1, "09:30", "10:30", "Product team conversation", "product_story", "Understand what Product is actually building and what changed for the customer.", "Product team (to be confirmed)", ["edith"], "none"),
        (1, "11:00", "12:30", "Product & customer storytelling", "product_story", "Prepare questions with EDITH; decide whether there is a story.", "", ["edith"], "none"),
        (1, "14:00", "15:00", "Review upcoming feature story", "product_story", "Check evidence, approvals and what can be said publicly.", "", ["edith", "berdine"], "none"),
        (1, "15:30", "17:30", "Writing & editorial time", "editorial", "Writing block with BERDINE.", "", ["berdine"], "weekly"),
        (2, "09:30", "10:30", "Founder / leadership conversation", "founder", "Discuss founder language, product positioning and stories worth telling. Nothing agreed until confirmed.", "Leadership (not booked)", ["edith", "berdine"], "none"),
        (2, "11:00", "12:00", "LinkedIn editorial review", "editorial_review", "Review the current LinkedIn draft with BERDINE and AGATHA before any publication decision.", "", ["berdine", "agatha"], "none"),
        (2, "14:00", "16:30", "Filming / content production", "production", "Content production block.", "", ["diana"], "none"),
        (3, "09:30", "10:30", "Engineering conversation", "engineering", "Investigate a technical story that could become accessible, interesting content.", "Engineering (to be confirmed)", ["edith"], "none"),
        (3, "11:00", "12:30", "Event & community opportunities", "opportunities", "Review external events and communities with CATHERINE.", "", ["catherine"], "weekly"),
        (3, "14:00", "15:30", "Pressure-test campaign ideas", "campaign", "Pressure-test the SAP Score concept with DIANA.", "", ["diana"], "none"),
        (4, "09:30", "11:00", "Content filming / reshoot", "production", "Reshoot anything that did not land.", "", ["diana"], "none"),
        (4, "11:30", "12:30", "Prepare LinkedIn & Substack posts", "publishing", "Prepare the first posts. Publishing remains a human decision.", "", ["berdine", "agatha"], "none"),
        (4, "14:00", "15:00", "What performed, what didn't, why", "performance", "Weekly learning review.", "", ["agatha", "ana"], "weekly"),
        (4, "15:30", "16:30", "Next week's priorities & handover", "planning", "Prepare next week's priorities with ANA.", "", ["ana"], "weekly"),
    ]
    out = []
    for day, s, e, title, cat, purpose, parts, agents, rec in B:
        out.append({"id": _id(), "title": title, "date": (monday + timedelta(days=day)).isoformat(), "start": s, "end": e,
                    "category": cat, "purpose": purpose, "participants": parts, "prep_notes": "", "status": "planned",
                    "related": "", "agents": agents, "recurrence": rec, "illustrative": True, "note": ILL, "created_at": now()})
    return out


def tasks(monday):
    d = lambda n: (monday + timedelta(days=n)).isoformat()
    T = [
        ("Finalise first product story brief (Freudenberg × process documentation)", "edith", d(1), "high", "story",
         "First product story needs evidence and approvals before drafting.", "Run EDITH's story brief and list missing proof points."),
        ("Feasibility check: DSAG-Jahreskongress 2026 participation", "catherine", d(3), "medium", "research",
         "Dates verified from public listings; costs, deadlines and participation options are unknown.", "Ask CATHERINE to assess and list facts to verify."),
        ("Editorial review of LinkedIn draft before publication", "berdine", d(2), "high", "approval",
         "Draft is waiting for review; nothing ships without your approval.", "Run AGATHA + BERDINE reviews, then ANA synthesis."),
        ("Verify WeAreDevelopers World Congress 2026 call-for-speakers deadline", "catherine", d(3), "low", "follow_up",
         "A call for speakers exists on Sessionize but the deadline was not confirmed.", "Open the official source and record the deadline."),
        ("Decide: SAP Score booth, test, develop or reject", "diana", d(4), "medium", "decision",
         "Example concept only; needs DIANA's pressure-test and a decision.", "Run DIANA's pressure-test in Campaign Studio."),
    ]
    return [{"id": _id(), "title": t, "agent": a, "due": due, "importance": imp, "kind": k, "why": why, "next_action": na,
             "status": "open", "illustrative": True, "context": {}, "project_id": "", "block_id": "", "created_at": now()}
            for t, a, due, imp, k, why, na in T]


FREUD_DRAFT = """Process documentation is changing.

Your process documentation can be perfectly written and still be wrong.

Not because the document was badly written. Because the business changed.

People change processes. Systems get reconfigured. Exceptions become rules. The file that explains how it all works keeps describing a company that no longer exists.

That is the problem Conduct is exploring with Freudenberg: a capability designed to keep process documentation accurate, current and connected to reality, built hand-in-hand with the teams who feel the problem every day.

What breaks first in your organisation when the map stops matching the territory?"""


def drafts():
    return [{"id": _id(), "title": "The wrongness of a perfectly written document", "format": "LinkedIn post", "audience": "Enterprise / CIO / IT leadership",
             "objective": "Make the problem felt", "word_limit": None, "status": "in_review", "related_story": "",
             "provenance": "Anushka's first draft from the portfolio site, not official Conduct copy; based only on publicly available information.",
             "versions": [{"n": 1, "text": FREUD_DRAFT, "note": "Original draft", "source": "user", "created_at": now()}],
             "created_at": now(), "updated_at": now()}]


def stories():
    return [
        {"id": _id(), "title": "Freudenberg × process documentation", "stage": "Research", "kind": "product_launch",
         "what_happened": "Conduct publicly posted that it is working on a brand-new feature with Freudenberg, aimed at keeping SAP process documentation accurate, current and connected to reality.", "source_url": "https://www.linkedin.com/posts/conduct-ai_were-working-on-a-brand-new-feature-at-conduct-activity-7498006623475445762-LvUs",
         "audience": "Enterprise / CIO / IT leadership; practitioners; engineers",
         "known_facts": [{"fact": "Conduct is exploring a capability to keep process documentation current, with Freudenberg (as written in Anushka's draft, 'based only on publicly available information').", "status": "verified"},
                         {"fact": "Dataset P27: 'A brand new feature introduced' (76 likes, 6 comments, 1 repost), feature not named.", "status": "dataset"}],
         "open_questions": ["Which public Conduct source confirms the Freudenberg work?", "Has Freudenberg approved being named?", "What changed for the teams involved?"],
         "approvals": {"Product review": False, "Engineering review": False, "Customer approval": False, "Claims checked": False, "Quotes approved": False, "Screenshots approved": False, "Final edit": False},
         "formats": ["LinkedIn", "Customer story", "Product explainer", "Technical deep dive"], "illustrative": False, "created_at": now()},
        {"id": _id(), "title": "Black Box: can anyone explain Conduct?", "stage": "Idea", "kind": "experiment",
         "what_happened": "Growth OS idea: film 3 people (an engineer, an enterprise candidate, someone outside the space), give them Conduct's material and 10 minutes, then ask what they think.",
         "audience": "General tech audience; candidates", "known_facts": [{"fact": "Outsider test in Growth OS: 10 people unfamiliar with Conduct needed on average five posts to explain what it does.", "status": "dataset"}],
         "open_questions": ["Who are the participants?", "What material do they get?", "Consent and release forms?"],
         "approvals": {"Participant consent": False, "Final edit": False}, "formats": ["Short video", "LinkedIn"], "illustrative": True, "created_at": now()},
    ]


def campaigns():
    return [{"id": _id(), "name": "SAP Score booth", "status": "example_concept", "event": "A future London technology event (not booked)",
             "brief": "A physical Conduct photo booth: someone gets a Polaroid and a completely ridiculous 'SAP Score', not a real measurement, just Conduct making fun of the reality of working with massive SAP environments.",
             "audience": "SAP and enterprise practitioners, CIOs and transformation leaders, potential customers, potential talent.",
             "objective": "Make enterprise SAP pain memorable and start conversations.",
             "insight": "The point isn't the photo. The point is recognition: 'unfortunately, that is exactly my life.'",
             "concept": "SAP Score: 21%, 'Your SAP is being held together by thoughts and prayers.' 87%, 'You may actually know what's going on.' Second layer: 'Have you met Conduct before?', the Polaroid on the office fridge if they join.",
             "alternatives": "", "resources": "Creative, design, engineering or product input, event logistics, photography, content capture, approval.",
             "budget": "Unknown, no budget supplied.", "dependencies": "What can Conduct substantiate? What can the scoring logic safely say?", "risks": "People take the photo but can't remember Conduct. The joke becomes more memorable than the problem.",
             "timeline": "", "distribution": "Live event posts, short clips, founder post, photo carousel, event recap.",
             "metrics": "Participation, completion rate, shares, conversations started, whether people can say what Conduct does afterwards.",
             "kill_criteria": "People walk straight past it. It looks like every other tech event activation. Logistics cost more than the value.",
             "provenance": "From Anushka's Growth OS and portfolio Experiment Lab. Editable example concept, not an approved or scheduled Conduct initiative.",
             "decision": "", "created_at": now()}]


def _opp(name, typ, market, loc, start, end, url, verif, audience, why, notes, deadline="Unknown", cost="Unknown", status="new"):
    return {"id": _id(), "name": name, "type": typ, "market": market, "location": loc, "start_date": start, "end_date": end,
            "deadline": deadline, "source_url": url, "source_checked": datetime.now(timezone.utc).date().isoformat() + " (builder web search before app launch)", "verification": verif,
            "audience": audience, "relevance": why, "cost": cost, "participation": "", "preparation": "", "risks": "",
            "status": status, "next_action": "", "notes": notes, "contacts": "None publicly verified", "created_at": now()}


def opportunities():
    return [
        _opp("WeAreDevelopers World Congress 2026", "developer_conference", "Germany / Europe", "Berlin", "2026-07-08", "2026-07-10",
             "https://www.wearedevelopers.com/world-congress/", "verified_dates", "Developers, engineering leaders",
             "Large European developer conference; relevant for engineering talent and developer-facing storytelling.",
             "8 July warm-up, 9–10 July main days per official agenda page. A Call for Speakers listing exists on Sessionize; deadline not verified (may have closed)."),
        _opp("DSAG-Jahreskongress 2026", "enterprise_sap_event", "Germany / Europe", "Koelnmesse, Cologne", "2026-10-06", "2026-10-08",
             "https://dsag.de/events/", "verified_dates", "German-speaking SAP user group: SAP leaders, IT leadership, partners",
             "Core SAP audience. Dataset P02 shows Conduct's CPO posting about Conduct at a DSAG tech event in Hamburg (146 likes).",
             "Exhibitor/sponsor options, costs and deadlines not verified."),
        _opp("SAP TechEd 2026", "enterprise_sap_event", "Germany / Europe", "Berlin + virtual", "2026-10-27", "2026-10-29",
             "https://www.sap.com/events/teched.html", "verified_dates", "SAP developers, architects, technical practitioners",
             "Technical SAP audience; fits technical explainers and engineering-led stories.",
             "Participation formats and partner terms not verified."),
        _opp("London Tech Week 2026", "tech_conference", "UK", "Olympia London + fringe", "2026-06-08", "2026-06-12",
             "https://londontechweek.com/", "verified_dates", "Founders, investors, enterprise leaders, wider tech ecosystem",
             "Dataset P14: 'London Tech Week x Conduct run clubs' (167 likes). Relevant to the SAP Score idea for a future edition.",
             "Main conference 8–10 June, fringe 8–12 June 2026 (already under way/past at time of build). 2027 dates not verified.", status="watch"),
        _opp("WeAreDevelopers World Congress North America", "developer_conference", "US", "Unconfirmed", "", "",
             "https://www.wearedevelopers.com/world-congress-north-america", "needs_validation", "Developers (US)",
             "Possible US developer touchpoint for engineering storytelling.", "Official page exists; dates and location not verified."),
        _opp("Imperial AI hackathon", "hackathon", "UK", "London (unconfirmed)", "", "", "", "needs_validation", "Students, early-career AI engineers",
             "Named in Anushka's Growth OS as an example opportunity for talent reach.", "No official source attached yet. Name, dates and format must be verified."),
        _opp("Conductors' lunch: how enterprise systems change", "community_idea", "UK", "London (idea)", "", "", "", "idea",
             "Conductors and invited practitioners", "Small lunch to discuss how enterprise systems change, how teams document those changes, and what people misunderstand about enterprise software.",
             "Community idea, not an event. Needs audience, value for attendees, cost and follow-up plan."),
    ]


def sources(prompt_lengths, dataset_rows):
    S = []
    for a, n in prompt_lengths.items():
        S.append({"id": _id(), "category": "original_prompts", "title": f"{a.upper()}, original Zapier prompt", "kind": "pdf" if a != "berdine" else "pasted_text",
                  "status": "ingested", "detail": f"{n:,} characters extracted verbatim. Stored read-only; revisions saved separately.", "url": "", "ref": a, "created_at": now()})
    S += [
        {"id": _id(), "category": "historical_posts", "title": "Conduct LinkedIn analysis, 38 posts", "kind": "pdf", "status": "ingested",
         "detail": f"{dataset_rows} rows parsed (month, description, likes, comments, reposts). Full post text not supplied.", "url": "", "ref": "dataset", "created_at": now()},
        {"id": _id(), "category": "strategy", "title": "Conduct Growth OS (Conduct@growth generalist.pdf)", "kind": "pdf", "status": "ingested",
         "detail": "6 pages; text extracted. 90-day plan, outsider test, agent roles, SAP Score reference.", "url": "", "ref": "growth_os", "created_at": now()},
        {"id": _id(), "category": "architecture", "title": "Agent architecture diagram", "kind": "image", "status": "transcribed_manually",
         "detail": "Image supplied in chat. Agent roles and the operating loop (Observe → Analyse → Find → Create → Challenge → Execute → Measure → Learn → Repeat) transcribed into the app by the builder.", "url": "", "ref": "architecture", "created_at": now()},
        {"id": _id(), "category": "public_sources", "title": "Anushka's Conduct portfolio site (visual reference)", "kind": "url", "status": "reference",
         "detail": "Visual identity reference and source of the Freudenberg draft and Experiment Lab concepts.", "url": "https://anushkabsaha-bit.github.io/Conduct/", "ref": "", "created_at": now()},
        {"id": _id(), "category": "public_sources", "title": "Conduct Growth OS (live)", "kind": "url", "status": "reference", "detail": "Linked from the portfolio site.",
         "url": "https://conduct-growth-os.vercel.app/", "ref": "", "created_at": now()},
    ]
    return S
