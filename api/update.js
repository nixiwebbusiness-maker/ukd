// api/update.js — Vercel Serverless Function
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GITHUB_TOKEN   = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER   = process.env.GITHUB_OWNER;
  const GITHUB_REPO    = process.env.GITHUB_REPO;
  const BRANCH         = process.env.GITHUB_BRANCH || 'main';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'faysal2059';

  const body = req.body;

  if (body.password !== undefined && body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return res.status(500).json({ error: 'GitHub env variables not set in Vercel' });
  }

  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data.json`;
    const headers = {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // Get current SHA
    let sha = body.sha || null;
    if (!sha) {
      const getRes = await fetch(`${apiUrl}?ref=${BRANCH}`, { headers });
      if (getRes.ok) {
        const info = await getRes.json();
        sha = info.sha;
      }
    }

    // Encode content
    let content = body.content || null;
    if (!content && body.data) {
      content = Buffer.from(JSON.stringify(body.data, null, 2)).toString('base64');
    }
    if (!content) return res.status(400).json({ error: 'No data provided' });

    // Push to GitHub
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: '🔄 Updated via admin panel',
        content, sha, branch: BRANCH,
      })
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(500).json({ error: 'GitHub push failed', details: err });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
