// api/update.js — Vercel Serverless Function
// Ye file /api/update.js path par honi chahiye repo mein

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { content, sha } = req.body;
        if (!content) return res.status(400).json({ error: 'content missing' });

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_OWNER   = 'nixiwebbusiness-maker';
        const REPO_NAME    = 'ukd';
        const FILE_PATH    = 'data.json';
        const BRANCH       = 'main';

        if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN not set' });

        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

        // sha nahi hai toh GitHub se fetch karo
        let fileSha = sha;
        if (!fileSha) {
            const getRes = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json',
                }
            });
            if (getRes.ok) {
                const fileData = await getRes.json();
                fileSha = fileData.sha;
            }
        }

        const body = {
            message: 'Admin panel update',
            content: content,
            branch:  BRANCH,
        };
        if (fileSha) body.sha = fileSha;

        const putRes = await fetch(url, {
            method:  'PUT',
            headers: {
                Authorization:  `Bearer ${GITHUB_TOKEN}`,
                Accept:         'application/vnd.github+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const putData = await putRes.json();

        if (!putRes.ok) {
            console.error('GitHub error:', putData);
            return res.status(putRes.status).json({ error: putData.message || 'GitHub update failed' });
        }

        return res.status(200).json({ success: true, commit: putData.commit?.sha });

    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: err.message });
    }
}
