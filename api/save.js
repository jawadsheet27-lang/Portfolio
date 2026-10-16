/* ============================================================
   XARV — PUBLISH ENDPOINT (Vercel serverless function)
   Receives content from /admin and commits content.json to GitHub.
   Vercel then rebuilds the site automatically (~30 seconds).

   Required environment variables (Vercel → Settings → Environment
   Variables), then redeploy once:
     ADMIN_USERNAME   the admin login username
     ADMIN_PASSWORD   the admin login password
     GITHUB_TOKEN     fine-grained token, Contents: Read and write
     GITHUB_REPO      e.g.  yourname/xarv
     GITHUB_BRANCH    main
   ============================================================ */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ADMIN_USERNAME, ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(500).json({ error: "This site is missing its settings. Finish the environment variables step in DEPLOY-ADMIN.txt, then redeploy." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: "Bad request" }); }
  }
  const { username, password, content, verifyOnly } = body || {};

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong username or password." });
  }
  if (verifyOnly) {
    return res.status(200).json({ ok: true });
  }

  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return res.status(400).json({ error: "Content must be an object." });
  }
  const text = JSON.stringify(content, null, 2);
  if (text.length > 400000) {
    return res.status(413).json({ error: "Content is too large." });
  }

  const branch = GITHUB_BRANCH || "main";
  const apiBase = "https://api.github.com/repos/" + GITHUB_REPO + "/contents/content.json";
  const headers = {
    Authorization: "Bearer " + GITHUB_TOKEN,
    Accept: "application/vnd.github+json",
    "User-Agent": "xarv-admin",
    "Content-Type": "application/json"
  };

  try {
    const getRes = await fetch(apiBase + "?ref=" + encodeURIComponent(branch), { headers });
    if (!getRes.ok) {
      return res.status(502).json({ error: "GitHub refused to read the repository. Check GITHUB_REPO and the token." });
    }
    const current = await getRes.json();

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Update site content via XARV admin",
        content: Buffer.from(text, "utf8").toString("base64"),
        sha: current.sha,
        branch
      })
    });
    if (!putRes.ok) {
      return res.status(502).json({ error: "GitHub refused to write. The token needs Contents: Read and write on this repository." });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach GitHub. Try again in a moment." });
  }
}
