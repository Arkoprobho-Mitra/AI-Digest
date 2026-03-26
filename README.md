# AI & Data Science Daily Digest

An automated **Google Apps Script pipeline** that curates, summarises, and delivers a daily digest of the most important AI & Data Science news directly to your inbox — fully serverless, zero API keys, near-zero cost.

---

## How it works

The system runs twice daily on Google's servers via scheduled triggers. Each run:

1. Fetches articles from **29 RSS feeds** across 5 tiers (lab blogs, research, news, DS sites, community)
2. Scores every article locally using a **3-tier weighted keyword system** (W3/W2/W1) — no API call
3. Sends the top 40 to **Gemini 2.5 Flash-Lite** for smart deduplication and filtering → 15 best articles
4. Sends those 15 to **Gemini 2.5 Flash** for deep journalist-quality summarisation
5. Injects real URLs via index mapping (never trusts the model for URLs)
6. Delivers a styled HTML email via GmailApp — no SMTP setup needed

---

## Architecture

```
29 RSS feeds (tiered by source quality)
        ↓
fetchRSSArticles()
  · XML sanitisation (BOM strip, control char removal, HTML page detection)
  · Date-window filter (only articles newer than last run)
  · Keyword relevance pre-filter
        ↓
scoreArticle()  ← local, zero cost
  · W3 keywords (+3) — model releases, lab announcements, breakthroughs
  · W2 keywords (+2) — techniques, benchmarks, architecture, applications
  · W1 keywords (+1) — general AI/DS relevance baseline
  · Lab source bonus (+2) — nvidia, openai, anthropic, google, meta, etc.
  · ArXiv bonus (+1)
        ↓
Top 40 by score
        ↓
filterWithFlashLite()  ← Gemini 2.5 Flash-Lite · ~$0.0003/run
  · Deduplication (same story from multiple sources)
  · Off-topic removal
  · Returns 15 best article indices via FILTER_SCHEMA
        ↓
summariseWithFlash()  ← Gemini 2.5 Flash · ~$0.0033/run
  · Picks top 15 articles, identifies up to 5 major breakthroughs
  · Writes sharp summaries with model names, benchmarks, key claims
  · Returns index references (not URLs) via DIGEST_SCHEMA
        ↓
URL injection (pure JS, index-based — 100% reliable)
        ↓
buildEmailHTML()
        ↓
GmailApp.sendEmail()  ← 6 AM Morning Edition · 4 PM Evening Edition
```

---

## Feed sources (29 total)

| Tier | Sources |
|---|---|
| **Tier 1** — Major AI news | TechCrunch AI, VentureBeat AI, The Verge AI, MIT Tech Review, Ars Technica, Wired AI |
| **Tier 2** — Lab & company blogs | NVIDIA (×3), OpenAI, Anthropic, Google AI, Meta AI, Microsoft AI, AWS ML, HuggingFace |
| **Tier 3** — Research & papers | ArXiv cs.AI, cs.LG, cs.CL, cs.CV, HuggingFace Daily Papers |
| **Tier 4** — Data science | KDnuggets, Towards Data Science, MarkTechPost, InfoQ AI, IEEE Spectrum AI |
| **Tier 5** — Community | Hacker News (100+ pts), BBC Technology, SiliconAngle AI, AI News |

---

## Keyword scoring system

Articles are scored before any API call is made, keeping costs minimal.

**Weight 3 (+3 per hit)** — release action verbs, all major lab names, specific model families, breakthrough language (`sota`, `surpasses`, `human-level`, `world first`, etc.)

**Weight 2 (+2 per hit)** — model architectures, training techniques (LoRA, RLHF, MoE), benchmarks (MMLU, HumanEval, SWE-Bench), hardware (H100, B200, Blackwell), applications (robotics, autonomous driving, drug discovery), AI safety and policy

**Weight 1 (+1 per hit)** — general AI/ML/DS relevance, frameworks (PyTorch, TensorFlow, JAX), funding and partnership news

This ensures model releases like NVIDIA Nemotron bubble to the top (multiple W3 hits) while tutorials and listicles stay at the bottom.

---

## Models used

| Stage | Model | Cost | Task |
|---|---|---|---|
| Filter | `gemini-2.5-flash-lite` | $0.10/M input tokens | Deduplicate and select best 15 articles from top 40 |
| Summarise | `gemini-2.5-flash` | $0.30/M input tokens | Rank, identify breakthroughs, write summaries |

Both models use `responseSchema` enforcement via Vertex AI's structured output API — this eliminates JSON parse errors at the model level rather than patching them after the fact.

Authentication uses `ScriptApp.getOAuthToken()` — Google Apps Script mints a short-lived OAuth token automatically. No API key storage or credential management required.

---

## Cost

| Period | Cost |
|---|---|
| Per run | ~$0.0036 |
| Per day (2 runs) | ~$0.007 |
| Per month | ~$0.21 |
| Per year | ~$2.60 |

New Google Cloud accounts receive **$300 in free credits** — enough for years of operation at this usage level. After credits are exhausted, ongoing cost is ~$0.21/month billed to GCP.

---

## Setup (5 minutes)

**Prerequisites:** A Google account with Google Cloud access.

### 1. Create the Apps Script project

Go to [script.google.com](https://script.google.com) → New project → delete the default code → paste `Code.gs` → save.

### 2. Enable Vertex AI

In [GCP Console](https://console.cloud.google.com):
- APIs & Services → Enable **Vertex AI API**
- No model garden setup needed — Gemini models are available by default

### 3. Link GCP project to Apps Script

In Apps Script → ⚙ Project Settings → Google Cloud Platform → paste your GCP Project Number.

### 4. Set Script Properties

In Apps Script → ⚙ Project Settings → Script Properties → Add:

```
GCP_PROJECT_ID  =  your-gcp-project-id
VERTEX_REGION   =  us-central1
```

### 5. Set up triggers

In the Apps Script function dropdown, select `setupTrigger` → ▶ Run → grant permissions when prompted.

This creates two time-based triggers: **6 AM** and **4 PM** daily in your script's timezone.

### 6. Verify

Select `testRun` → ▶ Run. The digest should arrive in your inbox within ~60 seconds.

---

## Functions reference

| Function | Description |
|---|---|
| `sendDailyDigest()` | Main entry point — runs the full pipeline |
| `fetchRSSArticles(lastRunMs)` | Fetches and locally filters articles newer than `lastRunMs` |
| `scoreArticle(article)` | Applies weighted keyword scoring to a single article |
| `filterWithFlashLite(articles, ...)` | Stage 1 — Flash-Lite deduplication and selection |
| `summariseWithFlash(articles, ...)` | Stage 2 — Flash summarisation and ranking |
| `callGemini(model, prompt, ...)` | Shared Vertex AI API caller with schema enforcement |
| `extractJSON(raw)` | Robust JSON extractor with multi-pass sanitisation |
| `buildEmailHTML(digest, edition)` | Renders the HTML email |
| `setupTrigger()` | Creates 6 AM + 4 PM daily triggers, removes old ones |
| `testRun()` | Alias for `sendDailyDigest()` for manual testing |
| `resetTo24Hours()` | Sets `LAST_RUN_TIME` to 24h ago for testing a full day's articles |

---

## Key design decisions

**Index-based URL injection** — Flash is never asked to return URLs. Each article is given an index number; Flash returns that index alongside its summary; the real URL is looked up from the original array in pure JavaScript. This eliminates the most common failure mode (models dropping or hallucinating URLs).

**responseSchema enforcement** — Both Gemini calls pass a strict JSON schema to Vertex AI's `responseSchema` field. The model's token sampler is constrained at generation time, making malformed JSON structurally impossible regardless of special characters in article content.

**Two-stage pipeline** — Flash-Lite handles the cheap classification task (which 15 of 40 articles to keep). Flash handles the expensive generative task (summaries). This gives better quality than using one model for everything and costs ~10× less than using Flash for both stages.

**Date-window filtering** — `LAST_RUN_TIME` is stored in Script Properties after each successful run. The next run only fetches articles published after that timestamp, preventing duplicates across morning and evening editions.

**XML sanitisation** — Every RSS feed response is sanitised before XML parsing: UTF-8/UTF-16 BOM stripping, pre-root content removal, HTML error page detection, and control character removal. This prevents SAXParseException errors from malformed feeds from blocking the other 28.

---

## Fault tolerance

- Per-feed try/catch — one broken feed never blocks the others
- Flash-Lite fallback — if Flash-Lite fails or returns too few results, falls back to top-N by local score
- Two-attempt retry with exponential backoff on Flash (15s, 30s between attempts)
- Rate limit detection — 429 errors trigger the retry path automatically
- Empty window guard — if no new articles are found, skips the API calls and email entirely

---

## Extending the project

**Add more feeds** — append RSS URLs to the `RSS_FEEDS` array. AI-specific feeds skip the keyword filter automatically if added to `AI_ONLY_SOURCES`.

**Adjust scoring** — add terms to `KEYWORDS_W3`, `KEYWORDS_W2`, or `KEYWORDS_W1` in `Code.gs`. W3 terms for new model families (e.g. a new lab's name) ensure their releases surface immediately.

**Change schedule** — edit the `atHour()` values in `setupTrigger()` and re-run it. It clears existing triggers before creating new ones.

**Add recipients** — modify the `GmailApp.sendEmail()` call in `sendDailyDigest()` to add CC addresses or fetch a recipient list from a Google Sheet.

---

## License

MIT

---

## Acknowledgements

- [Google Apps Script](https://developers.google.com/apps-script) — serverless execution and Gmail integration
- [Google Vertex AI](https://cloud.google.com/vertex-ai) — Gemini model hosting with schema-enforced structured output
- [HuggingFace Daily Papers RSS](https://papers.takara.ai/api/feed) — community-maintained feed for research papers
- Open RSS ecosystem — all 29 feeds are free and publicly available
