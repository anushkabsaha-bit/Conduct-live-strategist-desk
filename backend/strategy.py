"""Launch strategy content: narrative, three proposed drafts, SAP Score prototype and measurement plan. Seeded once, never overwritten."""
import uuid
from datetime import datetime, timezone

FREUD_URL = "https://www.linkedin.com/posts/conduct-ai_were-working-on-a-brand-new-feature-at-conduct-activity-7498006623475445762-LvUs"


def _id():
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc).isoformat()


SOURCES = [
    {"id": "S1", "title": "Conduct on LinkedIn: Freudenberg collaboration post", "url": FREUD_URL, "kind": "First-party public post",
     "supports": "Conduct is working on a new feature with Freudenberg aimed at keeping SAP process documentation accurate, current and connected to reality.",
     "check_note": "LinkedIn blocks automated reading. The builder could not fetch the full post text, so this summary comes from the post URL and the existing source record. Read the full post yourself before relying on any detail."},
    {"id": "S2", "title": "The Conduct mission (conduct.ai blog)", "url": "https://conduct.ai/blog/the-conduct-mission", "kind": "First-party blog",
     "supports": "Quoted: \"Enterprise IT is too complex to manage through manual understanding.\" \"Business logic is scattered, knowledge is siloed, and IT is forced into the role of translator rather than innovator.\" \"Not a consultancy report. Not outdated documentation. A living, always-live view that gives both IT and business teams the same map of reality.\"",
     "check_note": "Read by the builder on the day this page was built."},
    {"id": "S3", "title": "Conduct Series A announcement (conduct.ai blog)", "url": "https://conduct.ai/blog/series-a", "kind": "First-party blog",
     "supports": "Announces a $60m round and names Index Ventures, ICONIQ and SAP as investors. Describes Conduct as linking business processes to the underlying code to make system changes faster. Claims \"87% of global commerce runs through an SAP system\" (Conduct's statistic, not independently checked).",
     "check_note": "Read by the builder on the day this page was built. Check the exact wording before quoting it."},
    {"id": "S4", "title": "Conduct homepage", "url": "https://conduct.ai/", "kind": "First-party website",
     "supports": "Headline: \"AI operating system for enterprise software\". \"Unlock the systems that power your business.\"",
     "check_note": "Homepage copy changes over time. Recheck it before using any line."},
]

NARRATIVE = [
    {"label": "verified", "src": ["S1"], "text": "Conduct has said in public that it is working with Freudenberg on a new capability. The aim is to keep SAP process documentation accurate, current and connected to reality."},
    {"label": "verified", "src": ["S2"], "text": "Conduct's mission post argues that enterprise systems have become too complex to understand by hand. It sets \"a living, always-live view\" against \"outdated documentation\", and says both IT and business teams should share the same map of reality."},
    {"label": "verified", "src": ["S3", "S4"], "text": "Conduct calls itself an AI operating system for enterprise software. Its Series A post describes linking business processes to the underlying code."},
    {"label": "interpretation", "src": ["S1", "S2"], "text": "The story underneath this announcement isn't documentation as a deliverable. It's whether a team's understanding of its system stays true after the system changes."},
    {"label": "interpretation", "src": ["S2", "S3"], "text": "That makes documentation a transformation question as well as a technical one. What a team can safely change depends on what it actually understands."},
    {"label": "proposed", "src": [], "text": "Proposed narrative line for this portfolio: keeping the system and the story in sync."},
    {"label": "hypothesis", "src": [], "text": "Enterprise practitioners recognise the gap between documentation and reality well enough to respond to a playful prompt about it. SAP Score is the proposed test."},
    {"label": "confirm", "src": [], "text": "Needs confirmation from Conduct: launch timing, scope, availability, approved wording, and whether Freudenberg can be named in launch material."},
]

AUDIENCES = [
    {"id": "cio", "name": "CIO or enterprise technology leader",
     "message": "You can't plan a safe change to a system you only partly understand. Reliable, current knowledge of how your systems behave is part of the transformation plan, not a side task.",
     "why": "Transformation decisions carry cost and risk. If the documented picture of a process has drifted from what the system really does, the plan rests on an assumption nobody has checked.",
     "evidence": [{"src": "S2", "text": "The mission post describes systems that are too complex to understand through manual effort, and a shared map for IT and business teams."},
                  {"src": "S3", "text": "The Series A post frames Conduct around faster transformation of complex systems."},
                  {"src": "S1", "text": "The Freudenberg work is aimed at keeping process documentation accurate and current."}],
     "uncertain": "We have no public outcome data from the Freudenberg work. We don't know how the capability performs, what it costs a team to adopt, or whether it changes planning decisions in practice.",
     "repeatable": "Before we change it, we should know what it actually does today."},
    {"id": "sap", "name": "SAP lead or technical practitioner",
     "message": "Years of customisation live in your system, and every one of them has a reason. The hard part is keeping the description of those processes and dependencies true as the system keeps changing.",
     "why": "Practitioners get the question 'why does it work like this?' and often answer it from memory, old specs or by reading the code. Drift between documentation and configuration makes every change investigation slower and riskier.",
     "evidence": [{"src": "S1", "text": "SAP process documentation that stays accurate, current and connected to reality is the stated aim of the Freudenberg work."},
                  {"src": "S2", "text": "\"Business logic is scattered, knowledge is siloed\" is Conduct's public description of the problem."},
                  {"src": "S3", "text": "Linking business processes to the underlying code is Conduct's public framing."}],
     "uncertain": "Which SAP modules, custom code types or documentation formats the capability covers is not public. Nor is how it handles changes made outside the system.",
     "repeatable": "The documentation is only useful if it moves when the system moves."},
    {"id": "candidate", "name": "Potential candidate",
     "message": "Behind this work is a hard, human problem: helping people understand complex systems well enough to change them, when the knowledge sits across code, process and people.",
     "why": "Strong engineers, designers and product people look for problems with real depth. This one combines technical understanding with business context and the way organisations actually remember things.",
     "evidence": [{"src": "S2", "text": "The mission post describes IT as forced into the role of translator between systems and the business."},
                  {"src": "S1", "text": "The Freudenberg collaboration shows the problem being worked on with a real enterprise team."}],
     "uncertain": "Which roles work on this capability, how the team is structured and what the day-to-day work involves are not public. Anything about culture or hiring needs Conduct's input.",
     "repeatable": "It's a translation problem between how a system works and how a business thinks it works."},
]

D1 = """A business changes. Its systems change with it. The documentation doesn't always keep up.

In SAP environments, years of customisation can encode how a business actually operates. Understanding those decisions matters when teams need to change a process, investigate a dependency or plan a transformation.

At Conduct, we're working with colleagues from Freudenberg Group on a capability aimed at one part of that problem: keeping process documentation accurate, current and connected to reality.

The interesting bit isn't producing another document. It's keeping the understanding behind it useful.

Because a business shouldn't have to rely on an old document to understand how it works today."""

D2 = """Before you change an enterprise system, you need to understand what it actually does.

That sounds obvious. In a heavily customised environment, it can be a substantial piece of work.

Conduct's mission starts with that problem: helping teams understand the systems that run their businesses, including the code, configuration and dependencies that have accumulated over time.

Our work with Freudenberg Group on keeping SAP process documentation accurate and connected to reality is one example of the questions this raises.

How do you keep technical understanding aligned with the way a business operates? And how do you make that understanding useful to the people making decisions, not just the people who know where the code lives?

Those are worth working on before the next transformation begins."""

D3 = """Enterprise software isn't just code.

It's also years of decisions about how a business works, what it needs and why its systems have been customised in particular ways.

That knowledge doesn't always sit in one place. Some of it is in the system. Some is in documentation. Some is with the people who have spent years working with it.

Conduct is exploring how AI can help connect technical systems, business processes and organisational knowledge. In our work with colleagues from Freudenberg Group, that includes the challenge of keeping SAP process documentation accurate and connected to reality.

The technology matters. So does understanding the people and processes around it.

That's the part of enterprise AI I find especially interesting."""

FREUD_EV = {"line": "Freudenberg Group", "label": "verified", "src": ["S1"], "note": "Matches the public post's stated aim. It's written in Conduct's own voice ('we', 'our'), so Conduct would need to approve it before use."}

DRAFTS = [
    {"direction": "problem", "title": "Launch draft 1: The problem", "text": D1, "evidence": [
        {"line": "The documentation doesn't always keep up", "label": "interpretation", "src": ["S2"], "note": "A general framing. The mission post contrasts its approach with 'outdated documentation'."},
        {"line": "years of customisation can encode how a business actually operates", "label": "interpretation", "src": ["S2"], "note": "Related to 'business logic is scattered'. The SAP-specific wording is mine."},
        {"line": "change a process, investigate a dependency or plan a transformation", "label": "interpretation", "src": ["S3"], "note": "Examples chosen by me. The Series A post frames the work around system change and transformation."},
        FREUD_EV,
        {"line": "isn't producing another document", "label": "interpretation", "src": [], "note": "My editorial angle. Not a Conduct statement."},
        {"line": "rely on an old document", "label": "interpretation", "src": ["S2"], "note": "Echoes the 'living, always-live view' versus 'outdated documentation' contrast."}]},
    {"direction": "consequence", "title": "Launch draft 2: The business consequence", "text": D2, "evidence": [
        {"line": "understand what it actually does", "label": "interpretation", "src": ["S2"], "note": "The mission post says enterprises can 'understand how their systems actually work'."},
        {"line": "heavily customised environment", "label": "interpretation", "src": [], "note": "A reasonable general claim, but no public Conduct source quantifies it."},
        {"line": "code, configuration and dependencies", "label": "confirm", "src": ["S2"], "note": "The mission post talks about code and business logic. 'Configuration and dependencies' goes further than the public wording and needs confirming."},
        FREUD_EV,
        {"line": "not just the people who know where the code lives", "label": "interpretation", "src": ["S2"], "note": "Builds on 'the same map of reality' for IT and business teams."},
        {"line": "before the next transformation begins", "label": "interpretation", "src": ["S3"], "note": "Links to the transformation framing in the Series A post."}]},
    {"direction": "people", "title": "Launch draft 3: The people behind the systems", "text": D3, "evidence": [
        {"line": "years of decisions about how a business works", "label": "interpretation", "src": ["S2"], "note": "My framing of 'business logic is scattered, knowledge is siloed'."},
        {"line": "Some is with the people", "label": "interpretation", "src": ["S2"], "note": "Extends 'knowledge is siloed' to people. That extension is my interpretation."},
        {"line": "connect technical systems, business processes and organisational knowledge", "label": "confirm", "src": ["S3"], "note": "Public sources describe linking business processes to code. 'Organisational knowledge' is my addition and needs confirming."},
        FREUD_EV,
        {"line": "I find especially interesting", "label": "confirm", "src": [], "note": "A first-person line. It needs a real named author who agrees with it. It must not be attributed to a founder."}]},
]

QUESTIONS = [
    "Can Freudenberg be named in launch material, and in what wording?",
    "Is there an approved launch date, availability or scope for the capability?",
    "Does the capability cover configuration and dependencies, or process documentation only?",
    "Who would publish each post: the company page, a founder or a team member?",
]

SCORE = {
    "title": "SAP Score",
    "intro": "Three questions about how your organisation knows what its systems do. About a minute. Honest answers are funnier.",
    "disclaimer": "An independent campaign prototype by Anushka Saha. Not affiliated with or approved by Conduct or SAP. Not a diagnosis of any real SAP landscape. No personal data is collected; only anonymous counts of starts, completions and shares.",
    "questions": [
        {"id": "q1", "q": "Someone asks why a core process works the way it does. Where does the answer live?", "options": [
            {"label": "In documentation that was updated this quarter", "points": 32},
            {"label": "In a document. Updated at some point.", "points": 18},
            {"label": "In the head of someone who is on holiday", "points": 8},
            {"label": "In a custom field nobody wants to touch", "points": 2}]},
        {"id": "q2", "q": "A small change is requested to a process everyone relies on. What happens first?", "options": [
            {"label": "We check what it touches, and we can actually see it", "points": 34},
            {"label": "A meeting to work out who would know", "points": 18},
            {"label": "We change it carefully and watch closely", "points": 8},
            {"label": "We politely decline. It's load-bearing.", "points": 3}]},
        {"id": "q3", "q": "How does a new joiner learn how your systems really behave?", "options": [
            {"label": "Current documentation, plus someone to ask", "points": 34},
            {"label": "Shadowing the one person who knows", "points": 16},
            {"label": "Archaeology", "points": 8},
            {"label": "The first time something breaks", "points": 2}]},
    ],
    "results": [
        {"min": 0, "max": 30, "title": "Held together by thoughts and prayers", "line": "Your systems work. Nobody is entirely sure why, and nobody wants to be the one to find out.", "prompt": "Where does the real knowledge about your systems live?"},
        {"min": 31, "max": 55, "title": "Tribal knowledge economy", "line": "The answers exist. They're just stored in people, meetings and a folder called 'final_v3'.", "prompt": "What would you lose if your most experienced colleague left tomorrow?"},
        {"min": 56, "max": 79, "title": "Mostly mapped, occasionally haunted", "line": "You know most of it. The rest only shows up when someone changes something.", "prompt": "Which part of your system do you trust least, and why?"},
        {"min": 80, "max": 100, "title": "You may actually know what's going on", "line": "Rare. Your documentation and your system seem to be on speaking terms.", "prompt": "How do you keep it that way when the system keeps changing?"},
    ],
    "provenance": "Concept from Anushka's Growth OS (the 21% and 87% SAP Score lines). Questions and result bands written for this prototype and editable.",
}

HYPOTHESES = [
    {"id": "recognition", "text": "Recognition: a playful self-assessment makes the documentation-versus-reality gap feel familiar enough that relevant people share their result."},
    {"id": "conversation", "text": "Conversation: the result gives SAP practitioners and technology leaders a low-stakes reason to talk about how well their systems are understood."},
    {"id": "talent", "text": "Talent: the problem behind the quiz makes technically curious candidates more interested in the work behind it."},
]

M = lambda id, area, name, why, how, baseline, pos, neg, dec, tracking, auto="": {
    "id": id, "area": area, "name": name, "why": why, "how": how, "baseline": baseline, "positive": pos, "negative": neg, "decision": dec,
    "tracking": tracking, "auto": auto, "threshold": "", "threshold_note": "", "actual": "", "actual_note": "", "actual_at": ""}

METRICS = [
    M("reach_relevant", "Reach", "Relevant audience reach", "Reach only matters if it reaches people who work with complex enterprise systems.",
      "Platform analytics for the posts that distribute the score, filtered by job function or industry where the platform offers it.",
      "Typical reach and audience mix of recent Conduct posts, from Conduct's own analytics. Not available to this portfolio.",
      "Most of the reach is in enterprise IT, SAP and transformation roles.", "Big reach, but mostly outside the intended roles.",
      "Shift distribution channels or partners before changing the concept.", "external"),
    M("visits_referral", "Reach", "Campaign visits by referral source", "Shows which channels actually bring people to the score.",
      "UTM-tagged links per channel, read in web analytics.", "Visits from a comparable recent campaign link, if Conduct has one.",
      "One or two channels clearly drive relevant visits.", "Visits are flat across every channel, or come only from internal sharing.",
      "Invest in the channels that work and drop the rest.", "external"),
    M("starts", "Participation", "Quiz starts", "The first sign the invitation is interesting enough to try.",
      "Counted anonymously by this prototype when someone starts question one.", "Visits to the score page, so starts can be read as a share of visits.",
      "A clear share of visitors start.", "Most visitors leave without starting.", "Rework the intro and the first question.", "prototype", "starts"),
    M("completion_rate", "Participation", "Completion rate", "Shows whether the questions hold attention for about a minute.",
      "Completions divided by starts, counted anonymously by this prototype.", "No benchmark exists. Set a planning assumption and check it during a small pilot.",
      "Most people who start finish.", "A sharp drop at one question.", "Rewrite or cut the question where people drop off.", "prototype", "completion_rate"),
    M("shares", "Sharing", "Share actions", "Sharing tests whether the result is worth showing to someone else.",
      "Copy and download clicks on the result card, counted anonymously by this prototype. Where people post the card afterwards can't be seen.",
      "Share actions as a share of completions, measured in the pilot.", "A meaningful share of people who finish copy or download their result.",
      "People finish but almost nobody shares.", "Check whether the result titles are too generic or too risky to post.", "prototype", "shares"),
    M("referrals_mentions", "Sharing", "Tracked referral visits and relevant mentions", "Shows whether shared results bring in new, relevant people.",
      "Visits from a share-specific UTM link, plus a manual log of public posts or comments that mention the score.", "None yet. Record the first pilot as the baseline.",
      "Shared results bring new visitors from the intended roles.", "Shares happen but bring nobody new.", "Decide whether the card needs a clearer reason to click through.", "manual"),
    M("audience_match", "Audience relevance", "Audience match", "A popular quiz with the wrong audience is a distraction.",
      "Only from information people choose to make public (who comments or reposts) or offer in conversation. No tracking of individuals and no hidden profiling.",
      "Conduct's understanding of its target roles, which this portfolio doesn't have.", "Engagement comes mostly from practitioners, technology leaders and relevant candidates.",
      "Engagement comes mostly from marketers, students outside the field or general quiz fans.", "Change where the score is distributed, or reframe the questions for the intended roles.", "manual"),
    M("qualified_conversations", "Business relevance", "Qualified conversations linked to the campaign", "The real business test: does the score open useful conversations?",
      "A manual log of conversations or enquiries where the person mentions the score, or where the score link was the first touch. Recorded by the team, never inferred.",
      "The usual rate of inbound conversations in a comparable period, from Conduct's own data.", "Several conversations where the score clearly opened the discussion.",
      "No conversation links back to the score.", "If participation is strong but conversations are absent, test a clearer next step. If both are weak, stop.", "manual"),
    M("learning", "Learning", "What participants understood", "Shows whether people connect the joke to the real problem of keeping system knowledge current.",
      "Short conversations with a few participants, and a reading of public comments: what they think the score was about, and what confused them.",
      "None. This is qualitative and recorded as notes.", "People describe the documentation-versus-reality gap in their own words.",
      "People remember the joke but can't say what problem it points to.", "Strengthen the link from the result to the problem, or rethink the concept.", "manual"),
]

FAILURE = [
    {"pattern": "High completion, little relevant sharing", "reading": "The interaction may be entertaining but not worth being seen sharing. The result titles may be too self-deprecating for senior people to post.", "investigate": "Ask a few participants whether they would share it and what would stop them. Compare share rates across result bands."},
    {"pattern": "Strong sharing, wrong audience", "reading": "The joke may travel on its general appeal, cut off from the enterprise problem behind it.", "investigate": "Look at who comments and reposts. Check whether the distribution channel, not the concept, explains the mix."},
    {"pattern": "Relevant participation, no conversations", "reading": "The score may raise recognition without a clear next step, or the step from quiz to conversation may be too big.", "investigate": "Review the result card's prompt and whether there was any natural way to continue the discussion."},
    {"pattern": "People drop off at one question", "reading": "That question may assume too much SAP knowledge, or may feel like a trick.", "investigate": "Compare completion by question and rewrite the one with the biggest drop."},
    {"pattern": "People remember the score, not the problem", "reading": "The joke may have become more memorable than the point (a risk already named in Campaign Studio).", "investigate": "In learning conversations, ask what people think the score was about before explaining it."},
]


def drafts_docs():
    out = []
    for d in DRAFTS:
        out.append({"id": _id(), "title": d["title"], "format": "LinkedIn post", "audience": "Enterprise technology leaders, SAP practitioners and potential candidates",
                    "objective": "Proposed launch narrative post for Conduct's publicly described process documentation work.", "word_limit": None, "status": "draft",
                    "series": "launch_narrative", "direction": d["direction"], "evidence": d["evidence"],
                    "provenance": "Proposed, unapproved portfolio draft by Anushka Saha. Independent work, not commissioned or approved by Conduct.",
                    "brief": {"subject": "Keeping the system and the story in sync", "channel": "LinkedIn", "source_url": FREUD_URL,
                              "source_material": "Public sources: Freudenberg collaboration post, Conduct mission, Series A announcement, homepage."},
                    "versions": [{"n": 1, "text": d["text"], "note": "Original working version (supplied by Anushka)", "source": "user", "created_at": now()}],
                    "created_at": now(), "updated_at": now()})
    return out


async def ensure(db):
    if await db.meta.find_one({"k": "strategy_seeded"}):
        return
    drafts = drafts_docs()
    await db.drafts.insert_many([dict(d) for d in drafts])
    await db.strategy.insert_many([
        {"id": _id(), "key": "narrative", "title": "Keeping the system and the story in sync", "sources": SOURCES, "core": NARRATIVE, "audiences": AUDIENCES,
         "draft_ids": [d["id"] for d in drafts], "priority_audience": "", "priority_reason": "", "preferred_draft": "", "preferred_reason": "",
         "claim_checks": {}, "questions": QUESTIONS, "created_at": now(), "updated_at": now()},
        {"id": _id(), "key": "score_config", **SCORE, "created_at": now(), "updated_at": now()},
        {"id": _id(), "key": "measure", "objective": "Find out whether SAP Score attracts relevant people, encourages meaningful participation and creates useful communications or business conversations.",
         "hypotheses": HYPOTHESES, "hypothesis_id": "", "hypothesis_custom": "", "metrics": METRICS, "locked_at": "", "decision_history": [], "failure": FAILURE,
         "failure_notes": "", "created_at": now(), "updated_at": now()},
    ])
    await db.meta.insert_one({"k": "strategy_seeded", "at": now()})


# ---------- v2: show the work (additive) ----------
D_THREE = """Somewhere in an enterprise system, there's probably a decision someone made three years ago that still matters today.

The tricky bit is knowing where that decision lives.

In the code? The documentation? A process map? Or in the head of the person who's been working with the system for years?

That's part of what makes enterprise software so complicated. Businesses change, systems get customised, and the picture of how everything fits together can become harder to keep up to date.

Conduct's public work with Freudenberg Group explores one part of that problem: keeping SAP process documentation accurate, current and connected to reality.

Because understanding a system shouldn't depend entirely on finding the one person who remembers why it works the way it does."""

THREE_FLAGS = [
    {"line": "three years ago", "label": "illustrative", "note": "Illustrative timeframe. Not a verified detail about Freudenberg or any customer. Change or remove before publication."},
    {"line": "Conduct's public work with Freudenberg Group", "label": "verified", "note": "Based on Conduct's public Freudenberg post (S1). Read the full post before publishing."},
    {"line": "the one person who remembers", "label": "interpretation", "note": "A human image, not a claim about any real team."},
]

OPENING = {
    "original": "Enterprise software has a documentation problem.\n\nThe way a business works changes over time. Its processes evolve, its systems become more customised, and the documentation that describes them can struggle to keep up.",
    "alternative": "Ask someone why an enterprise system works the way it does, and the answer might not be in one neat document.\n\nIt might be spread across configuration, process documentation and the experience of the people who have worked with it for years.",
    "difference": "The original states the problem straight away. The alternative starts with a concrete question and gives the reader something to picture. Neither is automatically better: the extra detail might help a reader who has never thought about documentation, or it might delay the point for someone who already has.",
    "choice": "", "reason": "", "decided_at": "",
}

SCORE_V2_QUESTIONS = [
    {"id": "q1", "q": "Where does the explanation live? When someone asks why an important business process works the way it does, where would you expect to find the answer?", "options": [
        {"label": "In one clear, up-to-date place", "points": 33},
        {"label": "Across a few different documents and systems", "points": 18},
        {"label": "By asking the person who has been there the longest", "points": 6}]},
    {"id": "q2", "q": "The business has changed. Has the documentation kept up?", "options": [
        {"label": "There is a clear process for keeping it current", "points": 33},
        {"label": "It depends on which change happened and who updated it", "points": 18},
        {"label": "I would want to check before claiming it is up to date", "points": 8}]},
    {"id": "q3", "q": "A new colleague needs to understand a complicated process. What happens next?", "options": [
        {"label": "They can follow a clear explanation of the process and its dependencies", "points": 34},
        {"label": "They need several sources and someone to help connect them", "points": 18},
        {"label": "They need to find the people who remember how it all fits together", "points": 6}]},
]
SCORE_V2_RESULTS = [
    {"min": 0, "max": 39, "title": "Held together by thoughts and prayers", "line": "The system works. The explanation mostly lives in people, and they are busy.", "prompt": "Who would you call first if a core process broke tomorrow?"},
    {"min": 40, "max": 59, "title": "Tribal knowledge economy", "line": "The answers exist. They're spread across documents, systems and a few very patient colleagues.", "prompt": "What would you lose if your most experienced colleague left?"},
    {"min": 60, "max": 84, "title": "Mostly mapped, occasionally haunted", "line": "You know most of it. The rest only appears when someone changes something.", "prompt": "Which part of your system do you trust least, and why?"},
    {"min": 85, "max": 100, "title": "You may actually know what's going on", "line": "Rare. Your documentation and your system seem to be on speaking terms.", "prompt": "How do you keep it that way when the business keeps changing?"},
]

Q = lambda q: {"q": q, "answer": "", "evidence": "", "permission": "not requested", "approval": "not approved"}
FILM = {
    "key": "film",
    "label": "Proposed customer-story film concept, based on public information. Not commissioned or approved.",
    "question": "What happens when the documentation describing a business process no longer reflects how the business actually works?",
    "question_status": "proposed angle",
    "angle_reason": "",
    "public_basis": [{"src": "S1", "text": "Conduct says it is working with Freudenberg on keeping SAP process documentation accurate, current and connected to reality."},
                     {"src": "S2", "text": "Conduct's mission contrasts a living view of systems with outdated documentation."}],
    "outline": [
        {"id": "opening", "part": "Opening", "purpose": "Establish why understanding how a system works matters before anyone changes it.", "notes": "A simple, human question on screen: why does this process work like this?"},
        {"id": "context", "part": "Context", "purpose": "Explain the documented challenge of keeping process documentation current as the business changes.", "notes": "Use only what is public. No claims about Freudenberg's internal situation until confirmed."},
        {"id": "investigation", "part": "Investigation", "purpose": "The questions the customer and Conduct would need to answer: what was hard, what changed, how it works day to day.", "notes": "This section can only be written after interviews."},
        {"id": "evidence", "part": "Evidence", "purpose": "The examples, demonstrations or verified details that would make the story credible.", "notes": "A real before and after of one process, if Freudenberg agrees to show it."},
        {"id": "ending", "part": "Ending", "purpose": "Return to the opening idea: understand the system before you change it.", "notes": "End on the people, not the product."},
    ],
    "interviews": [
        {"role": "freudenberg", "who": "A Freudenberg representative (only if an interview were possible and permission granted)", "questions": [
            Q("Before this work, how did your team find out why a process worked the way it did?"),
            Q("Can you describe a moment when the documentation and the system told different stories?"),
            Q("What made keeping documentation current hard in practice: time, ownership, change volume, something else?"),
            Q("What, if anything, has changed in how your team works since the collaboration began?"),
            Q("What evidence would you be comfortable sharing publicly to show that change?")]},
        {"role": "conduct_product", "who": "A Conduct product or engineering colleague", "questions": [
            Q("What exactly does the capability do with process documentation, and what does it not do?"),
            Q("How does it notice when the system has changed and the documentation hasn't?"),
            Q("What was the hardest technical problem in the Freudenberg work?"),
            Q("What could we demonstrate on screen without exposing customer data?")]},
        {"role": "conduct_customer", "who": "A customer-facing colleague who understands the collaboration", "questions": [
            Q("Why did Freudenberg want to work on this problem?"),
            Q("Which people on the customer side felt the problem most?"),
            Q("Which claimed improvements can be backed by something we could show?"),
            Q("What is Freudenberg comfortable having said publicly, and who approves it?")]},
    ],
    "unanswered": [],
    "story_changes": [
        {"if": "The real difficulty was ownership (nobody knew who should update documentation)", "then": "The film becomes a story about people and responsibility, and the technology is the support act."},
        {"if": "The real difficulty was change volume (the system changed faster than anyone could document)", "then": "The film leads with speed and scale, and the evidence section needs a concrete example of drift."},
        {"if": "Freudenberg can't be named or shown on camera", "then": "Switch to an anonymised explainer built around a fictionalised, clearly labelled process, or don't make the film."},
        {"if": "No improvement can be substantiated yet", "then": "Make it a 'work in progress' story about the question, not a success story."},
    ],
    "production": [
        {"kind": "Visual", "idea": "Split screen: a process diagram on one side, the live system behaviour on the other, slowly drifting apart.", "status": "idea"},
        {"kind": "Visual", "idea": "Hands and desks, not faces, if the customer prefers not to appear.", "status": "idea"},
        {"kind": "Demonstration", "idea": "A short screen recording of the capability updating documentation after a change. Needs a safe demo environment.", "status": "idea"},
        {"kind": "Narration", "idea": "Voiced by a Conduct engineer in plain language, with customer voices only if approved.", "status": "idea"},
        {"kind": "Distribution", "idea": "90 second LinkedIn cut, a 3 minute website version, and 15 second clips for event screens.", "status": "idea"},
    ],
}

BRIEF = {
    "key": "brief",
    "label": "Proposed campaign brief. Not approved, launched or tested.",
    "fields": [
        {"k": "audience", "t": "Audience", "v": "SAP leads and practitioners first, enterprise technology leaders second, curious technical candidates third."},
        {"k": "problem", "t": "Communications problem", "v": "Keeping process documentation connected to reality matters, but it sounds dull. People nod and scroll past."},
        {"k": "objective", "t": "Campaign objective", "v": "Get the right people to recognise the gap in their own organisation and talk about it, so the launch narrative has an audience ready for it."},
        {"k": "why_interactive", "t": "Why an interactive format", "v": "Asking people to answer a question about their own systems turns an abstract problem into a personal one. A score gives them something to compare and a light reason to share."},
        {"k": "idea", "t": "Central idea", "v": "Your SAP Score: three honest questions about where the explanation for your systems really lives."},
        {"k": "channels", "t": "Proposed distribution", "v": "Conduct's LinkedIn, employee reshares, event screens and QR codes at SAP community events, and the launch narrative posts."},
        {"k": "action", "t": "Action I want the audience to take", "v": "Play, share their result with a colleague, and if it rings true, read the launch story or start a conversation."},
        {"k": "assumptions", "t": "Assumptions to validate", "v": "That practitioners will find the questions familiar. That the result titles are safe to share. That a quiz doesn't feel too light for an enterprise audience."},
        {"k": "resources", "t": "Resources and approvals", "v": "Design and front-end time, a privacy check on the anonymous counts, brand and legal approval for SAP references, and Conduct's sign-off on the copy."},
        {"k": "measures", "t": "Measures for the next decision", "v": "Completion rate, share actions, audience relevance and conversations that clearly started with the score. See Did it work?"},
    ],
    "challenges": [
        {"challenge": "Is a quiz too playful for people responsible for critical systems?", "response": ""},
        {"challenge": "Could 'SAP Score' be read as an official SAP assessment?", "response": ""},
    ],
    "alternatives": [
        {"id": "score", "concept": "SAP Score (interactive quiz)", "pros": "Personal, quick, shareable.", "cons": "Risk of feeling gimmicky; the joke can outshine the point."},
        {"id": "drift", "concept": "'Spot the drift' visual series", "pros": "Shows the problem visually, low effort for the audience.", "cons": "Passive. Harder to know who recognised themselves."},
        {"id": "stories", "concept": "Practitioner story prompts ('the oldest decision in your system')", "pros": "Starts real conversations and gathers language.", "cons": "Needs community management; slower to build momentum."},
    ],
    "chosen": "", "choice_reason": "",
}

SCENARIOS = [
    {"pattern": "People start the quiz but few finish it", "reading": "I would investigate the questions, length and friction before deciding the concept itself has failed."},
    {"pattern": "People finish and share, but it reaches very few relevant enterprise technology audiences", "reading": "I would investigate distribution and audience fit."},
    {"pattern": "Participation is strong but no useful conversations follow", "reading": "I would ask whether the campaign is entertaining people without advancing its communications objective."},
]


async def ensure_v2(db):
    if await db.meta.find_one({"k": "showwork_seeded"}):
        return
    await db.drafts.insert_one({"id": _id(), "title": "The decision someone made three years ago", "format": "LinkedIn post",
        "audience": "SAP practitioners and enterprise technology leaders", "objective": "Make the documentation problem feel human and specific before mentioning Conduct.",
        "word_limit": None, "status": "draft", "series": "editorial_case", "flags": THREE_FLAGS,
        "provenance": "Unapproved working draft based on public material. Independent portfolio work, not approved by Conduct.",
        "brief": {"subject": "The decision someone made three years ago", "channel": "LinkedIn (company)", "source_url": FREUD_URL, "source_material": "Conduct's public Freudenberg collaboration post."},
        "versions": [{"n": 1, "text": D_THREE, "note": "Original working draft (supplied by Anushka)", "source": "user", "created_at": now()}],
        "created_at": now(), "updated_at": now()})
    freud = await db.drafts.find_one({"title": "Enterprise software has a documentation problem"})
    if freud and "opening_alternatives" not in freud:
        await db.drafts.update_one({"id": freud["id"]}, {"$set": {"opening_alternatives": OPENING}})
    cfg = await db.strategy.find_one({"key": "score_config"})
    if cfg:
        earlier = {"saved_at": now(), "note": "First question set (4 options each), replaced by Anushka's question directions", "questions": cfg["questions"], "results": cfg["results"]}
        await db.strategy.update_one({"key": "score_config"}, {"$set": {"questions": SCORE_V2_QUESTIONS, "results": SCORE_V2_RESULTS, "updated_at": now()}, "$push": {"earlier_versions": earlier}})
    await db.strategy.update_one({"key": "measure"}, {"$set": {"experiments": [], "scenarios": SCENARIOS}})
    await db.strategy.insert_many([{"id": _id(), **FILM, "created_at": now(), "updated_at": now()}, {"id": _id(), **BRIEF, "created_at": now(), "updated_at": now()}])
    await db.meta.insert_one({"k": "showwork_seeded", "at": now()})


# ---------- v3: SAP Score booth campaign, expanded in place ----------
E = lambda t, why: {"t": t, "why": why}
BOOTH = {
    "label": "Independent, uncommissioned proposal based on public information. No event is booked, nothing is approved, and nothing has run.",
    "why": {
        "observation": "At a busy technology event, dozens of companies compete for the same few seconds of attention. A conventional stand asks an unfamiliar visitor to read product messaging before they have a reason to care. My working observation is that this often isn't enough to make someone stop. It's a starting assumption, not a proven claim about every event.",
        "problem": "How can Conduct make a complicated enterprise technology problem approachable and memorable to someone who may not know the company yet?",
        "elements": [
            E("A physical visual attraction", "A Polaroid booth is visible from across a hall. It says 'something to do' rather than 'something to read', which is a lower bar for a stranger."),
            E("A quick, participatory experience", "A few questions and a photo take about a minute. That's short enough to say yes to between sessions, and doing something is more memorable than being told something."),
            E("Humour from recognisable frustrations", "Jokes about ancient macros and undocumented customisations work because practitioners live with them. The laugh should be 'that's my life', never 'look at those SAP customers'."),
            E("A tangible object to take away", "People keep photographs. A Polaroid has a better chance of surviving the trip home than a flyer, and it carries the Conduct name with it."),
            E("A reason to talk or share", "A funny score is easy to show a colleague. That gives the idea a chance to travel beyond the stand. It's an opportunity, not an assumed result."),
            E("A natural opening for a conversation", "'What did you get?' is an easier first line for a Conduct team member than 'Can I tell you about our product?'. The photo earns the right to have the conversation."),
        ],
        "score": "The score adds curiosity. A number gives the participant something to react to, and gives other people a reason to ask what it means. It's a creative device. It doesn't examine anyone's system, measure SAP maturity or diagnose anything, and every card and every team script would say so.",
        "conduct": [
            {"where": "The photograph", "how": "Conduct's name and one short line about what the company does. The safest starting point is Conduct's own public wording: 'AI operating system for enterprise software'.", "src": "S4", "approval": "Any line beyond the public homepage wording needs Conduct's approval."},
            {"where": "The booth conversation", "how": "A team member explains in a sentence or two, drawing on the public mission: helping enterprises understand how their systems actually work.", "src": "S2", "approval": "Talking points, and anything about the Freudenberg work or product capabilities, need Conduct's approval."},
            {"where": "The QR destination", "how": "A mobile page explaining what SAP Score was, what Conduct does in plain language, links to public product information, and an optional request for a conversation.", "src": "S3", "approval": "Page copy, any product claims and the data handling for the request form need Conduct's approval."},
        ],
        "chain": [
            {"step": "Attention", "intended": "The booth gives a stranger a reason to stop.", "untested": "Whether it stands out at a specific event."},
            {"step": "Recognition", "intended": "The questions and the line on the photo feel familiar.", "untested": "Whether the humour reads as recognition rather than mockery."},
            {"step": "Product discovery", "intended": "The photo, the conversation and the QR page explain what Conduct does.", "untested": "Whether people can say what Conduct does afterwards."},
            {"step": "Next conversation", "intended": "Someone with a real need asks to talk.", "untested": "Whether any relevant conversations happen at all."},
        ],
    },
    "journey": [
        {"id": "A", "t": "Notice", "what": "A visitor notices the Polaroid booth among the other stands.",
         "show": [{"k": "Visual hook", "v": "A tall Polaroid frame in cream, brown and orange, a wall of example photos, and one sign."}, {"k": "Example signage", "v": "What's your SAP Score? One minute. One photo. No sales pitch."}, {"k": "Opening line", "v": "Want to find out how haunted your SAP landscape is?"}],
         "why": "Curiosity, a visible queue of people laughing, and a promise that it's quick. Each lowers the cost of stopping.", "safeguards": ""},
        {"id": "B", "t": "Participate", "what": "A Conduct team member invites the visitor to answer a few playful questions. They get a score and a Polaroid-style photo.",
         "show": [{"k": "Questions", "v": "The same three questions as the playable SAP Score prototype."}, {"k": "Experience", "v": "About a minute: answer, pose, receive the photo with the score and a line."}],
         "why": "The visitor does something and gets something. The team member gets a natural reason to talk.",
         "safeguards": "Every card says 'For fun. Not an assessment of your systems.' No question asks for company names or system details. The score comes only from the answers. The team script never implies a diagnosis."},
        {"id": "C", "t": "Discover", "what": "The team member briefly explains what Conduct does. The photo carries Conduct's branding, and a QR code leads to a mobile page about the concept and the product.",
         "show": [{"k": "On the photo", "v": "Conduct name, one approved line, QR code."}, {"k": "QR page", "v": "What SAP Score was, what Conduct does, public product information, an optional request to talk."}],
         "why": "The participant should leave understanding the company, not just remembering the joke.", "safeguards": "Product wording limited to approved, public information."},
        {"id": "D", "t": "Share", "what": "The participant might share the photo on LinkedIn, show a colleague or take it back to their team.",
         "show": [{"k": "Example caption", "v": "Apparently my SAP Score is 34%. In my defence, the macro was there before me. Polaroid from the Conduct booth at [event]."}, {"k": "Digital version", "v": "A scan of their own photo, available only if they ask for it."}],
         "why": "Sharing is a chance for the idea to travel, not an assumed result.",
         "safeguards": "Visible photography notice at the booth. Conduct only posts photos of people with written consent. Visitors choose whether to share their own. Nothing is posted automatically. An alternative card without a photo for anyone who'd rather not be photographed."},
        {"id": "E", "t": "Start a commercial conversation", "what": "A visitor who recognises the problem may want to talk about their own enterprise systems.",
         "show": [{"k": "Next steps offered", "v": "Talk to someone at the booth now, a relevant resource via the QR page, or an opt-in request for follow-up."}, {"k": "Relevance signals", "v": "Works with SAP or other enterprise systems, describes a real problem (documentation, change, dependencies), has influence over that work, and asks to continue the conversation."}],
         "why": "This is the opportunity. The photo was only the hook.",
         "safeguards": "Not every participant is a potential customer, and a QR scan is not a lead. No follow-up without an explicit request. Notes are recorded only with consent and handled through Conduct's own data processes (to be confirmed)."},
        {"id": "F", "t": "Follow through", "what": "After the event: recap, approved photos, follow-up with people who asked, and a review of the conversations.",
         "steps": [
             {"step": "Publish an event recap", "owner": "Communications (proposed: me)", "timing": "Within 48 hours", "approvals": "Conduct brand approval", "info": "Approved photos, what actually happened at the booth"},
             {"step": "Share approved photographs", "owner": "Communications with the event team", "timing": "Within a week", "approvals": "Written consent from each person pictured", "info": "Consent records"},
             {"step": "Follow up with people who asked", "owner": "To be decided by Conduct (sales or founders)", "timing": "Within five working days", "approvals": "Consent captured at the booth", "info": "Conversation notes, what they asked for"},
             {"step": "Review the conversations generated", "owner": "Communications with sales", "timing": "Two weeks after the event", "approvals": "None beyond data handling", "info": "Conversation log and qualification notes"},
         ], "show": [], "why": "", "safeguards": ""},
    ],
    "recruitment": {
        "label": "Proposed extension. Not an existing Conduct recruitment practice.",
        "steps": [
            {"t": "Meet Conduct", "v": "Someone takes home their SAP Score Polaroid from a hackathon or technology event."},
            {"t": "Months later", "v": "They see a role at Conduct and decide to apply."},
            {"t": "Optional question", "v": "The application asks: 'Have you met Conduct at an event or hackathon?' They can name the event or upload their old Polaroid if they want to."},
            {"t": "A conversation starter", "v": "If it comes up, it's a story about how they first met the company. It doesn't prove ability or suitability."},
            {"t": "If hired, and only with consent", "v": "Their photo joins a fridge or display alongside other Conductors, with the story of how their connection began."},
        ],
        "value": ["The event experience stays memorable long after the event.", "A physical photo creates a small, personal connection with the brand.", "Future recruitment communications get a distinctive human story.", "A photo can tell the story of how a future colleague first met Conduct."],
        "safeguards": ["Entirely optional. Attendance, participation or owning a photo is never a requirement.", "Not scored and never used as a selection filter. No preferential treatment.", "Keep the answer out of screening decisions. Share it with interviewers only after a decision, if at all.", "Uploaded photos follow Conduct's data retention policy. Display only with consent, removable at any time."],
        "needs": "Approval from Conduct's people or talent team and a privacy check on the optional upload.",
    },
    "commercial": {
        "chain": ["Event attention", "Participation", "Recognition of an enterprise problem", "Understanding what Conduct does", "Relevant conversation", "Qualified opportunity", "Potential customer"],
        "point": "A Polaroid doesn't sell enterprise software. The idea is that a distinctive interaction could create an opening for a more meaningful conversation.",
        "ambition": "Contributing to two or three new clients is an ambition worth evaluating, not a prediction.",
        "must_be_true": ["The event audience includes people who own or influence enterprise systems.", "Some booth interactions turn into meaningful conversations.", "Some of those people have a relevant product need.", "Follow-up is fast, personal and handled by the right person.", "Sales qualification separates interest from real opportunity.", "Enough time passes to allow for a realistic enterprise sales cycle, which may be many months."],
        "failures": [
            {"risk": "The joke overshadows the company", "test": "Ask a few participants what Conduct does as they leave.", "change": "Make the Conduct line on the photo bigger and the team's one-sentence explanation part of handing it over."},
            {"risk": "People take photos but never understand the product", "test": "Compare QR page engagement with photos taken. Check what people say in follow-up.", "change": "Move the product explanation into the moment the photo develops, which is a natural pause."},
            {"risk": "The audience enjoys it but contains few relevant buyers", "test": "Log relevance signals for each conversation, with consent.", "change": "Choose a different event, or run it at a smaller practitioner meetup first."},
            {"risk": "Follow-up is too weak to turn interest into conversations", "test": "Track time to follow-up and response rate for people who asked.", "change": "Agree owners and a follow-up template before the event, not after."},
        ],
    },
    "phases": [
        {"phase": "Select and validate the event and audience", "deliverables": "A shortlist of London events with audience evidence (from Opportunity Radar)", "owner": "Me, with Conduct's events lead", "deps": "Event dates, audience data, stand costs", "decision": "Is the audience relevant enough to justify a booth?", "who": "both"},
        {"phase": "Verify the product message and scoring concept with Conduct", "deliverables": "Approved one-line description, QR page copy, card disclaimer", "owner": "Conduct product and marketing", "deps": "Conduct's time and sign-off", "decision": "Can we say this, and is the humour on-brand?", "who": "conduct"},
        {"phase": "Prototype the booth, questions, photo and QR destination", "deliverables": "Playable SAP Score (exists), card mock-up, QR page draft, booth sketch", "owner": "Me", "deps": "None for the prototype", "decision": "Is it quick, clear and funny?", "who": "independent"},
        {"phase": "Test whether people get both the joke and the company", "deliverables": "Five to eight people outside Conduct play it, then say what Conduct does", "owner": "Me", "deps": "Volunteers", "decision": "Do they remember the company, not just the joke?", "who": "independent"},
        {"phase": "Confirm costs, permissions, accessibility, staffing, logistics and consent", "deliverables": "Budget, venue rules, step-free access, no-photo alternative, consent forms, staffing rota", "owner": "Conduct events and operations", "deps": "Budget approval, venue", "decision": "Is it feasible and responsible at this event?", "who": "conduct"},
        {"phase": "Run the activation, only after approvals", "deliverables": "Signed-off approvals checklist, the booth on the day", "owner": "Conduct event team", "deps": "Every previous phase", "decision": "Go or no-go", "who": "conduct"},
        {"phase": "Follow up and distribute approved content", "deliverables": "Follow-ups to people who asked, recap, consented photos", "owner": "Sales and communications", "deps": "Consent records, conversation notes", "decision": "Who gets which follow-up?", "who": "conduct"},
        {"phase": "Evaluate the commercial and recruitment learning", "deliverables": "Results recorded on the Did it work? page against the original thresholds", "owner": "Me, with Conduct", "deps": "Real results", "decision": "Proceed, revise or stop", "who": "both"},
    ],
    "budget": [{"item": i, "low": "", "high": "", "note": ""} for i in ["Stand space or share of a partner stand", "Instant camera, film or printing", "Booth build and signage", "Staffing (people x days)", "QR landing page", "Travel and incidentals"]],
    "decisions": [{"q": q, "a": "", "example": ex} for q, ex in [
        ("Why I chose this idea over a conventional stand", "Illustrative example: a stand asks for attention; a booth gives people something to do first."),
        ("Why the Polaroid is the right creative mechanism", "Illustrative example: it's physical, quick and leaves something behind."),
        ("Why the score needs to connect to Conduct's actual product", "Illustrative example: otherwise people remember a joke, not a company."),
        ("Why I included the recruitment extension", "Illustrative example: the same object can carry a story long after the event."),
        ("Which audience I would prioritise first", "Illustrative example: SAP practitioners, because they recognise the problem fastest."),
        ("What I would test before committing to the full activation", "Illustrative example: whether five people outside Conduct can say what it does after playing."),
        ("What I would deliberately leave out", "Illustrative example: prizes, lead capture at the camera, anything that feels like a sales trap."),
        ("What requires input or approval from Conduct", "Illustrative example: the product line, the QR page, budget and consent handling."),
        ("What evidence would change my mind", "Illustrative example: people consistently can't say what Conduct does afterwards."),
    ]],
    "verdict": "", "verdict_reason": "",
}

BOOTH_TIMELINE = "1. Select and validate the event. 2. Verify message and scoring with Conduct. 3. Prototype. 4. Test understanding. 5. Confirm costs, permissions, accessibility, staffing and consent. 6. Run only after approvals. 7. Follow up. 8. Evaluate. See the Execution chapter for owners and decisions."
BOOTH_ALTS = "Spot the drift visual series. Practitioner story prompts ('the oldest decision in your system'). A conventional stand with a product demo. See the campaign brief for the comparison."

BM = lambda id, name, why, how, can, cannot, baseline, period, pos, neg, dec, tracking="manual", area="Booth activation": {**M(id, area, name, why, how, baseline, pos, neg, dec, tracking), "can": can, "cannot": cannot, "period": period, "campaign": "booth"}
BOOTH_METRICS = [
    BM("booth_attention", "Attention and booth participation", "Shows whether the booth gives people a reason to stop.", "Hand count of people who stop and of people who take part, per hour.", "Whether the booth draws people in at this event.", "Whether they were relevant, or what they understood.", "Footfall past the stand in the first hour, counted on the day.", "Event day", "A steady queue from the intended roles.", "People walk past or stop only to look.", "Change the signage, position or opening line."),
    BM("booth_completion", "Participation completion", "Shows whether the experience is quick and clear enough to finish.", "Photos printed divided by people who started.", "Whether the format works in a busy hall.", "Whether anyone learned anything about Conduct.", "None. Set a planning assumption.", "Event day", "Nearly everyone who starts finishes.", "People abandon halfway.", "Cut a question or speed up printing."),
    BM("booth_qr", "QR scans and meaningful product-page engagement", "Connects the photo to the product.", "Scans from a booth-specific QR link, then time on page and clicks to product information.", "Whether people were curious enough to look up Conduct.", "Whether they're buyers. A scan isn't a lead.", "Normal traffic to the page before the event.", "Event day plus 14 days", "A meaningful share of photo-takers explore the product page.", "Scans with no further engagement.", "Rewrite the QR page or the line on the photo.", "external"),
    BM("booth_shares", "Voluntary shares", "Shows whether the photo travels beyond the stand.", "Public posts mentioning the booth or showing the photo, logged by hand.", "Whether the photo is worth showing to others.", "Anything about reach among buyers.", "None. Record the first event as the baseline.", "Event day plus 7 days", "Some participants share it unprompted.", "Nobody shares, or shares get no response.", "Check whether the lines are too risky to post."),
    BM("booth_conversations", "Relevant enterprise conversations", "The point of the booth: conversations with people who have the problem.", "A consented log of conversations meeting the relevance signals.", "Whether the booth opens real conversations.", "Whether they'll become opportunities.", "Conversations at a comparable Conduct event stand, if Conduct has the data.", "Event day", "Several conversations with clear relevance signals.", "Lots of laughter, no relevant conversations.", "Review the audience fit and the team script."),
    BM("booth_qualified", "Qualified opportunities", "Shows whether conversations turn into something sales would pursue.", "Opportunities that sales qualify and link back to the booth.", "Whether interest survived follow-up.", "Revenue, or whether the booth caused the deal.", "Conduct's usual rate from events, if available.", "90 days after the event", "At least one qualified opportunity clearly started at the booth.", "No opportunities after real follow-up.", "Decide whether the event, the follow-up or the concept failed."),
    BM("booth_outcomes", "Actual commercial outcomes", "The ambition: contributing to two or three new clients.", "Closed deals where the booth is recorded as the first touch.", "Whether the ambition was plausible.", "Clean causation, since enterprise sales have many touches.", "Conduct's sales cycle length and win rates (internal).", "6 to 12 months", "A deal where the booth is credibly part of the story.", "No outcomes after a full sales cycle.", "Judge cost against outcomes and decide whether to repeat."),
    BM("booth_recruitment", "Recruitment interest and future colleague stories", "Tracks the recruitment extension separately from commercial results.", "Optional answers to 'Have you met Conduct at an event?', counted only in aggregate.", "Whether the event is remembered by future applicants.", "Anything about candidate quality. It must never affect selection.", "None. It starts at zero.", "12 months or more", "Some applicants mention the booth and some hires share their photo with consent.", "Nobody ever mentions it.", "Keep or drop the optional question.", area="Booth: recruitment (tracked separately)"),
]


async def ensure_v3(db):
    if await db.meta.find_one({"k": "booth_seeded"}):
        return
    c = await db.campaigns.find_one({"name": "SAP Score booth"})
    if c and "story" not in c:
        patch = {"story": BOOTH}
        if not (c.get("timeline") or "").strip():
            patch["timeline"] = BOOTH_TIMELINE
        if not (c.get("alternatives") or "").strip():
            patch["alternatives"] = BOOTH_ALTS
        await db.campaigns.update_one({"id": c["id"]}, {"$set": patch})
    m = await db.strategy.find_one({"key": "measure"})
    if m and not any(x.get("campaign") == "booth" for x in m["metrics"]):
        await db.strategy.update_one({"key": "measure"}, {"$push": {"metrics": {"$each": BOOTH_METRICS}}})
    await db.meta.insert_one({"k": "booth_seeded", "at": now()})
