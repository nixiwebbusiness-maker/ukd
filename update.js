// api/update.js
// Vercel Serverless Function
// Ye function admin se changes receive karta hai aur GitHub pe data.json update karta hai

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin password check
  const { password, data } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'faysal2059';

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GitHub config — set these in Vercel Environment Variables
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER; // e.g. "faysal123"
  const GITHUB_REPO  = process.env.GITHUB_REPO;  // e.g. "my-restaurant"
  const FILE_PATH    = 'data.json';
  const BRANCH       = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return res.status(500).json({ 
      error: 'GitHub environment variables not set. Vercel mein GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO add karein.' 
    });
  }

  try {
    const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    // Step 1: Get current file SHA (required for update)
    const getRes = await fetch(`${apiBase}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    let sha = null;
    if (getRes.ok) {
      const fileInfo = await getRes.json();
      sha = fileInfo.sha;
    }

    // Step 2: Push updated data.json
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    const updateRes = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '🔄 Restaurant data updated via admin panel',
        content,
        sha,
        branch: BRANCH,
      })
    });

    if (!updateRes.ok) {
      const err = await updateRes.json();
      return res.status(500).json({ error: 'GitHub update failed', details: err });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Data save ho gaya! Vercel 30-60 seconds mein redeploy karega.' 
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
