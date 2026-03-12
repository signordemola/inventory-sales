# BLOG_POST_BRIEF_RULES.md
**For: Adedamola Bello — demoladevop.com**
**Version: 2026.1**

> Use this file when you want to turn a project or idea into a blog post.
> Instruct your AI:
> "Read BLOG_POST_BRIEF_RULES.md in full. Then read the project's Knowledge Document and portfolio fields. Generate a complete blog post brief and first draft based on the post type I select."

---

## The Purpose of This Document

Adedamola does not have a writing process yet. He knows what he has built and why. He understands Nigerian business operations from direct experience. But turning that knowledge into a structured blog post is where things break down.

This file gives him a writing system. It defines three post types — each with a distinct audience, structure, and purpose. It tells the AI how to turn project knowledge into a complete brief and first draft. Adedamola reviews, adjusts where needed, and publishes. He does not start from a blank page.

---

## Before You Begin

Read the following before generating anything:

1. The project's Knowledge Document if it exists — this is the primary source of business context, metrics, and content angles
2. The project's portfolio fields — `overview`, `problem`, `challenge`, `approach`, `results`
3. The brand voice rules — found in the brand persona file in this repository
4. The anti-AI writing rules — found in the ANTI_AI_WRITING file in this repository

If no Knowledge Document exists for the project, work from the portfolio fields only. Do not invent details that are not present in either source.

---

## The Three Post Types

### Type 1 — The Problem Post

**Audience:** Nigerian business owners — salon owners, distributors, retailers, service businesses, FMCG operators. Non-technical. They do not know or care what Next.js is.

**Purpose:** Make a business owner feel seen. Describe their operational pain so accurately that they think "this person understands my business." The system or solution is mentioned only briefly at the end — it is not the point of the post.

**Tone:** Warm, direct, grounded. Like a conversation at a table. No technical language. No framework names. No code references whatsoever.

**Structure:**
1. Opening — a specific scene from a Nigerian business operation. Not a question. Not "have you ever wondered." A scene. A specific thing that happens in a specific type of business. One paragraph, three sentences maximum.
2. The problem unpacked — what this operational chaos is actually costing the business. Time, money, staff hours, customer trust. Use specific numbers where the Knowledge Document has them. Use `[ADD METRIC]` where it does not.
3. Why the manual approach keeps failing — not because the owner is lazy or incompetent, but because the tools available do not match the way Nigerian businesses actually operate. This section must feel empathetic, not condescending.
4. The shift — one paragraph describing what changes when the right system is in place. No technical details. What the owner's day looks like differently.
5. Closing — a single direct sentence that connects to demoladevop.com. Not a promotional line. A human statement.

**What this post is not:**
- A product announcement
- A feature list
- A tutorial
- A technical writeup

---

### Type 2 — The Build Post

**Audience:** Nigerian and African developers — people who write code, make technical decisions, and want to understand how a specific problem was solved and why those decisions were made.

**Purpose:** Share a real technical decision — what was chosen, what tradeoffs were made, what would be done differently. Developers trust honesty about constraints more than polished case studies.

**Tone:** Direct, technical, honest. First-person. Like a developer writing for other developers — not a tutorial, not a product pitch, but a real account of a decision made under real constraints.

**Structure:**
1. Opening — the specific technical problem or decision. One sentence. No preamble.
2. The context — what the system was doing, what constraint or business requirement led to this decision. Two paragraphs maximum.
3. What was tried or considered — alternatives that were evaluated, why they were rejected. Be honest about what looked attractive but did not work.
4. What was chosen and why — the actual decision with the specific reasoning. Include code snippets only if they directly illustrate the decision — do not include code for its own sake.
5. What it looks like in production — how the decision performed against the original constraint. Use specific outcomes where possible.
6. What would be done differently — one honest paragraph. Even if the decision was correct, what would be reconsidered with hindsight?
7. Closing — a single sentence that invites the reader to the full project on demoladevop.com or to continue the conversation.

**What this post is not:**
- A step-by-step tutorial for beginners
- A technology advertisement
- A LinkedIn brag post

---

### Type 3 — The Lesson Post

**Audience:** Both — business owners and developers can read this. It uses minimal technical language but is not afraid of concepts. It is the bridge between the two audiences.

**Purpose:** Share something that was learned from building for Nigerian businesses that is true in a way that both a developer and a business owner would recognise. These posts build Adedamola's authority as someone who understands both the code and the business deeply.

**Tone:** Reflective. Specific. Personal without being self-indulgent. The lesson must come from a real observation, not a manufactured insight.

**Structure:**
1. Opening — the specific observation or moment that produced the lesson. A scene or a realisation. Not a question. Not "I have been thinking about." A statement.
2. What the observation revealed — unpacking what was noticed and why it matters. Two paragraphs. Equal weight given to the business reality and the technical reality.
3. The lesson stated plainly — one clear sentence. Not a metaphor. Not a philosophical observation. A direct, specific takeaway.
4. How this changed the approach — one paragraph on what is done differently now as a result. Concrete. Not "I think more carefully about" but "I now always model X before building Y because Z."
5. Closing — a connection to the broader work at demoladevop.com without being promotional.

**What this post is not:**
- A motivational post
- A generic "lessons learned" listicle
- A humble brag about building something impressive

---

## Output Structure

For every post type, generate the following in order:

### 1. Brief

```
POST TYPE: [Problem Post / Build Post / Lesson Post]
TITLE: [One specific, direct title — no clickbait, no question marks]
AUDIENCE: [Business owner / Developer / Both]
CORE ARGUMENT: [One sentence — the single thing this post proves or shows]
OPENING HOOK: [The first sentence of the post — must make the reader stop]
KEY POINTS: [3-5 bullet points — the backbone of the post]
WORD COUNT TARGET: [800-1200 for Problem and Lesson posts, 1200-1800 for Build posts]
TAGS: [3-5 tags for the portfolio blog — pulled from the project's technology stack and business domain]
READING TIME: [Estimated at 200 words per minute]
```

---

### 2. First Draft

Write the complete first draft following the structure for the selected post type.

Apply every rule from the brand voice and anti-AI writing files. Every sentence must pass:
- The reading aloud test — if it sounds unnatural spoken out loud, rewrite it
- The competitor swap test — if it could belong to any other developer's post, rewrite it with more specificity
- The AI writing check — if it matches any pattern in the anti-AI writing file, rewrite it

Do not pad the draft. Do not add sections that are not in the structure. Do not summarise what you just said at the end. End the post with the closing sentence — nothing after it.

---

### 3. Image Brief

Generate a specific image brief telling Adedamola exactly what visual assets to capture for this post. Every image must serve the content — not decorate it.

**Format for each image:**

```
IMAGE [number]:
Purpose: [Why this image is in the post — what it shows that the text cannot]
What to capture: [Specific description of what to screenshot, photograph, or diagram]
Where it appears: [Cover image / Section X / End of post]
Caption: [The caption that appears under the image in the post]
```

**Rules for the image brief:**
- Cover image must be a screenshot of the most visually impressive part of the system — the dashboard, the automation flow, the results screen. Not a stock photo. Not an illustration. A real screenshot.
- In-post images should show the before state (WhatsApp chaos, spreadsheet, paper records) where possible — contrast is the most compelling visual
- Technical diagrams only in Build Posts — and only if the diagram explains something the text cannot
- Maximum 4 images per post — every image must earn its place
- For Problem Posts — at least one image should show the pain, not the solution
- Never recommend a stock photo or a generic header image

---

## Excerpt Generation

After the first draft, generate the `excerpt` field for the Prisma BlogPost model.

Rules:
- Maximum 160 characters
- Must summarise the core argument of the post in one sentence
- Must be written for the post's primary audience
- Must not start with "In this post" or "This article"
- Must not be a question
- Must contain at least one specific detail from the post — not a generic summary

---

## Readiness Check

Before presenting any output, verify every item. Mark PASS or FAIL. Fix every FAIL.

- [ ] Post type selected and structure followed exactly — PASS / FAIL
- [ ] Opening does not start with a question or "Have you ever" — PASS / FAIL
- [ ] No technical language in Problem Post or Lesson Post — PASS / FAIL
- [ ] No forbidden words anywhere in the draft — PASS / FAIL
- [ ] No AI writing patterns from the anti-AI writing file — PASS / FAIL
- [ ] Every specific claim has a number or a `[ADD METRIC]` placeholder — PASS / FAIL
- [ ] Post does not summarise itself at the end — PASS / FAIL
- [ ] Excerpt is under 160 characters and contains a specific detail — PASS / FAIL
- [ ] Image brief contains at least one image showing the before state — PASS / FAIL
- [ ] Competitor swap test passed on every paragraph — PASS / FAIL

---

*BLOG_POST_BRIEF_RULES.md — Version 2026.1 — demoladevop.com*
*Run this after PROJECT_BRIEF_RULES.md and KNOWLEDGE_RULES.md are complete for the project.*
*Cross-reference with brand-persona.md, ANTI_AI_WRITING.md, and DISTRIBUTION_RULES.md.*
