const GITHUB_API = "https://api.github.com";

function getHeaders() {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoLens-AI-Portfolio",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export async function githubFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`GitHub API error ${res.status}: ${res.statusText}. ${errorBody}`);
  }
  return res.json();
}

export async function getRepoMetadata(owner, repo) {
  const data = await githubFetch(`/repos/${owner}/${repo}`);
  return {
    owner: data.owner.login,
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    language: data.language,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    watchers: data.subscribers_count,
    defaultBranch: data.default_branch,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    topics: data.topics || [],
    license: data.license?.spdx_id || null,
    homepage: data.homepage || null,
    isArchived: data.archived,
    size: data.size,
  };
}

export async function getRepoTree(owner, repo, branch) {
  const data = await githubFetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  return (data.tree || []).map((item) => ({
    path: item.path,
    type: item.type,
    sha: item.sha,
    size: item.size,
    url: item.url,
  }));
}

export async function getFileContent(owner, repo, path) {
  const data = await githubFetch(`/repos/${owner}/${repo}/contents/${path}`);
  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  return data.content || "";
}

export async function getLanguages(owner, repo) {
  return githubFetch(`/repos/${owner}/${repo}/languages`);
}

export async function getReadme(owner, repo) {
  try {
    const data = await githubFetch(`/repos/${owner}/${repo}/readme`);
    if (data.content && data.encoding === "base64") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}
