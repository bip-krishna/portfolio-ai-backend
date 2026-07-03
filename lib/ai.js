import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile"; // Fast and smart model

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Get one at https://console.groq.com/");
  }
  return new Groq({ apiKey });
}

export async function generateSummary(prompt) {
  const client = getClient();
  const result = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful AI that analyzes codebases. Return the result strictly in valid JSON format without markdown wrapping." },
      { role: "user", content: prompt }
    ],
    model: MODEL,
    response_format: { type: "json_object" },
  });

  const text = result.choices[0]?.message?.content || "";

  try {
    return JSON.parse(text);
  } catch {
    return {
      overview: text.slice(0, 500),
      architecture: "Could not parse structured response",
      keyComponents: [],
      techStack: [],
      setupInstructions: [],
      goodFirstIssues: [],
    };
  }
}

export async function* streamChat(systemPrompt, messages) {
  const client = getClient();
  
  // Format messages for Groq API
  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  const stream = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are RepoLens AI assistant. " + systemPrompt },
      ...formattedMessages
    ],
    model: MODEL,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) yield text;
  }
}
