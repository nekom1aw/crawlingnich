const fs = require("fs");
const path = require("path");

function loadRuntimeEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return false;

  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }

  return true;
}

function keyInfo(apiKey = "") {
  return {
    present: Boolean(apiKey),
    prefix: apiKey ? `${apiKey.slice(0, 10)}...` : null,
    length: apiKey.length,
  };
}

async function readRequestJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function extractChatText(data = {}) {
  return (data.choices || [])
    .map((choice) => choice?.message?.content || choice?.delta?.content || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function testModels({ baseUrl, apiKey, model, timeoutMs }) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    const modelIds = (data.data || []).map((item) => item.id).filter(Boolean);

    return {
      ok: response.ok,
      status: response.status,
      ms: Date.now() - startedAt,
      modelFound: modelIds.includes(model),
      glmModels: modelIds.filter((id) => /glm|z-ai/i.test(id)).slice(0, 20),
      error: response.ok ? "" : (data.error?.message || data.detail || data.message || text.slice(0, 300)),
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      ms: Date.now() - startedAt,
      modelFound: false,
      glmModels: [],
      error: err.name === "AbortError" ? `models timeout ${timeoutMs}ms` : err.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function testCompletion({ baseUrl, apiKey, model, prompt, timeoutMs, maxTokens, stream }) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: stream ? "text/event-stream" : "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        top_p: 1,
        max_tokens: maxTokens,
        seed: 42,
        stream,
      }),
      signal: controller.signal,
    });

    if (!stream) {
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      return {
        ok: response.ok,
        status: response.status,
        ms: Date.now() - startedAt,
        firstChunkMs: null,
        text: extractChatText(data),
        error: response.ok ? "" : (data.error?.message || data.detail || data.message || text.slice(0, 300)),
      };
    }

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        status: response.status,
        ms: Date.now() - startedAt,
        firstChunkMs: null,
        text: "",
        error: text.slice(0, 300),
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let firstChunkMs = null;
    let output = "";

    while (Date.now() - startedAt < timeoutMs) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!firstChunkMs) firstChunkMs = Date.now() - startedAt;
      const chunkText = decoder.decode(value, { stream: true });

      for (const line of chunkText.split(/\r?\n/)) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const data = JSON.parse(raw);
          output += data.choices?.[0]?.delta?.content || "";
        } catch {}
      }

      if (output.length >= 400) break;
    }

    return {
      ok: Boolean(output),
      status: response.status,
      ms: Date.now() - startedAt,
      firstChunkMs,
      text: output.trim(),
      error: output ? "" : `stream timeout/no output ${timeoutMs}ms`,
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      ms: Date.now() - startedAt,
      firstChunkMs: null,
      text: "",
      error: err.name === "AbortError" ? `completion timeout ${timeoutMs}ms` : err.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runGlmHealth(request, body = {}) {
  loadRuntimeEnvFile();

  const url = new URL(request.url);
  const apiKey = process.env.NVIDIA_API_KEY || process.env.NVAPI_KEY || "";
  const baseUrl = (body.baseUrl || process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
  const model = body.model || url.searchParams.get("model") || process.env.NVIDIA_MODEL || "z-ai/glm-5.2";
  const prompt = body.prompt || url.searchParams.get("prompt") || "Jawab singkat dalam bahasa Indonesia: GLM aktif atau tidak?";
  const timeoutMs = Number(body.timeoutMs || url.searchParams.get("timeoutMs") || 30000);
  const maxTokens = Number(body.maxTokens || url.searchParams.get("maxTokens") || 120);
  const stream = String(body.stream ?? url.searchParams.get("stream") ?? "true") !== "false";
  const startedAt = Date.now();

  if (!apiKey) {
    return Response.json({
      ok: false,
      error: "NVIDIA_API_KEY/NVAPI_KEY belum tersedia di server.",
      envLocalFile: fs.existsSync(path.join(process.cwd(), ".env.local")),
      key: keyInfo(apiKey),
      model,
      baseUrl,
    }, { status: 500 });
  }

  const models = await testModels({ baseUrl, apiKey, model, timeoutMs: Math.min(timeoutMs, 15000) });
  const completion = await testCompletion({ baseUrl, apiKey, model, prompt, timeoutMs, maxTokens, stream });

  return Response.json({
    ok: Boolean(models.ok && completion.ok),
    checkedAt: new Date().toISOString(),
    totalMs: Date.now() - startedAt,
    baseUrl,
    model,
    key: keyInfo(apiKey),
    request: {
      stream,
      timeoutMs,
      maxTokens,
      promptLength: prompt.length,
    },
    models,
    completion,
  });
}

async function GET(request) {
  return runGlmHealth(request, {});
}

async function POST(request) {
  const body = await readRequestJson(request);
  return runGlmHealth(request, body);
}

module.exports = { GET, POST };
