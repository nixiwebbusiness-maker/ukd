export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { content, sha } = req.body;
    const GITHUB_TOKEN = process.env.GH_TOKEN;
    
    // Exact Repo Path from your screenshot
    const REPO_PATH = 'nixiwebbusiness-maker/LUMINA-_LUXE'; 

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_PATH}/contents/data.json`, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Content updated via Admin Panel",
                content: content,
                sha: sha
            }),
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}
