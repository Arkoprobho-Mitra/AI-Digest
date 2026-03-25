# AI-Digest
A CRON job system which sends daily personal mail to users on latest AI topics using Rag and text sumerisation using API calls


<img width="644" height="650" alt="image" src="https://github.com/user-attachments/assets/00fd6c77-e991-406a-9f7f-cdf13d996113" />

---

# 🚀 AI & Data Science Daily Digest

An automated **Google Apps Script-based cron job** that curates, summarizes, and delivers a daily digest of the most important AI & Data Science updates directly to your email.

> ✅ Fully serverless
> ✅ Uses Google Vertex AI (Gemini 2.5 Pro)
> ✅ No API keys required (OAuth-based)
> ✅ Runs automatically via scheduled triggers

---

## 📌 Overview

This project implements a **twice-daily automated news intelligence pipeline** that:

1. Fetches the latest AI-related articles from multiple RSS feeds
2. Filters and deduplicates relevant content
3. Uses **Gemini 2.5 Pro (Vertex AI)** to generate structured summaries
4. Sends a beautifully formatted HTML email digest

The system is optimized for **low cost, high reliability, and zero manual intervention**.

---

## ⚙️ Key Features

### 📰 Intelligent Content Aggregation

* Pulls data from multiple sources:

  * TechCrunch AI
  * VentureBeat AI
  * The Verge AI
  * MIT Tech Review
  * arXiv (AI & ML)
  * Hacker News
  * BBC Tech

* Filters content using AI/ML-specific keywords

---

### 🧠 LLM-Powered Summarization

* Uses **Gemini 2.5 Pro via Vertex AI**
* Two-stage structured generation:

  * ⚡ **Major Breakthroughs (max 5)**
  * 📊 **Top 10 Articles**
* Outputs clean JSON using schema-controlled responses

---

### 📧 Automated Email Delivery

* Sends a **styled HTML digest** via Gmail
* Includes:

  * Headlines
  * Summaries
  * Source attribution
  * Direct article links
* Editions:

  * 🌅 Morning Edition
  * 🌇 Evening Edition

---

### ⏱️ Cron Scheduling

* Runs automatically at:

  * **7:00 AM**
  * **5:00 PM**
* Uses Google Apps Script triggers

---

### 🔁 Incremental Updates

* Tracks last execution time
* Only fetches **new articles since last run**
* Prevents duplicate processing

---

## 🏗️ Architecture

```
RSS Feeds
   ↓
Fetch & Filter Layer
   ↓
Deduplication + Keyword Matching
   ↓
Vertex AI (Gemini 2.5 Pro)
   ├── Breakthrough Extraction
   └── Top Articles Ranking
   ↓
Structured JSON Output
   ↓
HTML Email Generator
   ↓
Gmail Delivery
```

---

## 🛠️ Setup Guide (5 Minutes)

### 1. Create Script

* Go to: [https://script.google.com](https://script.google.com)
* Create a new project
* Paste the script

---

### 2. Link GCP Project

* Open **Project Settings ⚙**
* Attach your **Google Cloud Project**

---

### 3. Enable API

* In GCP Console:

  * Enable **Vertex AI API**

---

### 4. Configure Environment Variables

Add in **Script Properties**:

```
GCP_PROJECT_ID = your-project-id
VERTEX_REGION  = us-east5
```

---

### 5. Initialize Cron Job

Run once:

```javascript
setupTrigger()
```

This creates scheduled executions at 7 AM and 5 PM.

---

### 6. Test Run

```javascript
testRun()
```

---

## 🔐 Authentication

* Uses:

  ```
  ScriptApp.getOAuthToken()
  ```
* No API keys required
* Fully handled via Google OAuth

---

## 💰 Cost Efficiency

* Runs on **Google Cloud free tier**
* Uses **Vertex AI credits ($300 free)**
* Estimated cost:
  → Near zero for personal usage
  → Can last **years** under normal load

---

## 📦 Core Components

| Function                | Description             |
| ----------------------- | ----------------------- |
| `sendDailyDigest()`     | Main pipeline execution |
| `fetchRSSArticles()`    | Fetch + filter articles |
| `summariseWithVertex()` | LLM summarization       |
| `setupTrigger()`        | Cron scheduling         |
| `testRun()`             | Manual execution        |
| `buildEmailHTML()`      | Email rendering         |

---

## 🧩 Design Highlights

### ✅ Idempotent Execution

* Avoids duplicate articles using:

  * Title hashing
  * Timestamp filtering

### ✅ Fault Tolerance

* Handles:

  * Feed failures
  * API errors
  * Empty datasets

### ✅ Scalable Architecture

* Easily extendable to:

  * More RSS feeds
  * Additional LLM tasks
  * Slack/Discord integrations

---

## 🚀 Future Improvements

* 🔔 Multi-user subscriptions
* 🌍 Personalized topic filtering
* 📊 Trend analytics dashboard
* 🧵 Threaded summaries (Twitter/LinkedIn ready)
* ⚡ Switch to Gemini Flash for lower latency

---

## 📄 License

MIT License (or your preferred license)

---

## 🙌 Acknowledgements

* Google Apps Script
* Google Vertex AI
* Gemini Models
* Open RSS ecosystem

---

