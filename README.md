# Portfolio AI Backend

Vercel serverless backend that analyzes GitHub repositories using AI (Groq SDK + Llama 3.3 70B). Provides structured repo insights — metadata, languages, file trees, AI-generated summaries — and a conversational chat interface for exploring codebases.

## Features

- **Repo Analysis** — Fetches metadata, languages, file tree, and README; detects frameworks; generates AI summaries via Groq
- **Chat Interface** — Server-Sent Events (SSE) streaming chat that answers questions about any repository
- **CORS Enabled** — Ready for cross-origin frontend consumption

## API Endpoints

### `GET /api/analyze`
Analyze a public GitHub repository.

**Query params:** `owner` (string), `repo` (string)

Returns metadata, file tree, languages, detected frameworks, computed stats, and an AI-generated summary.

### `POST /api/chat`
Stream an AI chat about a repository.

**Body:** `{ messages, repoName, treeStr, summary }`

Returns an SSE stream of AI responses.

## Tech Stack

- **Runtime:** Node.js (ESM)
- **Framework:** Vercel Serverless Functions
- **AI:** Groq SDK (llama-3.3-70b-versatile)
- **Data Source:** GitHub REST API v3

## Setup

```bash
git clone https://github.com/bip-krishna/portfolio-ai-backend.git
cd portfolio-ai-backend
npm install
```

Set environment variables:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Required. Get one at https://console.groq.com |
| `GITHUB_TOKEN` | Optional. Increases API rate limits |

### Local development

Use the [Vercel CLI](https://vercel.com/docs/cli):

```bash
vercel dev
```

### Deploy

```bash
vercel --prod
```

Set the environment variables in the Vercel dashboard.

## License

ISC
