import { RepoMetadata } from "./types";
import { PreparedAnalysisContext } from "./mapReduce";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "./prompt";

export interface AIProviderConfig {
  provider: "gemini" | "openai" | "anthropic" | "ollama" | "auto";
  apiKey?: string;
  model?: string;
  ollamaBaseUrl?: string;
}

export async function runAIAnalysis(
  metadata: RepoMetadata,
  context: PreparedAnalysisContext,
  mode: "professional" | "roast" = "professional",
  config?: AIProviderConfig
): Promise<Record<string, unknown> | null> {
  const provider = config?.provider || "auto";
  const geminiKey = config?.apiKey || process.env.GEMINI_API_KEY;
  const openaiKey = config?.apiKey || process.env.OPENAI_API_KEY;
  const anthropicKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
  const ollamaUrl = config?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  const systemPrompt = buildAnalysisSystemPrompt(mode);
  const userPrompt = buildAnalysisUserPrompt(metadata, context, mode);

  // 1. Try Gemini
  if ((provider === "gemini" || provider === "auto") && geminiKey) {
    try {
      const model = config?.model || "gemini-2.0-flash";
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
              temperature: mode === "roast" ? 0.7 : 0.2,
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
      }
    } catch (e) {
      console.warn("Gemini call failed, checking next provider:", e);
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
      }
    } catch (e) {
      console.warn("OpenAI call failed:", e);
    }
  }

  // 3. Try Anthropic
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
  return JSON.parse(cleaned);
}
