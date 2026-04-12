export async function uploadToGithub(token: string, repoName: string, commitMessage: string, files: Record<string, string>) {
  if (!token) throw new Error("GitHub token is missing");

  // 1. Get authenticated user
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `token ${token}` }
  });
  if (!userRes.ok) throw new Error("Invalid GitHub token");
  const user = await userRes.json();
  const owner = user.login;

  // 2. Create Repository
  const createRepoRes = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json"
    },
    body: JSON.stringify({
      name: repoName,
      description: "Created with X BUILDER",
      private: false,
      auto_init: true // Creates an initial commit with README so we have a branch to work with
    })
  });

  if (!createRepoRes.ok) {
    const err = await createRepoRes.json();
    if (err.errors && err.errors[0]?.message === "name already exists on this account") {
      // Repo exists, we can just push to it
    } else {
      throw new Error(`Failed to create repository: ${err.message}`);
    }
  }

  // Wait a moment for repo to be fully initialized
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. Upload files one by one (Simple approach for browser)
  for (const [path, content] of Object.entries(files)) {
    // Check if file exists to get its sha (in case we are updating)
    let sha = undefined;
    const getFileRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
      headers: { Authorization: `token ${token}` }
    });
    if (getFileRes.ok) {
      const fileData = await getFileRes.json();
      sha = fileData.sha;
    }

    // Create or update file
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: commitMessage || `Add ${path}`,
        content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
        sha: sha
      })
    });

    if (!putRes.ok) {
      console.error(`Failed to upload ${path}`);
    }
  }

  return `https://github.com/${owner}/${repoName}`;
}
