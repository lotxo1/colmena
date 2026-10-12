/* Colmena — every AI model in one place. A static app on Pollinations: each user signs in
   with their own Pollinations account and pays with their own Pollen (Connect User Wallets). */
(() => {
"use strict";

// ================================================================== config
const APP_KEY = "pk_DgqRBlyoCJ4Dd2Ls"; // public App Key (developer earnings on)
const PAGES_URL = "https://lotxo1.github.io/colmena/";
const IS_LOCAL = location.hostname === "localhost";
const REDIRECT_URI = IS_LOCAL ? `http://localhost:${location.port}/` : PAGES_URL;
const AUTH_URL = "https://enter.pollinations.ai/authorize";
const TOKEN_URL = "https://enter.pollinations.ai/api/oauth/token";
const API = "https://gen.pollinations.ai";
const MARKUP = 1.25; // apps with developer earnings charge users 25% over base rates
const TTS_MODEL = "openai/tts-1";
const STT_MODEL = "whisper";
const DEFAULT_IMAGE_MODEL = "tongyi-mai/z-image-turbo";
const IMAGE_PICKS = ["tongyi-mai/z-image-turbo", "black-forest-labs/flux.2-klein-4b", "black-forest-labs/flux.1-schnell", "lykon/dreamshaper-8-lcm", "openai/gpt-image-1-mini"];
const EDIT_MODELS = ["black-forest-labs/flux.2-klein-4b", "openai/gpt-image-1-mini", "microsoft/mai-image-2.6-flash", "black-forest-labs/flux.1-kontext-pro"];
// Curated picks: the first available candidate of each row is shown under "Our picks".
const PICKS = [
  ["pickFast", ["openai/gpt-6-luna", "openai/gpt-5.4-nano", "openai/gpt-5-nano"]],
  ["pickSmart", ["openai/gpt-5.4-mini", "openai/gpt-5.6-luna", "deepseek/deepseek-v4-flash"]],
  ["pickReason", ["deepseek/deepseek-v4.1-flash", "z-ai/glm-5.3-flash"]],
  ["pickBest", ["anthropic/claude-sonnet-5.5", "openai/gpt-6.1-sol", "openai/gpt-5.5"]],
  ["pickCode", ["moonshotai/kimi-k2.6", "minimax/minimax-m3", "qwen/qwen3-coder-next"]],
  ["pickWrite", ["mistralai/mistral-large-3", "anthropic/claude-haiku-5.5"]],
  ["pickTiny", ["amazon/nova-micro-v1", "openai/gpt-oss-20b"]],
];
const MAX_FILE_MB = 15;
const MAX_FILE_CHARS = 60000;
const MAX_ATTACH = 6;
const CDN = {
  pdf: { src: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", sri: "sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e", worker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js" },
  docx: { src: "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js", sri: "sha384-nFoSjZIoH3CCp8W639jJyQkuPHinJ2NHe7on1xvlUA7SuGfJAfvMldrsoAVm6ECz" },
};
const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|xml|html?|css|js|mjs|ts|tsx|jsx|py|java|c|cc|cpp|h|hpp|cs|go|rs|php|rb|swift|kt|sql|sh|bash|ps1|ya?ml|toml|ini|log|srt|vtt|tex)$/i;
const LANG_NAMES = { en: "English", es: "Spanish", pt: "Portuguese", fr: "French", id: "Indonesian" };

const BUILTIN = [
  { id: "general", em: "✨",
    name: { en: "General assistant", es: "Asistente general", pt: "Assistente geral", fr: "Assistant général", id: "Asisten umum" },
    desc: { en: "Ask anything", es: "Pregunta lo que quieras", pt: "Pergunte qualquer coisa", fr: "Posez n'importe quelle question", id: "Tanya apa saja" },
    system: "",
    starters: {
      en: ["Plan a 3-day trip to Lisbon on a small budget", "Explain inflation like I'm 12", "Give me 5 quick dinner ideas with rice and eggs"],
      es: ["Planea un viaje de 3 días a Lisboa con poco presupuesto", "Explícame la inflación como si tuviera 12 años", "Dame 5 ideas de cena rápidas con arroz y huevos"] } },
  { id: "english", em: "🗣️",
    name: { en: "English tutor", es: "Profesor de inglés", pt: "Professor de inglês", fr: "Prof d'anglais", id: "Guru bahasa Inggris" },
    desc: { en: "Practice by chatting, get corrections", es: "Practica conversando y te corrige", pt: "Pratique conversando e receba correções", fr: "Pratiquez en discutant, avec corrections", id: "Latihan ngobrol dan dikoreksi" },
    system: "You are a friendly, patient English tutor. Chat with the learner in simple English that matches their level. After each of their messages, first reply naturally to keep the conversation going, then add a short 'Corrections' section listing their mistakes with the corrected version and a one-line explanation in the learner's native language ({UI_LANG} unless they clearly use another). If there were no mistakes, praise them briefly. End with one follow-up question.",
    starters: {
      en: ["Let's practice: ask me about my weekend", "Correct this sentence: I have went to the store yesterday", "Teach me 5 useful phrases for a job interview"],
      es: ["Practiquemos: pregúntame qué hice el fin de semana", "Corrige esta frase: I have went to the store yesterday", "Enséñame 5 frases útiles para una entrevista de trabajo"] } },
  { id: "cv", em: "📄",
    name: { en: "CV reviewer", es: "Revisor de CV", pt: "Revisor de currículo", fr: "Relecteur de CV", id: "Pemeriksa CV" },
    desc: { en: "Improve your CV and cover letters", es: "Mejora tu CV y cartas de presentación", pt: "Melhore seu currículo e cartas", fr: "Améliorez CV et lettres de motivation", id: "Perbaiki CV dan surat lamaran" },
    system: "You are an experienced recruiter and career coach. Review CVs, LinkedIn profiles and cover letters the user shares (pasted or attached). Give concrete, prioritized improvements, rewrite weak bullet points with measurable results, point out missing information, and adapt the advice to the job they target. Ask for the target role if it's unknown. Be direct and practical.",
    starters: {
      en: ["Review my CV — I'll attach it with 📎", "Write a cover letter for a junior marketing position", "Turn my job duties into strong CV bullet points:"],
      es: ["Revisa mi CV — lo adjunto con 📎", "Escribe una carta de presentación para un puesto junior de marketing", "Convierte mis tareas del trabajo en logros para el CV:"] } },
  { id: "homework", em: "📚",
    name: { en: "Homework helper", es: "Ayuda con deberes", pt: "Ajuda com tarefas", fr: "Aide aux devoirs", id: "Bantuan PR" },
    desc: { en: "Explains step by step", es: "Explica paso a paso", pt: "Explica passo a passo", fr: "Explique étape par étape", id: "Menjelaskan langkah demi langkah" },
    system: "You are a patient tutor for school and university students. Explain concepts step by step with simple examples. For exercises, guide the student towards the answer with hints and checks instead of only giving the final result, unless they ask you to verify their own answer. Use clear formatting and show every step in math.",
    starters: {
      en: ["Solve 2x + 5 = 17 step by step", "Help me understand photosynthesis", "Quiz me with 5 questions about World War II"],
      es: ["Resuelve 2x + 5 = 17 paso a paso", "Ayúdame a entender la fotosíntesis", "Hazme un examen de 5 preguntas sobre la Segunda Guerra Mundial"] } },
  { id: "translator", em: "🌍",
    name: { en: "Translator", es: "Traductor", pt: "Tradutor", fr: "Traducteur", id: "Penerjemah" },
    desc: { en: "Natural, context-aware translation", es: "Traduce con naturalidad y contexto", pt: "Tradução natural com contexto", fr: "Traduction naturelle et contextuelle", id: "Terjemahan alami sesuai konteks" },
    system: "You are a professional translator. Translate the user's text naturally, keeping meaning, tone and formatting. Use the target language they name. If they don't name one, translate into English, or into {UI_LANG} when the text is already in English. Output only the translation, then short notes only for ambiguous idioms.",
    starters: {
      en: ["Translate to Spanish: I'm on my way, see you in ten minutes", "Translate this email to French:", "What's a natural way to say “no worries” in Portuguese?"],
      es: ["Traduce al inglés: Llego en diez minutos, ya voy de camino", "Traduce este correo al francés:", "¿Cómo se dice «no pasa nada» de forma natural en inglés?"] } },
  { id: "writer", em: "✉️",
    name: { en: "Writer", es: "Redactor", pt: "Redator", fr: "Rédacteur", id: "Penulis" },
    desc: { en: "Emails, messages and posts ready to send", es: "Emails, mensajes y posts listos para enviar", pt: "E-mails, mensagens e posts prontos", fr: "E-mails, messages et posts prêts à envoyer", id: "Email, pesan, dan postingan siap kirim" },
    system: "You are an expert writer. Turn the user's rough idea into a polished email, message, post or document. Match the requested tone (formal, friendly, persuasive) and length. If key details are missing, make sensible assumptions and mark them in [brackets]. Offer one shorter alternative when useful.",
    starters: {
      en: ["Write a polite email asking for a deadline extension", "Make this message sound more professional:", "Write an Instagram caption for a new bakery"],
      es: ["Escribe un correo educado pidiendo más plazo para una entrega", "Haz que este mensaje suene más profesional:", "Escribe un texto de Instagram para la apertura de una panadería"] } },
  { id: "summary", em: "🧾",
    name: { en: "Summarizer", es: "Resumidor", pt: "Resumidor", fr: "Résumeur", id: "Peringkas" },
    desc: { en: "Paste or attach long text, get the key points", es: "Pega o adjunta un texto largo y obtén lo importante", pt: "Cole ou anexe um texto longo e veja o essencial", fr: "Collez ou joignez un long texte, obtenez l'essentiel", id: "Tempel atau lampirkan teks panjang, dapatkan intinya" },
    system: "You summarize long texts and documents. Start with a two-sentence summary, then the key points as bullets, then any action items, dates or numbers worth remembering. Keep the user's language. Never invent facts that are not in the text.",
    starters: {
      en: ["Summarize a PDF — I'll attach it with 📎", "Summarize this article:", "List the action items in these notes:"],
      es: ["Resume un PDF — lo adjunto con 📎", "Resume este artículo:", "Saca las tareas pendientes de estas notas:"] } },
  { id: "coder", em: "💻",
    name: { en: "Coder", es: "Programador", pt: "Programador", fr: "Développeur", id: "Programmer" },
    desc: { en: "Code, bugs and explanations", es: "Código, errores y explicaciones", pt: "Código, erros e explicações", fr: "Code, bugs et explications", id: "Kode, bug, dan penjelasan" },
    system: "You are a senior software engineer. Give correct, minimal, well-explained code. When debugging, find the root cause first, then the fix. Prefer standard libraries, mention trade-offs briefly, and always use fenced code blocks with the language name.",
    starters: {
      en: ["Why does my fetch() return undefined in JavaScript?", "Write a Python script that renames photos by date", "Explain this error message:"],
      es: ["¿Por qué mi fetch() devuelve undefined en JavaScript?", "Escribe un script de Python que renombre fotos por fecha", "Explícame este mensaje de error:"] } },
];

// ================================================================== small helpers
const $ = (id) => document.getElementById(id);
const store = {
  get(k, area = localStorage) { try { return area.getItem(k); } catch { return null; } },
  set(k, v, area = localStorage) { try { area.setItem(k, v); return true; } catch { return false; } },
  del(k, area = localStorage) { try { area.removeItem(k); } catch { /* ignore */ } },
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const lastIndex = (arr, fn) => { for (let i = arr.length - 1; i >= 0; i--) if (fn(arr[i])) return i; return -1; };
function b64url(bytes) { let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b))); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function fromB64url(s) { const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); }
function randomString(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a); }
async function sha256(text) { return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))); }
function fmtPollen(v) {
  if (v == null || !isFinite(v)) return "—";
  if (v === 0) return "0";
  if (v >= 1) return v.toFixed(2);
  if (v >= 0.01) return v.toFixed(3);
  return Number(v.toPrecision(2)).toString();
}
const fmtCount = (n) => new Intl.NumberFormat(state.lang, n >= 10000 ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(Math.max(0, Math.floor(n)));

// Tiny IndexedDB key-value store (chats can hold images, more than localStorage allows).
const idb = {
  db: null,
  open() {
    return new Promise((resolve) => {
      // Some browsers never answer (blocked or private modes): give up after a moment and use localStorage.
      const timer = setTimeout(() => resolve(false), 2500);
      const done = (ok) => { clearTimeout(timer); resolve(ok); };
      try {
        const req = indexedDB.open("colmena", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("kv");
        req.onsuccess = () => { this.db = req.result; done(true); };
        req.onerror = () => done(false);
        req.onblocked = () => done(false);
      } catch { done(false); }
    });
  },
  get(key) {
    return new Promise((resolve) => {
      if (!this.db) return resolve(undefined);
      try { const q = this.db.transaction("kv").objectStore("kv").get(key); q.onsuccess = () => resolve(q.result); q.onerror = () => resolve(undefined); } catch { resolve(undefined); }
    });
  },
  set(key, value) {
    return new Promise((resolve) => {
      if (!this.db) return resolve(false);
      try { const tx = this.db.transaction("kv", "readwrite"); tx.objectStore("kv").put(value, key); tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(false); } catch { resolve(false); }
    });
  },
};

// ================================================================== state & i18n
const I18N = window.COLMENA_I18N;
const LANGS = Object.keys(I18N.languages);
const state = {
  lang: "en",
  token: store.get("colmena.token", sessionStorage) || store.get("colmena.token"),
  models: [], imageModels: [],
  modelId: store.get("colmena.model") || "",
  imageModelId: store.get("colmena.imageModel") || DEFAULT_IMAGE_MODEL,
  voice: store.get("colmena.voice") || "nova",
  memory: Number(store.get("colmena.memory")) || 24,
  autoRead: store.get("colmena.autoRead") === "1",
  voiceMode: false,
  chats: [], customAssistants: [], currentId: null,
  mode: "chat", attachments: [], streaming: null, audio: null, recorder: null,
  balance: null, picker: "select", editingAssistant: null, pendingImport: null, pendingUse: null, search: "",
};
state.lang = (() => {
  const saved = store.get("colmena.lang");
  if (saved && LANGS.includes(saved)) return saved;
  for (const l of navigator.languages || [navigator.language || "en"]) { const c = String(l).slice(0, 2).toLowerCase(); if (LANGS.includes(c)) return c; }
  return "en";
})();
const t = (k, vars) => {
  let s = (I18N.strings[state.lang] || {})[k] ?? I18N.strings.en[k] ?? k;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.split(`{${a}}`).join(String(b));
  return s;
};
const loc = (obj) => (typeof obj === "string" ? obj : (obj && (obj[state.lang] || obj.en)) || "");
const rememberMe = () => store.get("colmena.remember") !== "0"; // on unless turned off

// ================================================================== persistence
let saveTimer = 0;
function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 200); }
async function flush() {
  const ok = (await idb.set("chats", state.chats)) && (await idb.set("assistants", state.customAssistants));
  if (!ok) {
    // No IndexedDB (rare private modes): fall back to localStorage, dropping the oldest chats if full.
    const chats = state.chats.slice().sort((a, b) => b.updatedAt - a.updatedAt);
    while (!store.set("colmena.chats", JSON.stringify(chats)) && chats.length > 1) chats.pop();
    store.set("colmena.assistants", JSON.stringify(state.customAssistants));
  }
  if (state.currentId) store.set("colmena.current", state.currentId); else store.del("colmena.current");
}
async function loadData() {
  await idb.open();
  let chats = await idb.get("chats");
  let assistants = await idb.get("assistants");
  if (!Array.isArray(chats)) {
    try { chats = JSON.parse(store.get("colmena.chats") || "[]"); } catch { chats = []; }
    if (chats.length && (await idb.set("chats", chats))) store.del("colmena.chats");
  }
  if (!Array.isArray(assistants)) { try { assistants = JSON.parse(store.get("colmena.assistants") || "[]"); } catch { assistants = []; } }
  state.chats = Array.isArray(chats) ? chats : [];
  state.customAssistants = Array.isArray(assistants) ? assistants : [];
  state.currentId = store.get("colmena.current");
  if (!state.chats.some((c) => c.id === state.currentId)) state.currentId = null;
}
const currentChat = () => state.chats.find((c) => c.id === state.currentId) || null;

// ================================================================== auth (OAuth code flow + PKCE, no server)
async function signIn() {
  const verifier = randomString(48);
  const st = randomString(16);
  store.set("colmena.verifier", verifier, sessionStorage);
  store.set("colmena.state", st, sessionStorage);
  const params = new URLSearchParams({
    response_type: "code", client_id: APP_KEY, redirect_uri: REDIRECT_URI, scope: "profile usage",
    state: st, code_challenge: await sha256(verifier), code_challenge_method: "S256",
    models: "text,image,audio", expiry: "30",
  });
  location.href = `${AUTH_URL}?${params}`;
}
async function handleRedirect() {
  const q = new URLSearchParams(location.search);
  if (!q.get("code") && !q.get("error")) return;
  history.replaceState(null, "", location.pathname + location.hash);
  if (q.get("error")) return;
  const expected = store.get("colmena.state", sessionStorage);
  const verifier = store.get("colmena.verifier", sessionStorage);
  store.del("colmena.state", sessionStorage);
  store.del("colmena.verifier", sessionStorage);
  if (!expected || q.get("state") !== expected || !verifier) { toast(t("errSignIn", { msg: "state mismatch" })); return; }
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code: q.get("code"), client_id: APP_KEY, redirect_uri: REDIRECT_URI, code_verifier: verifier }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) throw new Error(data.error_description || data.error || res.status);
    setToken(data.access_token);
  } catch (e) { toast(t("errSignIn", { msg: e.message })); }
}
function setToken(token) {
  state.token = token;
  store.set("colmena.token", token, sessionStorage);
  if (rememberMe()) store.set("colmena.token", token); else store.del("colmena.token");
}
function signOut() {
  state.token = null;
  store.del("colmena.token", sessionStorage);
  store.del("colmena.token");
  if (state.streaming) state.streaming.abort();
  stopAudio();
  closeModals();
  render();
}

// ================================================================== API
class ApiError extends Error { constructor(status, message, code) { super(message); this.status = status; this.code = code || ""; } }
async function api(path, opts = {}) {
  let res;
  try {
    res = await fetch(API + path, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${state.token}` } });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new ApiError(0, e.message || "network");
  }
  if (!res.ok) {
    let msg = res.statusText || "error", code = "";
    try {
      const j = await res.json();
      const er = j.error || j;
      msg = (typeof er === "string" ? er : er.message) || j.message || msg;
      code = (er && er.code) || j.code || "";
    } catch { /* not JSON */ }
    if (res.status === 401) { signOut(); toast(t("errAuth")); }
    throw new ApiError(res.status, String(msg), code);
  }
  return res;
}
function errorHtml(err, modelId) {
  const s = err.status;
  if (s === 402) {
    if (/budget/i.test(`${err.code} ${err.message}`)) {
      const link = (err.message.match(/https:\/\/enter\.pollinations\.ai\/[^\s"'(),;<>]+/) || ["https://enter.pollinations.ai"])[0].replace(/[.,;:!?]+$/, "");
      return `${esc(t("errBudget"))} <a href="${esc(link)}" target="_blank" rel="noopener">${esc(t("errBudgetLink"))}</a>`;
    }
    return `${esc(t("errPollen"))} <a href="https://enter.pollinations.ai" target="_blank" rel="noopener">${esc(t("errPollenLink"))}</a>`;
  }
  if (s === 401) return esc(t("errAuth"));
  if (s === 403) return esc(t("errForbidden"));
  if (s === 429) return esc(t("errRate"));
  if (s === 0) return esc(t("errNetwork"));
  if (s >= 500 && modelId) {
    const alt = fallbackModel(modelId);
    return esc(t("errServer", { model: label(modelById(modelId)) || modelId })) +
      (alt ? ` <button type="button" class="link-btn" data-switch-model="${esc(alt.name)}">${esc(t("tryModel", { model: label(alt) }))}</button>` : "");
  }
  return esc(t("errGeneric", { status: s, msg: String(err.message).slice(0, 300) }));
}
const errorText = (err) => errorHtml(err).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function loadAccount() {
  try {
    const p = await (await api("/account/profile")).json();
    $("userName").textContent = p.name || p.githubUsername || "";
    if (p.image) { $("avatar").src = p.image; $("avatar").classList.remove("hidden"); } else $("avatar").classList.add("hidden");
  } catch { /* optional */ }
  refreshBalance();
}
async function refreshBalance() {
  try {
    const b = await (await api("/account/balance")).json();
    const total = b.accountBalance ? b.accountBalance.total : null;
    state.balance = b.balance != null ? (total != null ? Math.min(b.balance, total) : b.balance) : total;
  } catch { /* optional */ }
  renderBalance();
}
function renderBalance() {
  const v = state.balance;
  $("balance").textContent = v == null ? "—" : `🪙 ${t("balance", { n: fmtPollen(v) })}`;
  const m = modelById(state.modelId);
  const per = m ? msgCost(m) : 0;
  $("msgsLeft").textContent = v != null && per > 0 ? t("msgsLeft", { n: fmtCount(v / per) }) : "";
  const low = v != null && per > 0 && v < Math.max(0.002, per * 8);
  const banner = $("lowBanner");
  banner.classList.toggle("hidden", !low);
  if (low) banner.innerHTML = `${esc(t("lowBalance"))} <a href="https://enter.pollinations.ai" target="_blank" rel="noopener">${esc(t("getMore"))}</a>`;
  updateCostHint();
}

// ================================================================== models & prices
const price = (m, k) => Number(((m && m.pricing) || {})[k] || 0);
const hasPrice = (m) => !!m && Object.keys(m.pricing || {}).some((k) => k !== "currency");
const isVision = (m) => !!m && (m.input_modalities || []).includes("image");
const isDown = (m) => ((m && m.health) || {}).status === "down";
const canEdit = (m) => !!m && (m.input_modalities || []).includes("image") && (m.supported_endpoints || []).includes("/v1/images/edits");
const label = (m) => (m ? m.title || m.name : "");
// A typical message: ~500 prompt tokens (instructions + some history) and ~300 answer tokens.
// Measured answers ranged from 0.00003 (one line) to 0.0006 (a long travel plan) on cheap models.
function msgCost(m, extraPromptTokens = 0) {
  return ((500 + extraPromptTokens) * price(m, "promptTextTokens") + 300 * price(m, "completionTextTokens")) * MARKUP;
}
// Flat-rate image models charge per image; the others charge per image token (~1,100 for a 1024px image).
function imgCost(m) { return price(m, "completionImageTokens") * (m && m.flat_rate ? 1 : 1100) * MARKUP; }
function usageCost(m, u) {
  if (!m || !u) return null;
  const cached = (u.prompt_tokens_details && u.prompt_tokens_details.cached_tokens) || 0;
  const promptTokens = Math.max(0, (u.prompt_tokens || 0) - cached);
  const base = promptTokens * price(m, "promptTextTokens") +
    cached * (price(m, "promptCachedTokens") || price(m, "promptTextTokens")) +
    (u.completion_tokens || 0) * price(m, "completionTextTokens");
  return base * MARKUP;
}
function imageUsageCost(m, u) {
  if (!m) return null;
  if (m.flat_rate || !u) return imgCost(m);
  const d = u.input_tokens_details || {};
  return ((u.output_tokens || 0) * price(m, "completionImageTokens") + (d.image_tokens || 0) * price(m, "promptImageTokens") +
    (d.text_tokens || 0) * price(m, "promptTextTokens")) * MARKUP;
}
const modelById = (id) => (id ? state.models.find((m) => m.name === id || (m.aliases || []).includes(id)) : null) || null;
const imageModelById = (id) => state.imageModels.find((m) => m.name === id) || null;
function firstAvailable(ids, skip = new Set()) {
  for (const id of ids) { const m = modelById(id); if (m && !isDown(m) && !skip.has(m.name)) return m; }
  return null;
}
function pickList() {
  const used = new Set();
  const out = [];
  for (const [key, ids] of PICKS) {
    const m = firstAvailable(ids, used);
    if (m) { used.add(m.name); out.push([key, m]); }
  }
  return out;
}
// When a model fails, suggest a cheap, very reliable one instead.
const FALLBACKS = ["openai/gpt-5.4-nano", "openai/gpt-6-luna", "deepseek/deepseek-v4-flash", "amazon/nova-micro-v1", "openai/gpt-oss-20b"];
function fallbackModel(modelId) {
  const m = modelById(modelId);
  return firstAvailable(FALLBACKS, new Set([m ? m.name : modelId]));
}
const usableTextModel = (m) => (m.supported_endpoints || []).includes("/v1/chat/completions") && !m.is_specialized && !m.agent &&
  hasPrice(m) && !(m.input_modalities || []).includes("audio") && !(m.output_modalities || []).includes("audio");

async function loadModels() {
  const cacheKey = `colmena.models.${(state.token || "").slice(-10)}`;
  let cached = null;
  try { cached = JSON.parse(store.get(cacheKey, sessionStorage) || "null"); } catch { cached = null; }
  let text, image;
  if (cached && Date.now() - cached.at < 10 * 60e3) ({ text, image } = cached);
  else {
    [text, image] = await Promise.all([
      api("/text/models").then((r) => r.json()).catch(() => []),
      api("/image/models").then((r) => r.json()).catch(() => []),
    ]);
    if (Array.isArray(text) && text.length) store.set(cacheKey, JSON.stringify({ at: Date.now(), text, image }), sessionStorage);
  }
  state.models = (Array.isArray(text) ? text : []).filter(usableTextModel);
  state.imageModels = (Array.isArray(image) ? image : []).filter((m) => m.category === "image" &&
    (m.output_modalities || []).includes("image") && hasPrice(m) && !m.community && !isDown(m));
  const current = modelById(state.modelId);
  if (!current || isDown(current)) {
    const def = firstAvailable(PICKS[0][1]) || state.models.slice().sort((a, b) => ((b.health || {}).requests || 0) - ((a.health || {}).requests || 0))[0];
    state.modelId = def ? def.name : "";
  } else state.modelId = current.name;
  if (!imageModelById(state.imageModelId)) {
    const def = IMAGE_PICKS.map(imageModelById).find(Boolean) || state.imageModels[0];
    state.imageModelId = def ? def.name : DEFAULT_IMAGE_MODEL;
  }
  renderModelButton();
  renderImageModels();
  renderBalance();
  if (!$("modelsModal").classList.contains("hidden")) renderModelList();
  if (currentChat() && !state.streaming) renderMessages();
}
function setModel(id) {
  const m = modelById(id);
  if (!m) return;
  state.modelId = m.name;
  store.set("colmena.model", m.name);
  renderModelButton();
  renderBalance();
}
function setImageModel(id) {
  if (!imageModelById(id)) return;
  state.imageModelId = id;
  store.set("colmena.imageModel", id);
  $("imageModel").value = id;
  updateCostHint();
}
function renderModelButton() {
  const m = modelById(state.modelId);
  $("modelName").textContent = label(m) || "…";
  $("modelPrice").textContent = m ? `≈${fmtPollen(msgCost(m))}` : "";
}
function renderImageModels() {
  const order = (m) => { const i = IMAGE_PICKS.indexOf(m.name); return i < 0 ? 100 + imgCost(m) : i; };
  $("imageModel").innerHTML = state.imageModels.slice().sort((a, b) => order(a) - order(b))
    .map((m) => `<option value="${esc(m.name)}">${esc(label(m))} · ≈${fmtPollen(imgCost(m))}${canEdit(m) ? " · ✎" : ""}</option>`).join("");
  $("imageModel").value = state.imageModelId;
}
// Extra prompt tokens on the next message: new attachments plus files already in the chat's memory window.
function attachmentTokens() {
  let n = state.attachments.reduce((sum, a) => sum + (a.kind === "file" ? Math.ceil(a.text.length / 4) : 900), 0);
  const chat = currentChat();
  if (chat && state.mode === "chat") {
    for (const m of chat.messages.slice(-state.memory)) for (const f of m.files || []) n += Math.ceil(f.text.length / 4);
  }
  return n;
}
function updateCostHint() {
  const el = $("costHint");
  if (state.mode === "image") {
    const m = imageModelById(state.imageModelId);
    el.textContent = m ? t("costHintImage", { cost: fmtPollen(imgCost(m)), model: label(m) }) : "";
    return;
  }
  const m = modelById(state.modelId);
  el.textContent = m ? t("costHintChat", { cost: fmtPollen(msgCost(m, attachmentTokens())), model: label(m) }) : "";
}

function renderModelList() {
  const list = $("modelList");
  $("modelsTitle").textContent = t(state.picker === "rerun" ? "askOtherTitle" : "chooseModel");
  if (!state.models.length) { list.innerHTML = `<div class="model-group"><span class="typing"><i></i><i></i><i></i></span></div>`; return; }
  const q = $("modelSearch").value.trim().toLowerCase();
  const vision = $("filterVision").checked;
  const community = $("filterCommunity").checked;
  const ok = (m) => (community || !m.community) && (!vision || isVision(m)) && !isDown(m) &&
    (!q || `${m.name} ${m.title || ""} ${m.description || ""} ${(m.aliases || []).join(" ")} ${m.publisher || ""}`.toLowerCase().includes(q));
  const row = (m, pick) => {
    const tags = [];
    if (isVision(m)) tags.push(t("tagVision"));
    if (m.reasoning) tags.push(t("tagReasoning"));
    if (m.community) tags.push(t("tagCommunity"));
    if (((m.health || {}).status) === "degraded") tags.push(t("tagSlow"));
    const cost = msgCost(m);
    return `<div class="model-row${m.name === state.modelId && state.picker === "select" ? " selected" : ""}" data-model="${esc(m.name)}" role="button" tabindex="0">
      <div class="mr-main">${pick ? `<div class="pick-label">${esc(t(pick))}</div>` : ""}
        <div class="mr-title">${esc(label(m))} <span class="muted small-text">· ${esc(m.publisher || "")}</span></div>
        <div class="mr-desc">${esc(m.description || m.name)}</div>
        <div class="tags">${tags.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div></div>
      <div class="mr-price">≈${fmtPollen(cost)}<div class="muted small-text">${esc(t("perMessage"))}</div>
        <div class="muted small-text">${esc(t("msgsPerPollen", { n: fmtCount(1 / cost) }))}</div></div></div>`;
  };
  const picks = pickList().filter(([, m]) => ok(m));
  const all = state.models.filter(ok).sort((a, b) => msgCost(a) - msgCost(b));
  list.innerHTML = (q || !picks.length ? "" : `<div class="model-group">${esc(t("ourPicks"))}</div>${picks.map(([k, m]) => row(m, k)).join("")}`) +
    `<div class="model-group">${esc(t("allModels"))} (${all.length})</div>${all.map((m) => row(m)).join("")}`;
}
function openModelPicker(purpose = "select") {
  state.picker = purpose;
  $("modelSearch").value = "";
  openModal("modelsModal");
  renderModelList();
  if (!matchMedia("(pointer: coarse)").matches) $("modelSearch").focus();
}

// ================================================================== markdown
let purifyHooked = false;
function renderMarkdown(text) {
  if (window.marked && window.DOMPurify) {
    if (!purifyHooked) {
      DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        if (node.tagName === "A") { node.setAttribute("target", "_blank"); node.setAttribute("rel", "noopener noreferrer"); }
      });
      purifyHooked = true;
    }
    // Images from other sites are turned into links: auto-loading them could leak chat content
    // (a classic prompt-injection trick) and the page's CSP blocks them anyway.
    const tpl = document.createElement("template");
    tpl.innerHTML = DOMPurify.sanitize(marked.parse(text, { breaks: true, gfm: true }));
    tpl.content.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (src.startsWith("https://media.pollinations.ai/")) return;
      const isWeb = /^https?:\/\//i.test(src);
      const el = document.createElement(isWeb ? "a" : "span");
      if (isWeb) { el.href = src; el.target = "_blank"; el.rel = "noopener noreferrer"; }
      el.textContent = `🖼 ${img.getAttribute("alt") || src.replace(/^https?:\/\//i, "").slice(0, 60) || "image"}`;
      img.replaceWith(el);
    });
    return tpl.innerHTML;
  }
  return esc(text).replace(/\n/g, "<br>");
}
function enhanceCode(root) {
  root.querySelectorAll("pre code").forEach((code) => {
    if (code.dataset.done) return;
    code.dataset.done = "1";
    if (window.hljs) { try { hljs.highlightElement(code); } catch { /* ignore */ } }
    const btn = document.createElement("button");
    btn.className = "copy-code"; btn.type = "button"; btn.textContent = t("copy");
    btn.onclick = () => copyText(code.innerText, btn);
    code.parentElement.appendChild(btn);
  });
}
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (!btn) { toast(t("copied")); return; }
    const old = btn.textContent;
    btn.textContent = `✓ ${t("copied")}`;
    setTimeout(() => (btn.textContent = old), 1300);
  }).catch(() => {});
}

// ================================================================== assistants
const assistantById = (id) => BUILTIN.find((a) => a.id === id) || state.customAssistants.find((a) => a.id === id) || null;
const assistantOf = (chat) => (chat && (assistantById(chat.assistant) || chat.assistantSnap)) || BUILTIN[0];
const startersOf = (a) => (Array.isArray(a.starters) ? a.starters : (a.starters && (a.starters[state.lang] || a.starters.en)) || []);

function renderAssistants() {
  const card = (a, custom) => `<div class="assistant-card" data-assistant="${esc(a.id)}" role="button" tabindex="0">
    ${custom ? `<button type="button" class="card-edit" data-edit-assistant="${esc(a.id)}" aria-label="${esc(t("editorEdit"))}">✎</button>` : ""}
    <div class="em">${esc(a.em)}</div><b>${esc(loc(a.name))}</b><span class="d">${esc(loc(a.desc))}</span></div>`;
  $("assistants").innerHTML =
    startersHtml(startersOf(BUILTIN[0])) +
    `<div class="grid">${BUILTIN.map((a) => card(a, false)).join("")}${state.customAssistants.map((a) => card(a, true)).join("")}
      <div class="assistant-card create" data-action="new-assistant" role="button" tabindex="0"><div class="em">＋</div><b>${esc(t("createAssistant"))}</b><span class="d">${esc(t("createAssistantDesc"))}</span></div></div>`;
}
const startersHtml = (list) => (list.length
  ? `<div class="starters"><span class="muted small-text">${esc(t("tryThese"))}</span>${list.map((s) => `<button type="button" class="starter" data-starter="${esc(s)}">${esc(s)}</button>`).join("")}</div>`
  : "");

function openEditor(id) {
  const a = id ? state.customAssistants.find((x) => x.id === id) : null;
  state.editingAssistant = a ? a.id : null;
  $("editorTitle").textContent = t(a ? "editorEdit" : "editorNew");
  $("edEmoji").value = a ? a.em : "🤖";
  $("edName").value = a ? a.name : "";
  $("edDesc").value = a ? a.desc || "" : "";
  $("edSystem").value = a ? a.system : "";
  $("edStarters").value = a ? (a.starters || []).join("\n") : "";
  $("edDelete").classList.toggle("hidden", !a);
  $("edShare").classList.toggle("hidden", !a);
  openModal("editorModal");
  $("edName").focus();
}
function cleanAssistant(raw) {
  const s = (v, n) => String(v || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n);
  const out = {
    em: s(raw.em, 8) || "🤖", name: s(raw.name, 60), desc: s(raw.desc, 80), system: s(raw.system, 4000),
    starters: (Array.isArray(raw.starters) ? raw.starters : String(raw.starters || "").split("\n")).map((x) => s(x, 200)).filter(Boolean).slice(0, 5),
  };
  return out.name && out.system ? out : null;
}
function saveEditor() {
  const data = cleanAssistant({ em: $("edEmoji").value, name: $("edName").value, desc: $("edDesc").value, system: $("edSystem").value, starters: $("edStarters").value });
  if (!data) { toast(t("needName")); return; }
  const existing = state.customAssistants.find((x) => x.id === state.editingAssistant);
  if (existing) Object.assign(existing, data);
  else state.customAssistants.push({ id: `c_${uid()}`, custom: true, ...data });
  persist();
  closeModals();
  renderAssistants();
  renderChatList();
}
function deleteAssistant() {
  if (!state.editingAssistant || !confirm(t("confirmDeleteAssistant"))) return;
  state.customAssistants = state.customAssistants.filter((x) => x.id !== state.editingAssistant);
  persist();
  closeModals();
  renderAssistants();
}
function shareAssistant() {
  const a = state.customAssistants.find((x) => x.id === state.editingAssistant);
  if (!a) return;
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ v: 1, e: a.em, n: a.name, d: a.desc, s: a.system, p: a.starters })));
  copyText(`${PAGES_URL}#a=${payload}`);
  toast(t("shareCopied"));
}
// Links: #a=<shared custom assistant> and #use=<built-in assistant id>. They are remembered across the
// sign-in redirect (which drops the hash) and acted on once the user is signed in.
function readLinks() {
  const shared = location.hash.match(/[#&]a=([A-Za-z0-9_-]+)/);
  const use = location.hash.match(/[#&]use=([a-z]+)/);
  if (shared) {
    try {
      const j = JSON.parse(new TextDecoder().decode(fromB64url(shared[1])));
      const a = cleanAssistant({ em: j.e, name: j.n, desc: j.d, system: j.s, starters: j.p });
      if (a) store.set("colmena.pendingImport", JSON.stringify(a));
    } catch { /* ignore broken links */ }
  }
  if (use && BUILTIN.some((a) => a.id === use[1])) store.set("colmena.pendingUse", use[1]);
  if (shared || use) history.replaceState(null, "", location.pathname + location.search);
  try { state.pendingImport = JSON.parse(store.get("colmena.pendingImport") || "null"); } catch { state.pendingImport = null; }
  state.pendingUse = store.get("colmena.pendingUse");
}
function openPendingUse() {
  const id = state.pendingUse;
  store.del("colmena.pendingUse");
  state.pendingUse = null;
  if (id && assistantById(id)) newChat(id);
}
function shareUse(id) {
  copyText(`${PAGES_URL}#use=${id}`);
  toast(t("shareUseCopied"));
}
function showImport() {
  const a = state.pendingImport;
  if (!a) return;
  $("importBody").innerHTML = `<div class="import-card"><div class="em">${esc(a.em)}</div><div><b>${esc(a.name)}</b><p class="muted">${esc(a.desc)}</p>
    <details><summary>${esc(t("fInstructions"))}</summary><p class="small-text">${esc(a.system)}</p></details></div></div>`;
  openModal("importModal");
}
function importAssistant() {
  const a = state.pendingImport;
  if (!a) return;
  const existing = state.customAssistants.find((x) => x.name === a.name && x.system === a.system);
  const id = existing ? existing.id : `c_${uid()}`;
  if (!existing) state.customAssistants.push({ id, custom: true, ...a });
  store.del("colmena.pendingImport");
  state.pendingImport = null;
  persist();
  closeModals();
  renderAssistants();
  toast(t("importedOk"));
  newChat(id);
}

// ================================================================== rendering
function render() {
  const signedIn = !!state.token;
  $("landing").classList.toggle("hidden", signedIn);
  $("app").classList.toggle("hidden", !signedIn);
  applyI18n();
  if (signedIn) {
    renderChatList();
    renderMessages();
    renderBalance();
  } else {
    const banner = $("inviteBanner");
    const use = state.pendingUse && assistantById(state.pendingUse);
    banner.classList.toggle("hidden", !state.pendingImport && !use);
    if (state.pendingImport) banner.textContent = `${state.pendingImport.em} ${t("inviteBanner", { name: state.pendingImport.name })}`;
    else if (use) banner.textContent = `${use.em} ${t("useBanner", { name: loc(use.name) })}`;
  }
}
function applyI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
  document.querySelectorAll("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); el.setAttribute("aria-label", el.title); });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => (el.alt = t(el.dataset.i18nAlt)));
  document.querySelectorAll(".lang-select").forEach((sel) => {
    sel.innerHTML = LANGS.map((l) => `<option value="${l}">${esc(I18N.languages[l])}</option>`).join("");
    sel.value = state.lang;
  });
  document.querySelectorAll(".remember-check").forEach((c) => (c.checked = rememberMe()));
  setPlaceholder();
  renderAssistants();
  if (state.models.length) { renderModelButton(); renderImageModels(); }
  updateCostHint();
}
function setPlaceholder() {
  const hasImage = state.attachments.some((a) => a.kind === "image");
  $("input").placeholder = t(state.mode === "image" ? (hasImage ? "placeholderEdit" : "placeholderImage") : "placeholder");
}
function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  state.lang = lang;
  store.set("colmena.lang", lang);
  render();
}

function renderChatList() {
  const q = state.search.trim().toLowerCase();
  const chats = state.chats
    .filter((c) => (c.messages.length || c.id === state.currentId) &&
      (!q || (c.title || "").toLowerCase().includes(q) || c.messages.some((m) => (m.text || "").toLowerCase().includes(q))))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 864e5;
  const groups = [["today", (c) => c.updatedAt >= today], ["yesterday", (c) => c.updatedAt >= today - day], ["last7", (c) => c.updatedAt >= today - 7 * day], ["older", () => true]];
  const seen = new Set();
  let html = "";
  for (const [key, test] of groups) {
    const items = chats.filter((c) => !seen.has(c.id) && test(c));
    if (!items.length) continue;
    items.forEach((c) => seen.add(c.id));
    html += `<div class="side-label">${esc(t(key))}</div>` + items.map((c) => `<div class="chat-item${c.id === state.currentId ? " active" : ""}" data-chat="${esc(c.id)}" role="button" tabindex="0">
      <span class="ci-em">${esc(assistantOf(c).em)}</span><span class="t">${esc(c.title || t("untitled"))}</span>
      <button type="button" class="del" data-del="${esc(c.id)}" aria-label="Delete">✕</button></div>`).join("");
  }
  $("chatList").innerHTML = html;
  $("chatSearch").classList.toggle("hidden", state.chats.filter((c) => c.messages.length).length < 6 && !q);
}

function renderMessages() {
  const chat = currentChat();
  const box = $("messages");
  box.innerHTML = "";
  const a = assistantOf(chat);
  const empty = !chat || !chat.messages.length;
  $("welcome").classList.toggle("hidden", !(empty && a.id === "general"));
  const intro = $("intro");
  intro.classList.toggle("hidden", !(empty && a.id !== "general"));
  if (empty && a.id !== "general") {
    const share = BUILTIN.includes(a)
      ? `<p><button type="button" class="link-btn" data-share-use="${esc(a.id)}">${esc(t("shareThis"))}</button></p>` : "";
    intro.innerHTML = `<div class="intro-em">${esc(a.em)}</div><h2>${esc(loc(a.name))}</h2><p class="muted">${esc(loc(a.desc))}</p>${share}${startersHtml(startersOf(a))}`;
  }
  $("assistantChip").classList.toggle("hidden", a.id === "general" || !chat);
  $("assistantChip").textContent = `${a.em} ${loc(a.name)}`;
  updateCostHint();
  if (!chat) return;
  const lastUser = lastIndex(chat.messages, (m) => m.role === "user");
  chat.messages.forEach((m, i) => box.appendChild(messageEl(m, i, chat, lastUser)));
  scrollDown(true);
}

function messageEl(m, index, chat, lastUser) {
  const el = document.createElement("div");
  el.className = `msg ${m.role}`;
  if (m.role === "user") {
    const imgs = (m.images || []).map((src) => `<img src="${esc(src)}" alt="">`).join("");
    const files = (m.files || []).map((f) => `<span class="file-chip">📄 ${esc(f.name)}</span>`).join("");
    el.innerHTML = `<div class="bubble">${imgs}${files ? `<div class="file-row">${files}</div>` : ""}${esc(m.text || "")}</div>`;
    if (index === lastUser && !state.streaming) {
      const meta = document.createElement("div");
      meta.className = "meta";
      const b = document.createElement("button");
      b.type = "button"; b.textContent = `✎ ${t("edit")}`; b.onclick = editLast;
      meta.appendChild(b);
      el.appendChild(meta);
    }
    return el;
  }
  const body = document.createElement("div");
  body.className = "body";
  if (m.kind === "image") {
    body.innerHTML = m.url ? `<img class="gen-image" src="${esc(m.url)}" alt="${esc(m.prompt || t("imageAlt"))}" loading="lazy">` : "";
  } else {
    body.innerHTML = (m.reasoning ? `<details class="thinking"><summary>${esc(t("thinking"))}</summary>${esc(m.reasoning)}</details>` : "") + renderMarkdown(m.text || "");
    enhanceCode(body);
  }
  if (m.error) body.insertAdjacentHTML("beforeend", `<div class="error-box">${m.error}</div>`);
  el.appendChild(body);
  el.appendChild(metaEl(m, index, chat));
  return el;
}
function metaEl(m, index, chat) {
  const meta = document.createElement("div");
  meta.className = "meta";
  const btn = (txt, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.onclick = fn; meta.appendChild(b); return b; };
  const isLast = index === chat.messages.length - 1 && !state.streaming;
  if (m.kind === "image" && m.url) btn(`⇩ ${t("download")}`, () => downloadUrl(m.url, `colmena-${Date.now()}.jpg`));
  else if (m.text) {
    const c = btn(`⧉ ${t("copy")}`, () => copyText(m.text, c));
    btn(`🔊 ${t("listen")}`, (e) => speak(m.text, e.currentTarget));
  }
  if (isLast) btn(`↻ ${t("retry")}`, retryLast);
  if (isLast && m.kind !== "image") btn(`⇄ ${t("askOther")}`, () => openModelPicker("rerun"));
  const info = document.createElement("span");
  info.className = "cost";
  const mdl = modelById(m.model) || imageModelById(m.model);
  info.textContent = [mdl ? label(mdl) : m.model, m.cost != null ? `≈${fmtPollen(m.cost)} Pollen` : ""].filter(Boolean).join(" · ");
  meta.appendChild(info);
  return meta;
}
function scrollDown(force) {
  const s = $("scroll");
  if (force || s.scrollHeight - s.scrollTop - s.clientHeight < 180) s.scrollTop = s.scrollHeight;
}

// ================================================================== chats
function newChat(assistantId = "general", keepFocus = false) {
  if (state.streaming) return currentChat();
  let chat = currentChat();
  const a = assistantById(assistantId) || BUILTIN[0];
  if (!chat || chat.messages.length) {
    chat = { id: uid(), title: "", messages: [], updatedAt: Date.now() };
    state.chats.push(chat);
  }
  chat.assistant = a.id;
  chat.assistantSnap = a.custom ? { id: a.id, em: a.em, name: a.name, desc: a.desc, system: a.system, starters: a.starters } : null;
  state.currentId = chat.id;
  persist();
  renderChatList();
  renderMessages();
  closeSidebar();
  if (!keepFocus && !matchMedia("(pointer: coarse)").matches) $("input").focus();
  return chat;
}
function openChat(id) {
  if (state.streaming) return;
  state.currentId = id;
  persist();
  renderChatList();
  renderMessages();
  closeSidebar();
}
function deleteChat(id) {
  if (state.streaming || !confirm(t("confirmDelete"))) return;
  state.chats = state.chats.filter((c) => c.id !== id);
  if (state.currentId === id) state.currentId = null;
  persist();
  renderChatList();
  renderMessages();
}

// ================================================================== sending
function systemPrompt(chat) {
  const a = assistantOf(chat);
  const langName = LANG_NAMES[state.lang] || "English";
  let s = `You are Colmena, a helpful AI assistant. Reply in the language of the user's latest message (if unclear, use ${langName}). ` +
    `Be clear and well organized; use Markdown (headings, lists, tables, code blocks) when it helps. Today's date is ${new Date().toISOString().slice(0, 10)}.`;
  if (state.voiceMode) s += " The user is talking by voice and will hear your answer read aloud: answer in short, natural spoken sentences, without Markdown, lists, tables or emojis.";
  if (a.system) s += `\n\n${a.system.replace(/\{UI_LANG\}/g, langName)}`;
  return s;
}
function buildApiMessages(chat, history, model) {
  const vision = isVision(model);
  const msgs = [{ role: "system", content: systemPrompt(chat) }];
  const recent = history.filter((m) => m.role === "user" || m.kind === "image" || m.text).slice(-state.memory);
  recent.forEach((m, i) => {
    if (m.role === "user") {
      let text = m.text || "";
      for (const f of m.files || []) text += `\n\n<file name="${f.name.replace(/"/g, "'")}">\n${f.text}\n</file>`;
      // Images are re-sent only for recent turns: follow-ups usually concern the latest picture.
      const withImages = vision && m.images && m.images.length && i >= recent.length - 6;
      if (!vision && m.images && m.images.length) text += `\n\n[${m.images.length} image(s) attached, but the current model can't see images]`;
      if (withImages) {
        msgs.push({ role: "user", content: [{ type: "text", text: text || "What is in this image?" }, ...m.images.map((url) => ({ type: "image_url", image_url: { url } }))] });
      } else msgs.push({ role: "user", content: text || "(empty message)" });
    } else if (m.kind === "image") {
      if (m.url) msgs.push({ role: "assistant", content: `[I generated an image for: "${m.prompt}"]` });
    } else msgs.push({ role: "assistant", content: m.text });
  });
  return msgs;
}
function ensureVisionModel() {
  const m = modelById(state.modelId);
  if (isVision(m)) return;
  const alt = firstAvailable(PICKS.flatMap(([, ids]) => ids).filter((id) => isVision(modelById(id)))) || state.models.find((x) => isVision(x) && !isDown(x));
  if (!alt) return;
  toast(t("noVision", { model: label(m) || state.modelId, other: label(alt) }));
  setModel(alt.name);
}
function ensureEditModel() {
  const m = imageModelById(state.imageModelId);
  if (canEdit(m)) return;
  const alt = EDIT_MODELS.map(imageModelById).find((x) => canEdit(x)) || state.imageModels.find(canEdit);
  if (!alt) return;
  toast(t("noEdit", { model: label(m) || state.imageModelId, other: label(alt) }));
  setImageModel(alt.name);
}

async function send(textOverride) {
  if (state.streaming || !state.token) return;
  const text = (typeof textOverride === "string" ? textOverride : $("input").value).trim();
  if (!text && !state.attachments.length) return;
  if (state.mode === "image" && !text) { toast(t("placeholderImage")); return; }
  // Right after sign-in the model list may still be loading; wait for it so the right model is used.
  if (!state.models.length) await Promise.race([modelsReady, new Promise((r) => setTimeout(r, 8000))]);
  if (state.streaming) return;
  const chat = currentChat() || newChat("general", true);
  const images = state.attachments.filter((a) => a.kind === "image").map((a) => a.dataUrl);
  const files = state.attachments.filter((a) => a.kind === "file").map((a) => ({ name: a.name, text: a.text }));
  if (state.mode === "chat" && images.length) ensureVisionModel();
  if (state.mode === "image" && images.length) ensureEditModel();
  chat.messages.push({ role: "user", text, images, files, mode: state.mode });
  if (!chat.title) chat.title = (text || (files[0] && files[0].name) || "🖼️").replace(/\s+/g, " ").slice(0, 60);
  chat.updatedAt = Date.now();
  if (typeof textOverride !== "string") { $("input").value = ""; autoGrow(); }
  clearAttachments();
  persist();
  renderChatList();
  renderMessages();
  if (state.mode === "image") await generateImage(chat, text, images);
  else await streamReply(chat);
}

function startPending(chat, msg) {
  chat.messages.push(msg);
  const el = messageEl(msg, chat.messages.length - 1, chat, -1);
  const body = el.querySelector(".body");
  body.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
  el.querySelector(".meta").replaceChildren();
  $("messages").appendChild(el);
  $("welcome").classList.add("hidden");
  $("intro").classList.add("hidden");
  scrollDown(true);
  return body;
}
function finishPending(chat) {
  chat.updatedAt = Date.now();
  setStreaming(null);
  persist();
  if (state.token && currentChat() === chat) { renderMessages(); renderChatList(); }
  if (state.token) refreshBalance();
}

async function streamReply(chat, opts = {}) {
  const model = modelById(opts.model || state.modelId);
  const lastUser = lastIndex(chat.messages, (m) => m.role === "user");
  const history = chat.messages.slice(0, lastUser + 1);
  const msg = { role: "assistant", text: "", model: model ? model.name : opts.model || state.modelId };
  const body = startPending(chat, msg);
  const ctrl = new AbortController();
  setStreaming(ctrl);
  let usage = null, raf = 0, aborted = false;
  const paint = () => {
    raf = 0;
    body.innerHTML = (msg.reasoning ? `<details class="thinking" open><summary>${esc(t("thinking"))}…</summary>${esc(msg.reasoning)}</details>` : "") +
      (msg.text ? renderMarkdown(msg.text) : `<span class="typing"><i></i><i></i><i></i></span>`);
    scrollDown();
  };
  try {
    const payload = { model: msg.model, messages: buildApiMessages(chat, history, model), stream: true, stream_options: { include_usage: true } };
    if (model && (model.supported_parameters || []).includes("reasoning_effort")) payload.reasoning_effort = "low";
    const res = await api("/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctrl.signal });
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        let j;
        try { j = JSON.parse(data); } catch { continue; }
        if (j.error) throw new ApiError(Number(j.error.status || j.status) || 502, j.error.message || String(j.error), j.error.code);
        if (j.usage) usage = j.usage;
        const d = j.choices && j.choices[0] && j.choices[0].delta;
        if (!d) continue;
        if (typeof d.content === "string") msg.text += d.content;
        const r = d.reasoning_content || d.reasoning;
        if (typeof r === "string" && r) msg.reasoning = (msg.reasoning || "") + r;
        if (!raf) raf = requestAnimationFrame(paint);
      }
    }
  } catch (e) {
    if (e.name === "AbortError") { aborted = true; msg.text = msg.text ? `${msg.text}\n\n${t("stopped")}` : t("stopped"); }
    else msg.error = errorHtml(e, msg.model);
  } finally {
    if (raf) cancelAnimationFrame(raf);
    if (!msg.text && !msg.error && !aborted) msg.error = esc(t("errEmpty"));
    msg.cost = usageCost(model, usage);
    finishPending(chat);
  }
  if (!msg.error && !aborted && msg.text && (state.voiceMode || state.autoRead)) speak(msg.text);
}

async function generateImage(chat, prompt, images = []) {
  const model = imageModelById(state.imageModelId);
  const msg = { role: "assistant", kind: "image", prompt, model: state.imageModelId, edit: images.length > 0 };
  startPending(chat, msg);
  const ctrl = new AbortController();
  setStreaming(ctrl);
  try {
    const body = { model: state.imageModelId, prompt, size: $("imageSize").value, response_format: "url" };
    let path = "/v1/images/generations";
    if (images.length) { path = "/v1/images/edits"; body.image = images.map((url) => ({ image_url: url })); }
    const res = await api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    const j = await res.json();
    const d = j.data && j.data[0];
    if (!d || !(d.url || d.b64_json)) throw new ApiError(502, "no image returned");
    msg.url = d.url || `data:image/jpeg;base64,${d.b64_json}`;
    msg.cost = imageUsageCost(model, j.usage);
  } catch (e) {
    if (e.name === "AbortError") msg.error = esc(t("stopped"));
    else msg.error = errorHtml(e);
  } finally {
    finishPending(chat);
  }
}

function retryLast() {
  const chat = currentChat();
  if (!chat || state.streaming) return;
  while (chat.messages.length && chat.messages[chat.messages.length - 1].role === "assistant") chat.messages.pop();
  const last = chat.messages[chat.messages.length - 1];
  if (!last) return;
  persist();
  renderMessages();
  if (last.mode === "image") {
    if (last.images && last.images.length) ensureEditModel();
    generateImage(chat, last.text, last.images || []);
  } else {
    if (last.images && last.images.length) ensureVisionModel();
    streamReply(chat);
  }
}
function askOther(modelId) {
  const chat = currentChat();
  if (!chat || state.streaming) return;
  streamReply(chat, { model: modelId });
}
function editLast() {
  const chat = currentChat();
  if (!chat || state.streaming) return;
  const i = lastIndex(chat.messages, (m) => m.role === "user");
  if (i < 0) return;
  const m = chat.messages[i];
  chat.messages.splice(i);
  setMode(m.mode === "image" ? "image" : "chat");
  state.attachments = [
    ...(m.images || []).map((dataUrl, n) => ({ kind: "image", name: `image-${n + 1}`, dataUrl })),
    ...(m.files || []).map((f) => ({ kind: "file", name: f.name, text: f.text })),
  ];
  renderAttachments();
  $("input").value = m.text || "";
  autoGrow();
  persist();
  renderMessages();
  $("input").focus();
}
function setStreaming(ctrl) {
  state.streaming = ctrl;
  $("sendBtn").classList.toggle("hidden", !!ctrl);
  $("stopBtn").classList.toggle("hidden", !ctrl);
}

// ================================================================== attachments & files
function clearAttachments() { state.attachments = []; renderAttachments(); }
function renderAttachments() {
  const box = $("attachPreview");
  box.classList.toggle("hidden", !state.attachments.length);
  box.innerHTML = state.attachments.map((a, i) => (a.kind === "image"
    ? `<div class="thumb"><img src="${a.dataUrl}" alt=""><button type="button" data-unattach="${i}" aria-label="Remove">✕</button></div>`
    : `<div class="thumb file"><span>📄 ${esc(a.name)}</span><small>~${fmtCount(a.text.length / 4)} tokens</small><button type="button" data-unattach="${i}" aria-label="Remove">✕</button></div>`)).join("");
  setPlaceholder();
  updateCostHint();
}
const scriptCache = {};
function loadScript(src, integrity) {
  if (!scriptCache[src]) {
    scriptCache[src] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src; s.integrity = integrity; s.crossOrigin = "anonymous"; s.referrerPolicy = "no-referrer";
      s.onload = resolve;
      s.onerror = () => { delete scriptCache[src]; reject(new Error(`load ${src}`)); };
      document.head.appendChild(s);
    });
  }
  return scriptCache[src];
}
async function readPdf(file) {
  await loadScript(CDN.pdf.src, CDN.pdf.sri);
  const lib = window.pdfjsLib;
  lib.GlobalWorkerOptions.workerSrc = CDN.pdf.worker;
  const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  let out = "";
  for (let p = 1; p <= pdf.numPages && out.length < MAX_FILE_CHARS; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    out += content.items.map((it) => it.str + (it.hasEOL ? "\n" : " ")).join("") + "\n\n";
  }
  return out;
}
async function readDocx(file) {
  await loadScript(CDN.docx.src, CDN.docx.sri);
  const r = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return r.value || "";
}
function resizeImage(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("image")); };
    img.src = URL.createObjectURL(file);
  });
}
async function addFiles(fileList) {
  for (const f of fileList) {
    if (state.attachments.length >= MAX_ATTACH) break;
    if (f.size > MAX_FILE_MB * 1048576) { toast(t("fileTooBig", { name: f.name, mb: MAX_FILE_MB })); continue; }
    if (f.type.startsWith("image/")) {
      try { state.attachments.push({ kind: "image", name: f.name, dataUrl: await resizeImage(f) }); } catch { toast(t("fileUnsupported", { name: f.name })); }
      renderAttachments();
      continue;
    }
    if (state.mode === "image") { toast(t("fileUnsupported", { name: f.name })); continue; }
    toast(t("fileReading", { name: f.name }));
    try {
      let text;
      if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) text = await readPdf(f);
      else if (/\.docx$/i.test(f.name) || f.type.includes("wordprocessingml")) text = await readDocx(f);
      else if (f.type.startsWith("text/") || f.type === "application/json" || TEXT_EXT.test(f.name)) text = await f.text();
      else { toast(t("fileUnsupported", { name: f.name })); continue; }
      text = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (!text) { toast(t("fileEmpty", { name: f.name })); continue; }
      if (text.length > MAX_FILE_CHARS) { text = text.slice(0, MAX_FILE_CHARS); toast(t("fileTruncated", { name: f.name })); } else hideToast();
      state.attachments.push({ kind: "file", name: f.name, text });
    } catch { toast(t("fileUnsupported", { name: f.name })); }
    renderAttachments();
  }
}

// ================================================================== voice
function stopAudio() {
  if (state.audio) { state.audio.pause(); if (state.audio.onended) state.audio.onended(); state.audio = null; }
}
async function speak(text, btn) {
  if (btn && state.audio && state.audio.btn === btn) { stopAudio(); return; }
  stopAudio();
  const clean = text.replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>|~]/g, "").replace(/\n{2,}/g, "\n").trim().slice(0, 3800);
  if (!clean) return;
  const reset = () => { if (btn) btn.textContent = `🔊 ${t("listen")}`; };
  try {
    if (btn) btn.textContent = "…";
    const res = await api("/v1/audio/speech", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: TTS_MODEL, input: clean, voice: state.voice }) });
    const url = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    audio.btn = btn;
    state.audio = audio;
    if (btn) btn.textContent = `■ ${t("stopAudio")}`;
    audio.onended = () => { if (state.audio === audio) state.audio = null; reset(); URL.revokeObjectURL(url); };
    await audio.play();
    refreshBalance();
  } catch (e) {
    state.audio = null;
    reset();
    if (e.name !== "NotAllowedError") toast(e.status != null ? errorText(e) : e.message);
  }
}
async function toggleMic() {
  if (state.recorder) { state.recorder.stop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast(t("micUnsupported")); return; }
  stopAudio();
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { toast(t("micDenied")); return; }
  const chunks = [];
  const rec = new MediaRecorder(stream);
  state.recorder = rec;
  $("micBtn").classList.add("recording");
  toast(t("micListening"));
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = async () => {
    stream.getTracks().forEach((tr) => tr.stop());
    state.recorder = null;
    $("micBtn").classList.remove("recording");
    const type = rec.mimeType || "audio/webm";
    const blob = new Blob(chunks, { type });
    if (blob.size < 1200) { hideToast(); return; }
    toast(t("transcribing"));
    try {
      const fd = new FormData();
      fd.append("file", blob, `voice.${type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm"}`);
      fd.append("model", STT_MODEL);
      const j = await (await api("/v1/audio/transcriptions", { method: "POST", body: fd })).json();
      const said = (j.text || "").trim();
      hideToast();
      if (!said) return;
      if (state.voiceMode && state.mode === "chat") { send(said); return; }
      const box = $("input");
      box.value = (box.value ? `${box.value} ` : "") + said;
      autoGrow();
      box.focus();
    } catch (e) { toast(e.status != null ? errorText(e) : e.message); }
  };
  rec.start();
}
function toggleVoiceMode() {
  state.voiceMode = !state.voiceMode;
  $("voiceBtn").classList.toggle("on", state.voiceMode);
  $("voiceBtn").setAttribute("aria-pressed", String(state.voiceMode));
  if (!state.voiceMode) stopAudio();
  toast(t(state.voiceMode ? "voiceOn" : "voiceOff"));
}

// ================================================================== misc UI
let toastTimer = 0;
function toast(msg, ms = 4200) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, ms);
}
function hideToast() { $("toast").classList.add("hidden"); }
function autoGrow() { const el = $("input"); el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 220)}px`; }
function openSidebar() { $("app").classList.add("side-open"); }
function closeSidebar() { $("app").classList.remove("side-open"); }
function openModal(id) { closeModals(); $(id).classList.remove("hidden"); }
function closeModals() { document.querySelectorAll(".modal").forEach((m) => m.classList.add("hidden")); }
function setMode(mode) {
  state.mode = mode;
  $("modeChat").classList.toggle("active", mode === "chat");
  $("modeImage").classList.toggle("active", mode === "image");
  $("modeChat").setAttribute("aria-selected", String(mode === "chat"));
  $("modeImage").setAttribute("aria-selected", String(mode === "image"));
  $("imageOpts").classList.toggle("hidden", mode !== "image");
  if (mode === "image") {
    const dropped = state.attachments.filter((a) => a.kind === "file").length;
    state.attachments = state.attachments.filter((a) => a.kind === "image");
    if (dropped) renderAttachments();
  }
  setPlaceholder();
  updateCostHint();
}
function cycleTheme() {
  const cur = document.documentElement.dataset.theme || "auto";
  const next = cur === "auto" ? "dark" : cur === "dark" ? "light" : "auto";
  if (next === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = next;
  store.set("colmena.theme", next);
}
function exportChat() {
  const chat = currentChat();
  if (!chat || !chat.messages.length) { toast(t("exportEmpty")); return; }
  const you = { es: "Tú", pt: "Você", fr: "Vous", id: "Kamu" }[state.lang] || "You";
  const md = [`# ${chat.title || t("untitled")}`, ""].concat(chat.messages.map((m) => {
    if (m.role === "user") return `**${you}:** ${m.text || ""}${(m.files || []).map((f) => `\n\n📄 ${f.name}`).join("")}`;
    const who = `**Colmena${m.model ? ` (${label(modelById(m.model) || imageModelById(m.model)) || m.model})` : ""}:**`;
    if (m.kind === "image") return `${who} ![${m.prompt || ""}](${m.url && !m.url.startsWith("data:") ? m.url : ""})`;
    return `${who} ${m.text || ""}`;
  })).join("\n\n");
  const name = `${(chat.title || "chat").replace(/[^\p{L}\p{N} _-]+/gu, "").trim().slice(0, 40) || "chat"}.md`;
  downloadUrl(URL.createObjectURL(new Blob([md], { type: "text/markdown" })), name);
}
async function downloadUrl(url, name) {
  try {
    let href = url;
    if (!url.startsWith("blob:") && !url.startsWith("data:")) href = URL.createObjectURL(await (await fetch(url)).blob());
    const a = document.createElement("a");
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  } catch { window.open(url, "_blank", "noopener"); }
}
// Starters that end with ":" need the user's text; starters with 📎 need a file; the rest are sent as-is.
function runStarter(text) {
  setMode("chat");
  const input = $("input");
  if (text.includes("📎")) {
    input.value = `${text.replace(/\s*[—–-]\s*[^—–-]*📎.*$/u, "").trim()} `;
    autoGrow();
    $("fileInput").click();
    input.focus();
    return;
  }
  if (/[:：]\s*$/.test(text)) {
    input.value = `${text}\n`;
    autoGrow();
    input.focus();
    return;
  }
  send(text);
}

// ================================================================== events
document.addEventListener("click", (e) => {
  const act = e.target.closest("[data-action]");
  if (act) {
    const a = act.dataset.action;
    if (a === "sign-in") signIn();
    else if (a === "sign-out") signOut();
    else if (a === "toggle-theme") cycleTheme();
    else if (a === "new-chat") newChat();
    else if (a === "open-sidebar") openSidebar();
    else if (a === "close-sidebar") closeSidebar();
    else if (a === "open-models") openModelPicker("select");
    else if (a === "open-settings") openModal("settingsModal");
    else if (a === "close-modal") closeModals();
    else if (a === "mode-chat") setMode("chat");
    else if (a === "mode-image") setMode("image");
    else if (a === "attach") $("fileInput").click();
    else if (a === "mic") toggleMic();
    else if (a === "voice-mode") toggleVoiceMode();
    else if (a === "stop") { if (state.streaming) state.streaming.abort(); }
    else if (a === "export-chat") exportChat();
    else if (a === "new-assistant") openEditor(null);
    else if (a === "delete-assistant") deleteAssistant();
    else if (a === "share-assistant") shareAssistant();
    else if (a === "import-assistant") importAssistant();
    else if (a === "install-app") installApp();
    else if (a === "clear-chats") {
      if (!state.streaming && confirm(t("confirmClear"))) { state.chats = []; state.currentId = null; persist(); closeModals(); render(); }
    }
    return;
  }
  const edit = e.target.closest("[data-edit-assistant]");
  if (edit) { e.stopPropagation(); openEditor(edit.dataset.editAssistant); return; }
  const del = e.target.closest("[data-del]");
  if (del) { e.stopPropagation(); deleteChat(del.dataset.del); return; }
  const chatItem = e.target.closest("[data-chat]");
  if (chatItem) { openChat(chatItem.dataset.chat); return; }
  const asst = e.target.closest("[data-assistant]");
  if (asst) { newChat(asst.dataset.assistant); return; }
  const starter = e.target.closest("[data-starter]");
  if (starter) { runStarter(starter.dataset.starter); return; }
  const mrow = e.target.closest("[data-model]");
  if (mrow) {
    closeModals();
    if (state.picker === "rerun") askOther(mrow.dataset.model);
    else setModel(mrow.dataset.model);
    return;
  }
  const shareBtn = e.target.closest("[data-share-use]");
  if (shareBtn) { shareUse(shareBtn.dataset.shareUse); return; }
  const sw = e.target.closest("[data-switch-model]");
  if (sw) { setModel(sw.dataset.switchModel); retryLast(); return; }
  const un = e.target.closest("[data-unattach]");
  if (un) { state.attachments.splice(Number(un.dataset.unattach), 1); renderAttachments(); return; }
  if (e.target.classList.contains("modal")) closeModals();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeModals(); closeSidebar(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && state.token) { e.preventDefault(); openModelPicker("select"); }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[role=button]")) { e.preventDefault(); e.target.click(); }
});
document.addEventListener("change", (e) => {
  if (e.target.matches(".lang-select")) setLang(e.target.value);
  if (e.target.matches(".remember-check")) {
    store.set("colmena.remember", e.target.checked ? "1" : "0");
    document.querySelectorAll(".remember-check").forEach((c) => (c.checked = e.target.checked));
    if (state.token) setToken(state.token);
  }
});
$("composer").addEventListener("submit", (e) => { e.preventDefault(); send(); });
$("input").addEventListener("input", autoGrow);
$("input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !matchMedia("(pointer: coarse)").matches) { e.preventDefault(); send(); }
});
$("input").addEventListener("paste", (e) => {
  const files = [...((e.clipboardData && e.clipboardData.files) || [])];
  if (files.length) { e.preventDefault(); addFiles(files); }
});
$("fileInput").addEventListener("change", (e) => { addFiles([...e.target.files]); e.target.value = ""; });
document.addEventListener("dragover", (e) => { if (state.token) e.preventDefault(); });
document.addEventListener("drop", (e) => {
  if (!state.token || !e.dataTransfer || !e.dataTransfer.files.length) return;
  e.preventDefault();
  addFiles([...e.dataTransfer.files]);
});
$("modelSearch").addEventListener("input", renderModelList);
$("filterVision").addEventListener("change", renderModelList);
$("filterCommunity").addEventListener("change", renderModelList);
$("chatSearch").addEventListener("input", (e) => { state.search = e.target.value; renderChatList(); });
$("imageModel").addEventListener("change", (e) => setImageModel(e.target.value));
$("imageSize").addEventListener("change", updateCostHint);
$("voiceSelect").addEventListener("change", (e) => { state.voice = e.target.value; store.set("colmena.voice", state.voice); });
$("memorySelect").addEventListener("change", (e) => { state.memory = Number(e.target.value); store.set("colmena.memory", String(state.memory)); });
$("autoRead").addEventListener("change", (e) => { state.autoRead = e.target.checked; store.set("colmena.autoRead", state.autoRead ? "1" : "0"); });
$("editorForm").addEventListener("submit", (e) => { e.preventDefault(); saveEditor(); });
document.querySelectorAll(".preview").forEach((img) => {
  // The image may have failed before this script ran, so check both ways.
  if (img.complete && !img.naturalWidth) img.classList.add("hidden");
  img.addEventListener("error", () => img.classList.add("hidden"));
});

// Android/desktop Chrome offer installation through this event; show our own button for it.
let installEvent = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvent = e; $("installBtn").classList.remove("hidden"); });
window.addEventListener("appinstalled", () => { installEvent = null; $("installBtn").classList.add("hidden"); });
function installApp() {
  if (!installEvent) return;
  installEvent.prompt();
  installEvent.userChoice.finally(() => { installEvent = null; $("installBtn").classList.add("hidden"); });
}

// ================================================================== boot
let modelsReady = Promise.resolve();
(async function boot() {
  const theme = store.get("colmena.theme");
  if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
  $("voiceSelect").value = state.voice;
  $("memorySelect").value = String(state.memory);
  $("autoRead").checked = state.autoRead;
  readLinks();
  await handleRedirect();
  if (!state.token) render(); // show the landing page right away; chats load in the background
  await loadData();
  render();
  if (state.token) {
    loadAccount();
    modelsReady = loadModels().catch((e) => toast(errorText(e)));
    await modelsReady;
    if (state.pendingImport) showImport();
    else if (state.pendingUse) openPendingUse();
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || IS_LOCAL)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
})();
