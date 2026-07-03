import { streamChat } from "../lib/ai.js";
import { chatSystemPrompt } from "../lib/prompts.js";

function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, repoName, treeStr, summary } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ success: false, error: "No messages provided" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, error: "GROQ_API_KEY not configured" });
    }

    // Convert summary to string if it's an object
    const summaryStr = typeof summary === "object" ? JSON.stringify(summary, null, 2) : (summary || "No summary available");

    const systemPrompt = chatSystemPrompt(
      repoName || "Unknown",
      treeStr || "",
      summaryStr
    );

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      for await (const chunk of streamChat(systemPrompt, messages)) {
        res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ content: "", done: true })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error("Chat error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.end();
  }
}
