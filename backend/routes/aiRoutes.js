import express from "express";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MODEL_CANDIDATES = [
  process.env.OPENROUTER_MODEL,
  "openrouter/auto",
  "meta-llama/llama-3.3-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free"
].filter(Boolean);

const cleanDescription = (text = "") => {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

const buildFallbackDescription = ({ title, category, qualityLabel, harvestDate }) => {
  const harvestText = harvestDate
    ? `Harvested on ${new Date(harvestDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, `
    : "Freshly harvested, ";

  return `${harvestText}this ${qualityLabel} ${title} from our ${category.toLowerCase()} selection is crisp, clean, and market-ready. It is grown using natural, organic farming practices without harmful synthetic chemicals. Buyers choose it for reliable quality, better taste, and stronger customer satisfaction.`;
};

router.post("/generate-description", authMiddleware, async (req, res) => {
  const { title, category, quality, harvestDate } = req.body;

  if (!title) return res.status(400).json({ message: "Crop title is required" });

  const qualityLabel =
    quality === "A" ? "Grade A (Premium)" :
    quality === "B" ? "Grade B (Standard)" : "Grade C (Economy)";

  const prompt = `You are a helpful assistant for an agricultural marketplace called CropDesk.
Write a compelling product description for a crop listing:
- Crop: ${title}
- Category: ${category}
- Quality: ${qualityLabel}
${harvestDate ? `- Harvest Date: ${harvestDate}` : ""}

Write 2-3 sentences covering freshness, farming method (assume natural/organic), and why a buyer should purchase it. Be professional and concise. Output only the description text, no headings or bullet points.`;

  const fallbackDescription = buildFallbackDescription({
    title,
    category: category || "Produce",
    qualityLabel,
    harvestDate
  });

  try {
    if (!process.env.OPENROUTER_KEY) {
      return res.json({
        description: fallbackDescription,
        warning: "AI key is missing on server, so a standard description was generated."
      });
    }

    let lastErrorMessage = "AI returned no content";

    for (const model of MODEL_CANDIDATES) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
            "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
            "X-Title": "CropDesk"
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 320,
            temperature: 0.6
          })
        });

        const data = await response.json();
        const finishReason = data?.choices?.[0]?.finish_reason;
        const rawText = data?.choices?.[0]?.message?.content;
        const text = cleanDescription(rawText);
        const isRateLimited = response.status === 429 || data?.error?.code === 429;

        console.log("OpenRouter summary:", {
          model,
          status: response.status,
          attempt,
          finishReason,
          hasText: Boolean(text),
          error: data?.error?.message || null
        });

        if (response.ok && text) {
          return res.json({
            description: text,
            warning: finishReason === "length" ? "Description was trimmed to fit token limit." : undefined
          });
        }

        lastErrorMessage = data?.error?.message || `AI request failed with status ${response.status}`;

        if (isRateLimited && attempt < 2) {
          await wait(500 * attempt);
          continue;
        }

        if (!isRateLimited) {
          break;
        }
      }
    }

    if (/rate-limited/i.test(lastErrorMessage)) {
      return res.json({
        description: fallbackDescription,
        warning: "AI is busy right now, so a standard description was generated."
      });
    }

    res.json({
      description: fallbackDescription,
      warning: "AI provider failed, so a standard description was generated."
    });
  } catch (err) {
    console.error("AI route error:", err);
    res.json({
      description: fallbackDescription,
      warning: "AI service was unreachable, so a standard description was generated."
    });
  }
});

export default router;
