// DAVID_AI — Vercel backend
// Put this file at: api/index.js
// Set OPENAI_API_KEY in Vercel Project Settings -> Environment Variables.
// The browser never receives the API key.

const MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";
const MAX_BODY = 90000;
const rate = new Map();

const SYSTEM = `You are DAVID_AI, an engineering prototype assistant.
Return JSON only. Never return markdown fences.
You help turn natural-language requests into conceptual engineering prototype actions.
Never claim a physical circuit or machine has been experimentally verified.
Preserve existing components unless the user explicitly asks to remove them.
For split/analyze requests, identify existing component names and return only names that exist in the supplied model.
For general commands, return concise actions using types add, remove, move, rotate, connect, split, run, check, showall, color.
`;

function send(res, status, body) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  res.end(JSON.stringify(body));
}

function allowed(req) {
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const old = rate.get(ip);
  if (!old || now - old.t > 60000) { rate.set(ip, {t: now, n: 1}); return true; }
  old.n++;
  return old.n <= 20;
}

async function readBody(req) {
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > MAX_BODY) {
        reject(Object.assign(new Error("Request too large"), {status:413}));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); }
      catch { reject(Object.assign(new Error("Invalid JSON"), {status:400})); }
    });
    req.on("error", reject);
  });
}

function extractJson(text) {
  if (typeof text !== "string") return null;
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function openAI(input) {
  if (!process.env.OPENAI_API_KEY) {
    const e = new Error("OPENAI_API_KEY is not configured on the backend.");
    e.status = 503;
    throw e;
  }

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: SYSTEM,
      input,
      max_output_tokens: 1800
    })
  });

  const raw = await r.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = {}; }
  if (!r.ok) {
    const msg = data?.error?.message || `OpenAI request failed (${r.status})`;
    const e = new Error(msg);
    e.status = r.status >= 500 ? 502 : r.status;
    throw e;
  }
  if (data?.output_text) return data.output_text;
  const chunks=[];
  for (const item of (data?.output || [])) {
    for (const part of (item?.content || [])) {
      if (part?.type === "output_text" && typeof part.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("\n");
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return send(res, 200, {ok:true, configured:Boolean(process.env.OPENAI_API_KEY), model:MODEL});
    }
    if (req.method !== "POST") return send(res, 405, {error:"POST required"});
    if (!allowed(req)) return send(res, 429, {error:"Too many requests. Try again shortly."});

    const body = await readBody(req);
    const path = String(req.url || "").split("?")[0];

    if (path.endsWith("/analyze-split")) {
      const model = body.model || {};
      const components = Array.isArray(model.components) ? model.components : [];
      if (!components.length) return send(res, 400, {error:"There are no components to analyze."});
      const names = components.map(c => String(c.name || "")).filter(Boolean);
      const prompt = `Analyze this prototype and split its existing components into separately editable parts.\nExisting component names:\n${names.join("\n")}\n\nReturn exactly JSON with this shape: {"summary":"...","parts":[{"name":"EXACT EXISTING NAME","x":0,"y":0,"rotation":0}]}\nOnly use names from the supplied list. Do not invent components.`;
      const text = await openAI(prompt);
      const out = extractJson(text);
      if (!out || !Array.isArray(out.parts)) throw Object.assign(new Error("AI returned an invalid split result."), {status:502});
      const valid = new Set(names.map(x => x.toLowerCase()));
      out.parts = out.parts.filter(p => valid.has(String(p.name || "").toLowerCase()));
      return send(res, 200, {summary:String(out.summary || "Analysis completed."), parts:out.parts});
    }

    if (path.endsWith("/command")) {
      const message = String(body.message || "").slice(0,6000);
      if (!message.trim()) return send(res,400,{error:"message is required"});
      const text = await openAI(message);
      const out = extractJson(text) || {reply:text,actions:[]};
      return send(res,200,out);
    }

    return send(res,404,{error:"Unknown API route"});
  } catch (e) {
    console.error(e);
    return send(res, Number(e.status)||500, {error:e.message || "DAVID backend error"});
  }
}
