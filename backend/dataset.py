"""Conduct LinkedIn dataset transcribed from 'for analysis of conduct.pdf' (supplied by Anushka)."""

# (id, month, description, likes, comments, reposts, author_context, note)
_ROWS = [
    ("P01", "April", "Alex Wood announcing his joining and Conduct reposting it", 85, 17, 1, "employee_repost", None),
    ("P02", "April", "CPO posting on Conduct taking over at Hamburg (DSAG tech)", 146, 14, 2, "leadership", None),
    ("P03", "May", "Conduct reposting an article on 'friction to velocity': redefining SAP delivery with Conduct AI", 29, None, 5, "company_repost", "Source lists '29 likes 5 reposts'; comments blank."),
    ("P04", "May", "Conduct running at Madrid round 2 and partnering with BCG announcement", 89, 7, None, "company", "Source lists '89 7'; the 7 is placed in the comments column but could be ambiguous."),
    ("P05", "May", "Sebastian mentioning Conduct for Europe's AI ecosystem taking off", 1686, 40, 78, "external_mention", "Largest outlier in the dataset; posted by an external person."),
    ("P06", "May", "Conduct's booth announcement at Sapphire CBS", 22, None, None, "company", "Only likes recorded."),
    ("P07", "May", "80% of global commerce runs on SAP and Conduct partnering with it (Jan Philipp posted it on his page and Conduct reposted it)", 480, 171, 21, "founder", None),
    ("P08", "May", "Conduct separately on its page posting about its partnership with SAP", 314, 43, 5, "company", None),
    ("P09", "June", "Thinc* Jan* Conduct insight interview ('Always start with a problem and not a cool idea'), whole interview about origination", 104, 10, 2, "founder", None),
    ("P10", "June", "Marie Therese Krainer posting and Conduct reposting about W Lehman", 64, 3, 4, "external_repost", None),
    ("P11", "June", "Jake Goldman joining as an engineer and Conduct reposted it", 51, 10, 3, "employee_repost", None),
    ("P12", "June", "'Conduct saved my marriage' post by Jan and enterprise stack announcement, Conduct reposting it", 896, 428, 20, "founder", "Highest comment count in the dataset."),
    ("P13", "June", "$60 million raise", 528, 90, 9, "company", "Source says '60 million raise'; currency as written in source is not specified."),
    ("P14", "June", "London Tech Week x Conduct run clubs", 167, 10, 6, "company", None),
    ("P15", "June", "UKAI hackathons (AI poster)", 79, 6, 19, "company", None),
    ("P16", "June", "Tuyet of Fielmann group posted about Conduct's association with their group", 93, 3, 6, "customer_mention", None),
    ("P17", "June", "Conduct's official page announcing 'Conduct is full on SAP' (Sapphire)", 116, 8, 11, "company", None),
    ("P18", "July", "Conduct 5k run", 48, None, None, "company", "Source lists '48 1'; the column for the '1' is unclear, so it is not assigned."),
    ("P19", "July", "Jan Philipp announcing 50 Conductors and the team enjoying a farm post", 347, 30, 4, "founder", None),
    ("P20", "July", "Lena Schmidt post and Conduct repost", 125, 16, 2, "employee_repost", None),
    ("P21", "July", "Henry Thompson meet-up and Conduct reposting it", 86, 4, 1, "leadership", None),
    ("P22", "July", "Conduct x Legora: Henry posted it and Conduct reposted it", 84, 8, 3, "leadership", None),
    ("P23", "July", "Tonio and Armand joining", 83, 7, 2, "joiner", None),
    ("P24", "July", "Legora x Conduct", 170, 18, 10, "company", None),
    ("P25", "August", "Vanya and Lachlan joining", 41, 5, None, "joiner", None),
    ("P26", "August", "New office update and reposted by Jan", 24, None, None, "company", None),
    ("P27", "August", "A brand new feature introduced", 76, 6, 1, "company", "Feature not named in the source."),
    ("P28", "August", "OpenAI x Conduct", 110, 4, 8, "company", None),
    ("P29", "August", "Jan P + Tech Europe", 81, 11, 2, "founder", None),
    ("P30", "August", "Partnership with Swiss Krono post", 73, 2, 4, "company", None),
    ("P31", "August", "Jan posting about speaking at Slush and Conduct reposting", 233, 26, 2, "founder", None),
    ("P32", "August", "Sam joining", 68, 2, None, "joiner", None),
    ("P33", "August", "Conduct team watching eclipse", 80, 12, 1, "culture", None),
    ("P34", "August", "Building and scaling engineering team", 73, 9, 7, "company", None),
    ("P35", "August", "Conduct HQ 4.0 post", 67, 5, 1, "culture", None),
    ("P36", "August", "3 people joining the Conduct train", 95, 8, 2, "joiner", None),
    ("P37", "August", "Conduct x incident.io", 65, 7, None, "company", None),
    ("P38", "August", "Lisa Marie joining", 101, 4, None, "joiner", None),
]

POSTS = [
    {"id": r[0], "month": r[1], "description": r[2], "likes": r[3], "comments": r[4], "reposts": r[5],
     "author_context": r[6], "note": r[7], "source": "for analysis of conduct.pdf"}
    for r in _ROWS
]

DATASET_NOTES = [
    "38 rows transcribed verbatim from the supplied PDF table (Month, Post, Likes, Comments, Reposts).",
    "Post-level content is a short description written by Anushka, not the full post text.",
    "Not supplied: exact publication dates, impressions, follower counts, post format, word count, full copy.",
    "Blank cells are recorded as null (unknown), never as zero.",
    "Growth OS PDF reports totals of 7,079 likes, 1,045 comments, 251 reposts. Row-level likes sum to 7,079; comments and reposts sum slightly lower because some cells are blank or ambiguous.",
    "Date range as written in the Growth OS source: April to 28 August 2026.",
    "author_context is an application-layer label inferred from each description (e.g. 'joiner', 'founder'); it is not part of the source.",
]


def dataset_summary():
    s = lambda k: sum((p[k] or 0) for p in POSTS)
    return {"rows": len(POSTS), "likes_sum": s("likes"), "comments_sum": s("comments"), "reposts_sum": s("reposts"),
            "reported_totals": {"likes": 7079, "comments": 1045, "reposts": 251, "avg_likes": 186, "avg_comments": 27.5, "avg_reposts": 6.6},
            "notes": DATASET_NOTES}


def dataset_compact():
    lines = ["id|month|description|likes|comments|reposts|author_context|note"]
    for p in POSTS:
        lines.append("|".join(str(p[k]) if p[k] is not None else "null" for k in ["id", "month", "description", "likes", "comments", "reposts", "author_context", "note"]))
    return "\n".join(lines)
