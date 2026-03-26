# AI_DIGEST.md
*A full retrospective on building the AI & Data Science Daily Digest*

---

## 1. Approach & Reasoning

The core idea was deceptively simple: fetch AI news, summarise it, email it. But the real engineering challenge was making it **free, autonomous, and robust** — three things that usually trade off against each other.

Think of it like building a self-watering plant system. You could check on your plant every morning (keep a browser tab open), or you could build irrigation (Google Apps Script triggers on Google's servers). The irrigation takes 5 minutes to set up but then runs forever without you. That's the philosophy behind the whole architecture.

The key insight that shaped every decision: **Google Apps Script already has OAuth access to both Gmail and Vertex AI through the same Google account**. `ScriptApp.getOAuthToken()` is essentially a skeleton key — it means we never needed an Anthropic API key, never needed credentials management, and the entire thing runs inside Google's infrastructure for free.

---

## 2. Rejected Alternatives

**Claude API directly** — The original design used Claude Sonnet via the Anthropic API with a `sk-ant-...` key stored in Script Properties. Rejected because: (a) requires paid credits with no truly free tier, (b) adds a credential to manage, (c) Vertex AI gives the same models cheaper through GCP free credits.

**Single-model pipeline** — Early versions sent all 80–120 fetched articles directly to one model. Rejected because it hit token limits, degraded output quality ("lost in the middle" problem), and cost more. The two-stage approach (cheap model filters, smart model summarises) was the right decomposition.

**Gemini 2.5 Pro for everything** — The uploaded code used Pro. Rejected because it costs 10–15× more than Flash for the same task. Summarising 15 articles doesn't require frontier reasoning — it requires reliable structured output, which Flash handles fine.

**Browser-based scheduler** — The first version used a React artifact with a JavaScript `setInterval` firing at 7 AM. Rejected because it required keeping a browser tab open. GAS triggers run on Google's servers — the tab can be closed, the laptop can be off.

**Asking the model to return URLs** — Several iterations tried to get Flash to carry URLs through in its JSON output. Every time, Flash either dropped them, hallucinated them, or returned them inconsistently. The correct solution was to never ask Flash for URLs at all — give each article an `INDEX`, ask Flash to return the index, then inject the real URL from the original array in pure JavaScript after the response. This is the most important architectural lesson of the whole project.

---

## 3. How the Parts Connect

```
29 RSS feeds
    ↓ fetchRSSArticles() — XML parsing + BOM sanitisation + keyword filter
Raw articles (variable, ~50–120)
    ↓ scoreArticle() — local weighted scoring, zero API cost
Scored & sorted articles
    ↓ top 40 → filterWithFlashLite() — Gemini Flash-Lite + FILTER_SCHEMA
15 best articles (deduplicated, on-topic)
    ↓ summariseWithFlash() — Gemini Flash + DIGEST_SCHEMA
Digest object {date, breakthroughs, top_articles}
    ↓ URL injection via index map
Digest with real URLs attached
    ↓ buildEmailHTML()
HTML email string
    ↓ GmailApp.sendEmail()
Your inbox at 6 AM and 4 PM
```

The `LAST_RUN_TIME` property stored in Script Properties is the thread connecting runs — each run only fetches articles newer than the previous run's timestamp, so the morning and evening editions don't overlap.

The `responseSchema` passed to Vertex AI is what guarantees the JSON structure. Without it, Gemini writes free-form text that happens to look like JSON but contains apostrophes, em-dashes, and newlines in string values that break `JSON.parse()`. With it, the model's token sampler is constrained to only emit tokens that maintain schema validity — it's enforced at the model level, not patched after the fact.

---

## 4. Tools Used & Why

**Google Apps Script** — The glue. Free, runs on Google's servers, has native GmailApp and ScriptApp.getOAuthToken(), perfect for scheduled automation without infrastructure.

**Vertex AI (Gemini)** — Chosen over direct Anthropic/OpenAI APIs because it's billed to GCP where you have $300 free credits, and auth is handled automatically by Google OAuth — no API key storage needed.

**gemini-2.5-flash-lite** — Stage 1 filter. Cheapest capable model ($0.10/M tokens). The task (pick 15 from 40, return indices) is classification, not reasoning — Flash-Lite is the right tool.

**gemini-2.5-flash** — Stage 2 summariser. Balanced cost/quality ($0.30/M tokens). Can write sharp journalistic summaries reliably with schema enforcement.

**RSS feeds** — Chosen over news APIs (NewsAPI, Bing News) because they're completely free, don't require API keys, and are pull-based (you control the cadence). The 29-feed architecture across 5 tiers ensures redundancy — if 3 feeds are down, 26 others still run.

**responseSchema (Vertex AI)** — The decisive fix for JSON parse errors. Instead of trying to sanitise and repair broken JSON after the fact, we prevent invalid JSON from being generated in the first place by constraining the model's output space.

---

## 5. Tradeoffs

**29 feeds vs fewer feeds** — More feeds = better recall (Nemotron gets caught) but more XML parsing time and more articles to filter. Mitigated by the two-stage pipeline: fetch broadly, filter cheaply, summarise precisely.

**LAST_RUN_TIME window** — Makes editions non-overlapping but means if a trigger fires late (GAS triggers have a ±15 minute window), some articles near the boundary might be missed or duplicated. Acceptable tradeoff for the simplicity it provides.

**Flash over Pro** — Flash occasionally produces slightly less nuanced summaries than Pro. But at 40× cheaper and with schema enforcement ensuring structure, the quality difference is not noticeable for a daily digest use case.

**Index-based URL injection** — Fully reliable but means the article titles in the email might differ slightly from the original titles (Flash rewrites them). The URL still points to the right article. Considered exact title matching but it was fragile — Flash rephrases titles even when asked not to.

**GAS execution time limit** — Apps Script has a 6-minute execution limit. The two API calls + 29 feed fetches typically complete in 60–90 seconds. Well within limits, but a risk if many feeds are slow. Mitigated by `muteHttpExceptions: true` and per-feed try/catch so slow feeds don't block others.

---

## 6. Mistakes & Fixes

**Mistake: Inline JSON template in prompt**
```js
'{"date":"' + today + '",...}'  // ← WRONG
```
Putting the date variable inside a JSON template string in the prompt caused Flash to produce JSON where the date field had inconsistent quoting. Fix: describe the schema in plain English, let Flash write the JSON.

**Mistake: Asking Flash to carry URLs through**
Flash consistently dropped or hallucinated URLs. Three separate attempts to fix this with prompt engineering all failed. The real fix was architectural — remove URLs from the prompt entirely, use index-based injection after the response.

**Mistake: `err2` declared inside try/catch block**
```js
try { return JSON.parse(fixed); } catch (err2) {}
throw new Error('...' + err2.message); // ← err2 out of scope here
```
Classic JavaScript scoping bug. Fix: declare `var lastErr` outside the try block.

**Mistake: `responseSchema` passed via a shared map keyed by model name**
The `schemas[model]` lookup worked locally but broke when the variable name `schemas` shadowed the parameter name in `callGemini`. Fix: pass schema as an explicit parameter to each call site.

**Mistake: SAXParseException on feeds**
Three feeds (analyticsindiamag, unite.ai) returned malformed XML — BOM characters, HTML error pages, pre-root content. Fix: aggressive pre-parse sanitisation (strip BOM, strip pre-`<` content, detect HTML pages, strip control characters) before `XmlService.parse()`.

**Mistake: `columnNumber: 3` vs `columnNumber: 1`**
These look similar but are different bugs. Column 3 = UTF-8 BOM (3 bytes). Column 1 = content before the XML declaration. Both fixed by the sanitiser, but they required separate understanding.

---

## 7. Future Pitfalls

**GAS 6-minute execution limit** — If you add more feeds or the API calls get slower, you'll hit this. Solution: move the RSS fetch to a separate function with its own trigger, store results in Script Properties or a Google Sheet, and have the summarise function read from there.

**Vertex AI quota limits** — The 429 errors you hit during testing were from the free tier's per-minute quota. Normal 2×/day operation is fine. If you start testing frequently, you'll burn through the quota faster. The exponential backoff + Flash-Lite fallback handles this gracefully.

**Feed URL changes** — RSS feed URLs change without notice. VentureBeat, TechCrunch, and ArXiv have changed their feed paths before. If a feed silently starts returning 404s, it'll just be skipped (the 200-check handles this). But you won't know. Solution: add a weekly health-check function that logs which feeds returned non-200.

**`LAST_RUN_TIME` drift** — If a trigger fails (GAS trigger errors don't notify you by default), the next run will pick up a large backlog going back to the last successful run. With 29 feeds × 8 items × many hours, you could hit the 40-article cap and miss recent news. Solution: cap `lastRunMs` to at most 12 hours ago regardless of stored value.

**Gemini model deprecations** — Gemini 2.5 Flash-Lite has a listed retirement date of July 22, 2026. You'll get errors after that date. Solution: watch for GCP emails about model deprecations and update the model strings in `callGemini`.

**responseSchema field name sensitivity** — Vertex AI's schema enforcement is case-sensitive and strict. If you rename a field in the schema but forget to update the prompt (or vice versa), you'll get empty arrays or missing fields silently. Always update schema + prompt + URL injection code as a unit.

---

## 8. Expert vs Beginner Perspective

A **beginner** looking at this project would see: fetch RSS, call AI, send email. Three steps.

An **expert** sees: a pipeline with 6 failure modes, 3 layers of data sanitisation, 2 levels of JSON validation, a cost optimisation architecture, a stateful timestamp system, and 29 sources chosen specifically for their XML reliability and coverage overlap.

The biggest gap between beginner and expert thinking here is around **trust boundaries**:
- Beginner: "The model will return what I ask for"
- Expert: "The model will return something that superficially resembles what I asked for, and I need to validate, inject, and sanitise everything it produces before using it"

The URL injection via index is the clearest example of expert thinking. A beginner asks "can the model return the URL?" — yes it can, sometimes. An expert asks "can I trust the model to always return the correct URL?" — no, so bypass the model for that field entirely.

Another expert instinct: **separate what the model is good at from what it's bad at**. Models are good at: summarisation, ranking, deduplication decisions. Models are bad at: remembering exact URLs, counting precisely, consistent field naming. The architecture respects these boundaries — Flash handles the editorial judgement, JavaScript handles the data fidelity.

---

## 9. Transferable Lessons

**1. Never ask an LLM to carry data through — inject it yourself**
If you have ground-truth data (URLs, IDs, timestamps), don't pass it to the model and ask it to return it. The model will corrupt it. Pass an index, get the index back, look up the real data yourself. This pattern applies to any pipeline where LLMs process structured data.

**2. Schema enforcement beats prompt engineering for structure**
Spending hours perfecting a prompt to make a model output valid JSON is the wrong approach. One `responseSchema` field in the API call solves it permanently at the model level. Always use structured output features when the API offers them.

**3. Two-stage pipelines beat one big call**
Cheap model for filtering/routing + smart model for generation is almost always better than one expensive model doing everything. It's cheaper, faster, and produces better output because each model gets a focused task it's good at.

**4. Build for the failure case, not the happy path**
Every `try/catch`, every fallback to top-N-by-score, every retry with backoff — these felt like over-engineering at the time. They turned out to be essential. Production systems fail in boring, predictable ways. Build for the boring failures.

**5. Free tiers have hidden shapes**
"Free" on GCP means $300 for 90 days, then pay-as-you-go. "Free" on GAS means 6 minutes per execution, 20 URL fetch calls per execution, 100 emails per day. Know the shape of your free tier before designing around it.

**6. Sanitise at the source, not at the sink**
We learned this the hard way — sanitising article text only before sending to the model (the sink) still left corrupted data in the articles array. Sanitising at collection time (the source, in `fetchRSSArticles`) means every downstream function gets clean data automatically.

**7. Consistent error messages are debugging superpowers**
The pattern `Logger.log('Feed error (' + feedUrl + '): ' + e.message)` — always including the feed URL in the error — made every XML debugging session 10× faster. When you have 29 feeds, you need to know which one failed.

---

*Built iteratively over many conversations. Every bug was a lesson. Every fix made the system more robust. The final result is a genuinely useful, genuinely free, genuinely autonomous tool.*
