export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { model, messages } = req.body || {};
  if (!model || !messages) {
    return res.status(400).json({ error: 'model and messages are required' });
  }
  
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    });

    if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: { message: 'Failed to parse error response from API.' } }));
        console.error('OpenRouter API Error:', errorData);
        return res.status(resp.status).json(errorData);
    }

    const data = await resp.json();
    return res.status(resp.status).json(data);

  } catch (err) {
    console.error('Chat proxy error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}