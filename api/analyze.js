import { getRepoMetadata, getRepoTree, getLanguages, getReadme, getFileContent } from "../lib/github.js";
import { buildFileTree, detectFrameworks, computeStats } from "../lib/parser.js";
import { generateSummary } from "../lib/ai.js";
import { repoSummaryPrompt } from "../lib/prompts.js";

// Basic CORS middleware for Vercel
function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*"); // Or "https://bip-krishna.github.io"
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({ success: false, error: "Missing owner or repo parameter" });
  }

  try {
    // Fetch repo data in parallel
    const [metadata, languages, readme] = await Promise.all([
      getRepoMetadata(owner, repo),
      getLanguages(owner, repo),
      getReadme(owner, repo),
    ]);

    const treeItems = await getRepoTree(owner, repo, metadata.defaultBranch);
    const fileTree = buildFileTree(treeItems);
    const stats = computeStats(treeItems);

    let packageJson = null;
    let packageJsonStr = null;
    try {
      packageJsonStr = await getFileContent(owner, repo, "package.json");
      packageJson = JSON.parse(packageJsonStr);
    } catch { /* no package.json */ }

    const frameworks = detectFrameworks(treeItems, packageJson);

    let summary = null;
    if (process.env.GROQ_API_KEY) {
      try {
        const treeStr = treeItems.slice(0, 200).map((i) => i.path).join("\n");
        const prompt = repoSummaryPrompt(`${owner}/${repo}`, treeStr, readme, packageJsonStr);
        summary = await generateSummary(prompt);
      } catch (err) {
        console.error("AI summary generation failed:", err);
      }
    }

    const analysis = {
      metadata,
      tree: fileTree,
      languages,
      frameworks,
      summary,
      stats,
    };

    return res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to analyze repository" });
  }
}
