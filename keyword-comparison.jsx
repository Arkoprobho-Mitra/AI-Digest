import { useState, useMemo } from "react";

const G = "#00c882", BG = "#080808", CARD = "#0e0e0e", BORDER = "#1c1c1c", DIM = "#333", MID = "#555", LIGHT = "#d0d0d0";

// ── Latest keyword arrays — exact mirror of Code.gs ────────────
const W3 = [
  'releases','released','launches','launched','announces','announced',
  'introducing','unveils','unveiling','debuts','debuted',
  'new model','model release','open source model','open-source model',
  'weights released','model weights','now available','generally available',
  'ga release','preview release','public preview','early access',
  'nvidia','nemotron','nemo','megatron','nvidia ai','nvidia research',
  'openai','gpt-5','gpt-4o','o3','o4','sora','dall-e',
  'anthropic','claude 4','claude sonnet','claude opus','claude haiku',
  'google deepmind','deepmind','gemini 2','gemini ultra','veo','imagen',
  'meta llama','llama 4','llama3','llama-3','meta ai',
  'mistral','mixtral','mistral large','mistral small',
  'xai','grok-3','grok 3','grok-4',
  'cohere','command r','command a',
  'deepseek','deepseek r2','deepseek v3','deepseek r3',
  'qwen','qwen3','qwen2.5','alibaba ai',
  'apple intelligence','apple ai','apple foundation model',
  'amazon nova','amazon titan','bedrock model',
  'inflection','pi ai',
  'perplexity','sonar model',
  'zhipu','chatglm','baidu','ernie',
  'samsung ai','qualcomm ai','intel ai',
  'breakthrough','state of the art','state-of-the-art','sota',
  'outperforms','surpasses','beats gpt','beats claude','beats gemini',
  'new record','best performance','human-level','superhuman',
  'first model to','world first','industry first',
  'arxiv paper','research paper','new paper','new study',
];

const W2 = [
  'llm','large language model','foundation model','language model',
  'multimodal','vision language','text-to-image','text-to-video',
  'diffusion model','generative model','reasoning model','frontier model',
  'fine-tuning','fine-tun','rlhf','dpo','instruction tuning','rlaif',
  'prompt engineering','chain of thought','in-context learning',
  'few-shot','zero-shot','retrieval augmented','rag',
  'transformer','attention mechanism','mixture of experts','moe',
  'sparse model','dense model','context window','long context',
  'vector database','embedding model','token','tokenizer',
  'quantization','quantisation','pruning','distillation',
  'lora','qlora','peft','adapter','model merging',
  'ai agent','agentic','autonomous agent','multi-agent','ai workflow',
  'code generation','coding model','copilot','code llm',
  'image generation','video generation','audio generation','music generation',
  'speech recognition','text to speech','tts','voice model',
  'computer vision','object detection','image segmentation',
  'robotics','embodied ai','robot learning','humanoid',
  'drug discovery','protein folding','alphafold','scientific ai',
  'autonomous driving','self-driving','waymo','tesla ai',
  'gpu','tpu','h100','h200','b200','gb200','blackwell','hopper',
  'inference','inference optimization','model serving','vllm','tensorrt',
  'mlops','model deployment','model monitoring',
  'ai chip','ai accelerator','npu','neural processing unit',
  'benchmark','mmlu','humaneval','hellaswag','gsm8k',
  'lmsys','chatbot arena','bigbench','arc challenge','swe-bench',
  'aime','gpqa','mmmu',
  'ai safety','alignment','guardrail','red teaming','jailbreak',
  'hallucination','bias','fairness','responsible ai','constitutional ai',
  'ai regulation','eu ai act','ai policy','ai governance',
];

const W1 = [
  'artificial intelligence','machine learning','deep learning',
  'neural network','data science','ai','ml',
  'chatbot','virtual assistant','nlp','natural language processing',
  'computer vision','reinforcement learning','generative ai',
  'pytorch','tensorflow','jax','keras','huggingface','hugging face',
  'stability ai','midjourney','runway',
  'parameter','dataset','training data','synthetic data','pretraining',
  'overfitting','regularization','gradient','backpropagation',
  'classification','regression','clustering','generative',
  'api','sdk','open source','open-source','open weights',
  'research','paper','study','experiment','evaluation',
  'accuracy','precision','recall','f1 score','perplexity',
  'startup','funding','investment','valuation',
  'partnership','collaboration','acquisition',
];

const LAB_SOURCES = ['nvidia','openai','anthropic','google','meta','microsoft','huggingface','deepmind','amazon'];

const SAMPLES = [
  { t: "NVIDIA Announces Nemotron 3 Super — Open-Source Reasoning Model Released", src: "developer.nvidia.com" },
  { t: "Meta Launches Llama 4 with 1M Context Window and Multimodal Capabilities", src: "ai.meta.com" },
  { t: "DeepSeek R3 Surpasses GPT-4o on MMLU Benchmark, Weights Released", src: "marktechpost.com" },
  { t: "OpenAI Introduces O4 Mini — State of the Art on HumanEval Coding", src: "openai.com" },
  { t: "Google DeepMind Unveils Gemini 2 Ultra with Mixture of Experts Architecture", src: "deepmind.com" },
  { t: "Cohere Releases Open-Source Voice Model for Transcription — 2B Parameters", src: "techcrunch.com" },
  { t: "New Paper: Chain-of-Thought Prompting Elicits Reasoning in Large Language Models", src: "arxiv.org" },
  { t: "Apple Intelligence Gets Major Update with New On-Device Foundation Model", src: "theverge.com" },
  { t: "EU AI Act Enforcement Begins — What Companies Need to Know About Compliance", src: "wired.com" },
  { t: "5 Ways to Improve Your Machine Learning Pipeline in 2026", src: "towardsdatascience.com" },
  { t: "Understanding Transformer Architecture — A Beginner's Guide", src: "kdnuggets.com" },
  { t: "Tech Giants Report Strong Q1 Earnings Driven by AI Infrastructure Spending", src: "bbc.co.uk" },
];

// ── Scoring functions ───────────────────────────────────────────
function scoreText(text, source = "") {
  const t = (text + " " + source).toLowerCase();
  let score = 0;
  const hits = [];
  W3.forEach(k => { if (t.includes(k)) { score += 3; hits.push({ k, w: 3 }); } });
  W2.forEach(k => { if (t.includes(k)) { score += 2; hits.push({ k, w: 2 }); } });
  W1.forEach(k => { if (t.includes(k)) { score += 1; hits.push({ k, w: 1 }); } });
  const src = source.toLowerCase();
  if (LAB_SOURCES.some(l => src.includes(l))) score += 2;
  return { score, hits };
}

function priorityLabel(s) {
  if (s >= 20) return { label: "Top priority", color: "#fbbf24" };
  if (s >= 12) return { label: "High priority", color: G };
  if (s >= 6)  return { label: "Medium priority", color: "#60a5fa" };
  if (s >= 2)  return { label: "Low priority", color: MID };
  return { label: "Likely filtered", color: "#f87171" };
}

// ── Sub-components ──────────────────────────────────────────────
function Mono({ children, style = {} }) {
  return <span style={{ fontFamily: "'IBM Plex Mono', monospace", ...style }}>{children}</span>;
}

function ScoreBar({ value, max, color }) {
  return (
    <div style={{ flex: 1, height: 5, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: Math.min(100, (value / max) * 100) + "%", height: "100%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
    </div>
  );
}

// ── Tab: Tier breakdown ─────────────────────────────────────────
function TiersTab() {
  const [open, setOpen] = useState(null);

  const tiers = [
    {
      id: "W3", weight: "×3", label: "Model releases · Lab announcements · Breakthroughs",
      color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)",
      note: "Highest signal. A single hit adds +3. These are the terms that catch Nemotron, new GPT drops, SOTA claims, and release action verbs like 'released' or 'unveiled'.",
      kws: W3,
    },
    {
      id: "W2", weight: "×2", label: "Techniques · Architecture · Benchmarks · Applications",
      color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.25)",
      note: "Important but not release-level. Adds scoring depth for technically rich articles without inflating general pieces.",
      kws: W2,
    },
    {
      id: "W1", weight: "×1", label: "General AI/DS relevance baseline",
      color: G, bg: "rgba(0,200,130,0.06)", border: "rgba(0,200,130,0.2)",
      note: "Baseline filter. An article with only W1 hits will rank low — it's relevant but not newsworthy enough to surface.",
      kws: W1,
    },
  ];

  return (
    <div>
      {tiers.map((tier, i) => (
        <div key={tier.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{ width: "100%", background: "none", border: "none", padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
          >
            <div style={{
              width: 48, height: 32, borderRadius: 6, flexShrink: 0,
              background: tier.bg, border: `1px solid ${tier.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Mono style={{ fontSize: 12, fontWeight: 700, color: tier.color }}>{tier.weight}</Mono>
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 2 }}>{tier.id} — {tier.label}</div>
              <Mono style={{ fontSize: 10, color: MID }}>{tier.kws.length} keywords</Mono>
            </div>
            <Mono style={{ fontSize: 11, color: DIM }}>{open === i ? "[ − ]" : "[ + ]"}</Mono>
          </button>

          {open === i && (
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: "16px 24px 20px" }}>
              <Mono style={{ fontSize: 10, color: MID, display: "block", lineHeight: 1.9, marginBottom: 16 }}>{tier.note}</Mono>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tier.kws.map(k => (
                  <span key={k} style={{ background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: 4, padding: "3px 9px" }}>
                    <Mono style={{ fontSize: 10, color: tier.color }}>{k}</Mono>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 24px", marginTop: 4 }}>
        <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 12 }}>// source bonuses (applied by scoreArticle)</Mono>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {LAB_SOURCES.map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,200,130,0.06)", border: "1px solid rgba(0,200,130,0.2)", borderRadius: 6, padding: "4px 12px" }}>
              <Mono style={{ fontSize: 11, color: G }}>{s}</Mono>
              <Mono style={{ fontSize: 10, color: MID }}>+2</Mono>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 6, padding: "4px 12px" }}>
            <Mono style={{ fontSize: 11, color: "#60a5fa" }}>arxiv</Mono>
            <Mono style={{ fontSize: 10, color: MID }}>+1</Mono>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Sample scores ──────────────────────────────────────────
function SamplesTab() {
  const scored = useMemo(() =>
    SAMPLES.map(s => ({ ...s, ...scoreText(s.t, s.src) })).sort((a, b) => b.score - a.score)
  , []);
  const maxScore = Math.max(...scored.map(s => s.score), 1);

  return (
    <div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 100px", padding: "12px 20px", background: "#0a0a0a", borderBottom: `1px solid ${BORDER}` }}>
          <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase" }}>Headline + source</Mono>
          <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", textAlign: "right" }}>Score</Mono>
          <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", textAlign: "center" }}>Bar</Mono>
        </div>
        {scored.map((s, i) => {
          const { label, color } = priorityLabel(s.score);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 52px 100px", padding: "13px 20px", borderBottom: i < scored.length - 1 ? `1px solid ${BORDER}` : "none", alignItems: "center" }}>
              <div style={{ paddingRight: 16 }}>
                <div style={{ fontSize: 12, color: LIGHT, lineHeight: 1.5, marginBottom: 3 }}>{s.t}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mono style={{ fontSize: 10, color: MID }}>{s.src}</Mono>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 3, padding: "1px 6px" }}>{label}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, fontWeight: 700, color }}>{s.score}</div>
              <div style={{ paddingLeft: 14, display: "flex", alignItems: "center" }}>
                <ScoreBar value={s.score} max={maxScore} color={color} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, background: "rgba(0,200,130,0.04)", border: "1px solid rgba(0,200,130,0.15)", borderRadius: 10, padding: "14px 18px" }}>
        <Mono style={{ fontSize: 10, color: G, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>// what the scores mean in practice</Mono>
        <Mono style={{ fontSize: 11, color: MID, lineHeight: 2 }}>
          NVIDIA Nemotron scores high because nvidia(+3) + nemotron(+3) + announces(+3) + released(+3) + lab source bonus(+2) all fire together. A tutorial like "5 Ways to Improve Your ML Pipeline" only hits W1 keywords — low score, filtered by Flash-Lite before reaching Sonnet.
        </Mono>
      </div>
    </div>
  );
}

// ── Tab: Live scorer ────────────────────────────────────────────
function ScorerTab() {
  const [text, setText] = useState("");
  const [src, setSrc]   = useState("");

  const result = useMemo(() => text.trim() ? scoreText(text, src) : null, [text, src]);
  const { label, color } = result ? priorityLabel(result.score) : { label: "", color: MID };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Headline</Mono>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste any article headline here..."
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 8, padding: "12px 14px",
            color: LIGHT, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, lineHeight: 1.7,
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Source domain (optional — for lab bonus)</Mono>
        <input
          value={src}
          onChange={e => setSrc(e.target.value)}
          placeholder="e.g. developer.nvidia.com"
          style={{
            width: "100%", boxSizing: "border-box",
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 8, padding: "10px 14px",
            color: LIGHT, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12,
          }}
        />
      </div>

      {result && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 40, fontWeight: 700, color, lineHeight: 1 }}>{result.score}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: MID, marginTop: 4 }}>weighted score</div>
            </div>
            <div style={{ flex: 1, paddingLeft: 8 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 5, padding: "5px 12px", display: "inline-block", marginBottom: 10 }}>
                {label}
              </span>
              <div style={{ display: "flex", gap: 14 }}>
                {[
                  { w: 3, c: "#fbbf24", hits: result.hits.filter(h => h.w === 3) },
                  { w: 2, c: "#60a5fa", hits: result.hits.filter(h => h.w === 2) },
                  { w: 1, c: G,         hits: result.hits.filter(h => h.w === 1) },
                ].map(({ w, c, hits }) => (
                  <div key={w}>
                    <Mono style={{ fontSize: 18, fontWeight: 700, color: c }}>{hits.length}</Mono>
                    <Mono style={{ fontSize: 9, color: MID, display: "block" }}>W{w} hits</Mono>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {result.hits.length > 0 ? (
            <div>
              <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Matched keywords</Mono>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.hits.map((h, i) => {
                  const c = h.w === 3 ? "#fbbf24" : h.w === 2 ? "#60a5fa" : G;
                  return (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: `${c}12`, border: `1px solid ${c}30`, borderRadius: 4, padding: "4px 10px" }}>
                      <Mono style={{ fontSize: 10, color: c }}>{h.k}</Mono>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 700, background: c, color: "#000", borderRadius: 3, padding: "1px 5px" }}>+{h.w}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <Mono style={{ fontSize: 11, color: "#f87171" }}>No keyword matches — this article would be filtered out as off-topic.</Mono>
          )}
        </div>
      )}

      <div>
        <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Quick test headlines</Mono>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {SAMPLES.map((s, i) => (
            <button
              key={i}
              onClick={() => { setText(s.t); setSrc(s.src); }}
              style={{
                background: "none", border: `1px solid ${BORDER}`, borderRadius: 6,
                padding: "9px 14px", textAlign: "left",
                fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: MID, cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.borderColor = G; e.target.style.color = LIGHT; }}
              onMouseLeave={e => { e.target.style.borderColor = BORDER; e.target.style.color = MID; }}
            >
              <span style={{ color: DIM }}>{s.src}</span> — {s.t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Models & pipeline ──────────────────────────────────────
function ModelsTab() {
  const MODELS = [
    {
      stage: "01",
      role: "Filter & deduplicate",
      model: "gemini-2.5-flash-lite",
      provider: "Google Vertex AI",
      input: "$0.10 / M tokens",
      output: "$0.40 / M tokens",
      color: "#60a5fa",
      tokens: "~3,000 in · ~50 out",
      cost: "~$0.0003 / run",
      task: "Receives top 40 articles scored locally. Returns 15 indices of the best, most diverse, non-duplicate stories. Uses FILTER_SCHEMA to enforce clean JSON.",
      why: "Classification and routing — exactly what Flash-Lite is optimised for. No reasoning needed, just selection.",
      schema: `{ "selected": [1, 4, 7, 9, ...] }`,
    },
    {
      stage: "02",
      role: "Summarise & rank",
      model: "gemini-2.5-flash",
      provider: "Google Vertex AI",
      input: "$0.30 / M tokens",
      output: "$1.25 / M tokens",
      color: "#fbbf24",
      tokens: "~8,000 in · ~2,000 out",
      cost: "~$0.0033 / run",
      task: "Receives the 15 filtered articles. Picks top 15, identifies breakthroughs, writes sharp journalist-style summaries with model names and benchmark numbers.",
      why: "Needs actual reasoning and writing quality. Flash is the sweet spot — 5× cheaper than Pro with equivalent output for summarisation tasks.",
      schema: `{
  "date": "...",
  "breakthroughs": [{ "title", "source", "summary", "significance", "index" }],
  "top_articles":  [{ "rank", "index", "title", "source", "summary", "why_it_matters" }]
}`,
    },
  ];

  const PIPELINE = [
    { icon: "📡", label: "29 RSS feeds", sub: "~120 raw articles", color: "#60a5fa" },
    { icon: "⚖️", label: "Local scoring", sub: "weighted keywords · free", color: "#fbbf24" },
    { icon: "✂️", label: "Top 40", sub: "by score", color: MID },
    { icon: "🪶", label: "Flash-Lite", sub: "filter → 15", color: "#60a5fa" },
    { icon: "🧠", label: "Flash", sub: "summarise", color: "#fbbf24" },
    { icon: "🔗", label: "URL inject", sub: "via index · free", color: G },
    { icon: "📧", label: "GmailApp", sub: "6 AM · 4 PM", color: G },
  ];

  return (
    <div>
      {/* Pipeline diagram */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "22px 26px", marginBottom: 16 }}>
        <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 4, textTransform: "uppercase", display: "block", marginBottom: 20 }}>// full pipeline</Mono>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
          {PIPELINE.map((item, i) => (
            <>
              <div key={item.label} style={{ textAlign: "center", padding: "8px 10px" }}>
                <div style={{ fontSize: 20 }}>{item.icon}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, color: item.color, marginTop: 5 }}>{item.label}</div>
                <Mono style={{ fontSize: 9, color: MID }}>{item.sub}</Mono>
              </div>
              {i < PIPELINE.length - 1 && (
                <Mono key={`arrow-${i}`} style={{ fontSize: 13, color: DIM, padding: "0 2px" }}>→</Mono>
              )}
            </>
          ))}
        </div>
      </div>

      {/* Cost summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Per run", val: "~$0.0036", sub: "2 API calls total", color: G },
          { label: "Per day", val: "~$0.007", sub: "2 runs · 6 AM + 4 PM", color: G },
          { label: "Per month", val: "~$0.21", sub: "covered by $300 GCP credits", color: G },
        ].map(c => (
          <div key={c.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 22, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.val}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: LIGHT, marginTop: 6 }}>{c.label}</div>
            <Mono style={{ fontSize: 10, color: MID }}>{c.sub}</Mono>
          </div>
        ))}
      </div>

      {/* Model cards */}
      {MODELS.map((m, i) => (
        <div key={m.model} style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12,
          marginBottom: 14, overflow: "hidden",
        }}>
          {/* Header bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px", borderBottom: `1px solid ${BORDER}`, background: "#0a0a0a" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 6, flexShrink: 0,
              background: `${m.color}18`, border: `1px solid ${m.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Mono style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.stage}</Mono>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{m.role}</div>
              <Mono style={{ fontSize: 10, color: m.color }}>{m.model}</Mono>
            </div>
            <div style={{ textAlign: "right" }}>
              <Mono style={{ fontSize: 11, color: LIGHT, display: "block" }}>{m.cost}</Mono>
              <Mono style={{ fontSize: 10, color: MID }}>{m.tokens}</Mono>
            </div>
          </div>

          <div style={{ padding: "18px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Left: task + why */}
            <div>
              <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Task</Mono>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: MID, lineHeight: 1.9, marginBottom: 16 }}>{m.task}</div>
              <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Why this model</Mono>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: MID, lineHeight: 1.9 }}>{m.why}</div>
            </div>

            {/* Right: pricing + schema */}
            <div>
              <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Pricing (Vertex AI)</Mono>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Input", val: m.input },
                  { label: "Output", val: m.output },
                ].map(p => (
                  <div key={p.label} style={{ flex: 1, background: "#080808", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px" }}>
                    <Mono style={{ fontSize: 9, color: DIM, display: "block", marginBottom: 4 }}>{p.label}</Mono>
                    <Mono style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{p.val}</Mono>
                  </div>
                ))}
              </div>
              <Mono style={{ fontSize: 9, color: DIM, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 8 }}>responseSchema enforced</Mono>
              <pre style={{
                margin: 0, padding: "12px 14px",
                background: "#050505", border: `1px solid ${BORDER}`, borderRadius: 8,
                fontFamily: "'IBM Plex Mono',monospace", fontSize: 10,
                color: m.color, lineHeight: 1.8, overflowX: "auto",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>{m.schema}</pre>
            </div>
          </div>
        </div>
      ))}

      {/* Auth note */}
      <div style={{ background: "rgba(0,200,130,0.04)", border: "1px solid rgba(0,200,130,0.15)", borderRadius: 10, padding: "16px 20px", marginTop: 4 }}>
        <Mono style={{ fontSize: 9, color: G, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 10 }}>// auth — why no API key is needed</Mono>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {[
            { label: "ScriptApp.getOAuthToken()", color: "#fbbf24" },
            { label: "→", color: DIM },
            { label: "Google OAuth token", color: LIGHT },
            { label: "→", color: DIM },
            { label: "Vertex AI accepts it", color: G },
            { label: "→", color: DIM },
            { label: "Billed to GCP project", color: LIGHT },
            { label: "→", color: DIM },
            { label: "$300 free credits", color: G },
          ].map((item, i) => (
            <Mono key={i} style={{ fontSize: 11, color: item.color }}>{item.label}</Mono>
          ))}
        </div>
        <Mono style={{ fontSize: 10, color: MID, lineHeight: 1.9 }}>
          Google Apps Script automatically mints a short-lived OAuth token scoped to the GCP project. Vertex AI accepts this as the bearer token. No API key storage, no credential management.
        </Mono>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────
export default function KeywordScorerV2() {
  const [activeTab, setActiveTab] = useState("tiers");
  const total = W3.length + W2.length + W1.length;

  const TABS = [
    { id: "tiers",   label: "Keyword tiers" },
    { id: "samples", label: "Sample headlines" },
    { id: "scorer",  label: "Live scorer" },
    { id: "models",  label: "Models & pipeline" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: LIGHT, fontFamily: "Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Playfair+Display:wght@800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        .fu { animation: fadeUp 0.45s ease both; }
        .blink { animation: blink 1.1s step-end infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
        textarea, input { outline: none; }
        textarea:focus, input:focus { border-color: #00c882 !important; }
      `}</style>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 72px" }}>

        {/* Header */}
        <div className="fu" style={{ marginBottom: 40 }}>
          <Mono style={{ fontSize: 10, color: G, letterSpacing: 6, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
            // keyword scoring · v2 · latest keywords
          </Mono>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 900, lineHeight: 1.05, color: "#f0f0f0", letterSpacing: -1 }}>
            Weighted Keyword<br />
            <span style={{ color: G }}>Scorer</span>
            <span className="blink" style={{ color: G }}>_</span>
          </h1>
          <p style={{ margin: "14px 0 0", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: MID, lineHeight: 1.9 }}>
            {total} keywords across 3 weighted tiers · exact mirror of Code.gs scoreArticle()
          </p>
        </div>

        {/* Stats */}
        <div className="fu" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            { label: "W3 (×3)", val: W3.length, sub: "releases & labs", color: "#fbbf24" },
            { label: "W2 (×2)", val: W2.length, sub: "techniques & infra", color: "#60a5fa" },
            { label: "W1 (×1)", val: W1.length, sub: "general relevance", color: G },
            { label: "Total", val: total, sub: "all keywords", color: LIGHT },
          ].map(c => (
            <div key={c.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 26, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: LIGHT, marginTop: 6 }}>{c.label}</div>
              <Mono style={{ fontSize: 10, color: MID }}>{c.sub}</Mono>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="fu" style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? `${G}18` : "none",
                border: `1px solid ${activeTab === tab.id ? G : BORDER}`,
                borderRadius: 6, padding: "9px 20px",
                color: activeTab === tab.id ? G : MID,
                fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700,
                cursor: "pointer", letterSpacing: 1, transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="fu">
          {activeTab === "tiers"   && <TiersTab />}
          {activeTab === "samples" && <SamplesTab />}
          {activeTab === "scorer"  && <ScorerTab />}
          {activeTab === "models"  && <ModelsTab />}
        </div>

        <div style={{ marginTop: 28, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: DIM, textAlign: "center", lineHeight: 2 }}>
          Scoring is client-side only — exact match of scoreArticle() in Code.gs
        </div>
      </div>
    </div>
  );
}
