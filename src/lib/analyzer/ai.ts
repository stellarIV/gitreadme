import { RepoMetadata } from "./types";
import { PreparedAnalysisContext } from "./mapReduce";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "./prompt";

export interface AIProviderConfig {
  provider: "gemini" | "openai" | "anthropic" | "ollama" | "auto";
  apiKey?: string;
  model?: string;
  ollamaBaseUrl?: string;
}

function cleanKey(key?: string | null): string | undefined {
  if (!key) return undefined;
  const trimmed = key.trim();
  if (
    !trimmed ||
    trimmed.toUpperCase() === "NONE" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed.toLowerCase() === "null" ||
    trimmed === '""' ||
    trimmed === "''"
  ) {
    return undefined;
  }
  return trimmed;
}

export async function runAIAnalysis(
  metadata: RepoMetadata,
  context: PreparedAnalysisContext,
  mode: "professional" | "roast" = "professional",
  config?: AIProviderConfig
): Promise<Record<string, unknown> | null> {
  const requestedProvider = config?.provider || "auto";
  const geminiKey = cleanKey(config?.apiKey) || cleanKey(process.env.GEMINI_API_KEY);
  const openaiKey = cleanKey(config?.apiKey) || cleanKey(process.env.OPENAI_API_KEY);
  const anthropicKey = cleanKey(config?.apiKey) || cleanKey(process.env.ANTHROPIC_API_KEY);
  const ollamaUrl = config?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  // If user explicitly asked for anthropic, but anthropic is NONE or unconfigured:
  let provider = requestedProvider;
  if (requestedProvider === "anthropic" && !anthropicKey) {
    if (geminiKey) {
      console.warn("Anthropic Claude API key is set to NONE or not provided. Falling back to Google Gemini.");
      provider = "gemini";
    } else if (openaiKey) {
      console.warn("Anthropic Claude API key is set to NONE or not provided. Falling back to OpenAI.");
      provider = "openai";
    } else {
      console.warn("Anthropic Claude API key is set to NONE or not provided. Falling back to heuristic synthesis.");
      return null;
    }
  }

  const systemPrompt = buildAnalysisSystemPrompt(mode);
  const userPrompt = buildAnalysisUserPrompt(metadata, context, mode);

  // 1. Try Gemini
  if ((provider === "gemini" || provider === "auto") && geminiKey) {
    const candidateModels = config?.model
      ? [config.model]
      : ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.7-flash"];

    for (const model of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: mode === "roast" ? 0.75 : 0.25,
                  maxOutputTokens: 8192,
                },
              }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return parseCleanJson(text);
            }
          } else {
            console.warn(`Gemini model ${model} (attempt ${attempt}) returned HTTP ${res.status}`);
            if ((res.status === 503 || res.status === 429) && attempt === 1) {
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
          }
        } catch (e) {
          console.warn(`Gemini call error on model ${model} (attempt ${attempt}):`, e);
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
        }
        break;
      }
    }
  }

  // 2. Try OpenAI
  if ((provider === "openai" || provider === "auto") && openaiKey) {
    try {
      const model = config?.model || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: mode === "roast" ? 0.7 : 0.2,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return parseCleanJson(content);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn(`OpenAI call returned HTTP ${res.status}:`, err?.error?.message || res.statusText);
      }
    } catch (e) {
      console.warn("OpenAI call failed:", e);
    }
  }

  // 3. Try Anthropic (only if key is valid and not NONE)
  if ((provider === "anthropic" || provider === "auto") && anthropicKey) {
    try {
      const model = config?.model || "claude-3-5-sonnet-20241022";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          temperature: mode === "roast" ? 0.7 : 0.2,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.content?.[0]?.text;
        if (content) {
          return parseCleanJson(content);
        }
      }
    } catch (e) {
      console.warn("Anthropic call failed:", e);
    }
  }

  // 4. Try Ollama (if provider explicitly set to ollama)
  if (provider === "ollama") {
    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config?.model || "llama3",
          system: systemPrompt,
          prompt: userPrompt,
          format: "json",
          stream: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          return parseCleanJson(data.response);
        }
      }
    } catch (e) {
      console.warn("Ollama call failed:", e);
    }
  }

  return null;
}

function parseCleanJson(raw: string): Record<string, unknown> {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw new Error("Failed to parse JSON response from AI provider");
  }
}
