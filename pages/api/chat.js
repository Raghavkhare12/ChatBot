export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { model, messages } = req.body || {};
  if (!model || !messages) return res.status(400).json({ error: 'model and messages required' });

  // The last message is the one with the potential multimodal content
  const lastMessage = messages[messages.length - 1];
  const { content, file } = lastMessage;

  let processedMessages = [...messages];

  if (file && file.data) {
    // Reformat the last message to include the file content for multimodal models
    const updatedLastMessage = {
      role: 'user',
      content: [
        { type: 'text', text: content },
        {
          type: 'image_url', // This type is often used for various file types by providers
          image_url: {
            url: file.data, // base64 data URI
          },
        },
      ],
    };
    // Replace the last message with the new multimodal format
    processedMessages = [...messages.slice(0, -1), updatedLastMessage];
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
        messages: processedMessages // Send the potentially modified messages array
      })
    });

    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (err) {
    console.error('Chat proxy error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}