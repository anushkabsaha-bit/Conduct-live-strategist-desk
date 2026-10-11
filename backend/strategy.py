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
