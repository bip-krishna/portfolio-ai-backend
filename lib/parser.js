export function buildFileTree(treeItems) {
  const root = [];
  const map = new Map();

  // Create nodes
  for (const item of treeItems) {
    const node = {
      id: item.path,
      name: item.path.split("/").pop() || "",
      type: item.type === "tree" ? "folder" : "file",
      path: item.path,
      url: item.url,
      children: item.type === "tree" ? [] : undefined,
    };
    map.set(item.path, node);
  }

  // Link children
  for (const item of treeItems) {
    const node = map.get(item.path);
    if (!node) continue;

    const parts = item.path.split("/");
    if (parts.length === 1) {
      root.push(node);
    } else {
      parts.pop();
      const parentPath = parts.join("/");
      const parent = map.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(node);
      } else {
        // Fallback if parent is missing
        root.push(node);
      }
    }
  }

  // Sort: folders first, then alphabetical
  const sortTree = (nodes) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortTree(node.children);
    }
  };

  sortTree(root);
  return root;
}

export function detectFrameworks(treeItems, packageJson) {
  const frameworks = [];
  const paths = treeItems.map((i) => i.path);

  if (paths.includes("next.config.js") || paths.includes("next.config.mjs") || paths.includes("next.config.ts")) {
    frameworks.push("Next.js");
  }
  if (paths.includes("vite.config.js") || paths.includes("vite.config.ts")) {
    frameworks.push("Vite");
  }
  if (paths.includes("nuxt.config.js") || paths.includes("nuxt.config.ts")) {
    frameworks.push("Nuxt");
  }
  if (paths.includes("svelte.config.js")) {
    frameworks.push("SvelteKit");
  }
  if (paths.includes("requirements.txt") || paths.includes("pyproject.toml")) {
    frameworks.push("Python");
  }
  if (paths.includes("Cargo.toml")) {
    frameworks.push("Rust");
  }
  if (paths.includes("pom.xml") || paths.includes("build.gradle")) {
    frameworks.push("Java");
  }
  if (paths.includes("go.mod")) {
    frameworks.push("Go");
  }

  // Detect via package.json
  if (packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    if (deps.react) frameworks.push("React");
    if (deps.vue) frameworks.push("Vue");
    if (deps["@angular/core"]) frameworks.push("Angular");
    if (deps.express) frameworks.push("Express");
    if (deps.tailwindcss) frameworks.push("Tailwind CSS");
    if (deps.typescript) frameworks.push("TypeScript");
  }

  return [...new Set(frameworks)]; // Unique
}

export function computeStats(treeItems) {
  let fileCount = 0;
  let folderCount = 0;
  let totalSize = 0;

  for (const item of treeItems) {
    if (item.type === "tree") folderCount++;
    if (item.type === "blob") {
      fileCount++;
      if (item.size) totalSize += item.size;
    }
  }

  return { fileCount, folderCount, totalSize };
}
