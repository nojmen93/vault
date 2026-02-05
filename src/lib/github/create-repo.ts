interface CreateRepoOptions {
  name: string;
  description?: string;
  isPrivate: boolean;
  files: Record<string, string>;
  accessToken: string;
}

interface CreateRepoResult {
  success: boolean;
  url?: string;
  error?: string;
}

async function githubFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function createProjectRepo(options: CreateRepoOptions): Promise<CreateRepoResult> {
  const { name, description, isPrivate, files, accessToken } = options;

  try {
    // Step 1: Create the repository
    const createRepoResponse = await githubFetch(
      "https://api.github.com/user/repos",
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          description: description || `Project created with Vault`,
          private: isPrivate,
          auto_init: false,
        }),
      }
    );

    if (!createRepoResponse.ok) {
      const errorData = await createRepoResponse.json();
      if (errorData.message?.includes("name already exists")) {
        return { success: false, error: "A repository with this name already exists" };
      }
      return { success: false, error: errorData.message || "Failed to create repository" };
    }

    const repoData = await createRepoResponse.json();
    const owner = repoData.owner.login;
    const repoName = repoData.name;
    const repoUrl = repoData.html_url;

    // Step 2: Get the user's default branch
    const defaultBranch = repoData.default_branch || "main";

    // Step 3: Create a blob tree with all files
    const blobs = await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        // Create blob for file content
        const blobResponse = await githubFetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
          accessToken,
          {
            method: "POST",
            body: JSON.stringify({
              content,
              encoding: "utf-8",
            }),
          }
        );

        if (!blobResponse.ok) {
          throw new Error(`Failed to create blob for ${path}`);
        }

        const blobData = await blobResponse.json();
        return {
          path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blobData.sha,
        };
      })
    );

    // Step 4: Create a tree with all blobs
    const treeResponse = await githubFetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({
          tree: blobs,
        }),
      }
    );

    if (!treeResponse.ok) {
      throw new Error("Failed to create tree");
    }

    const treeData = await treeResponse.json();

    // Step 5: Create an initial commit
    const commitResponse = await githubFetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({
          message: "Initial commit from Vault",
          tree: treeData.sha,
        }),
      }
    );

    if (!commitResponse.ok) {
      throw new Error("Failed to create commit");
    }

    const commitData = await commitResponse.json();

    // Step 6: Create the main branch reference pointing to the commit
    const refResponse = await githubFetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${defaultBranch}`,
          sha: commitData.sha,
        }),
      }
    );

    if (!refResponse.ok) {
      throw new Error("Failed to create branch reference");
    }

    return { success: true, url: repoUrl };
  } catch (err) {
    console.error("createProjectRepo error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create repository",
    };
  }
}

export async function getGithubUser(accessToken: string): Promise<{
  login: string;
  name: string | null;
  avatar_url: string;
} | null> {
  try {
    const response = await githubFetch("https://api.github.com/user", accessToken);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export async function disconnectGithub(accessToken: string): Promise<boolean> {
  // Note: There's no API to revoke the token directly without the app's credentials
  // The best we can do is clear it from our database
  // Users can revoke access from GitHub settings
  return true;
}
