export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { model, messages } = req.body || {};
  if (!model || !messages) return res.status(400).json({ error: 'model and messages required' });

  let processedMessages = messages.map(msg => ({ role: msg.role, content: msg.content }));

  const lastMessage = messages[messages.length - 1];
  const { content, file } = lastMessage;

  if (file && file.data && file.type) {
    const base64Data = file.data.split(',')[1];
    let updatedContent = [];

    // Check if the file is an image
    if (file.type.startsWith('image/')) {
      updatedContent = [
        { type: 'text', text: content },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type,
            data: base64Data,
          },
        },
      ];
    } else {
      // Handle text-based files (like code)
      const decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
      const fileContentBlock = `
--- Start of Uploaded File: ${file.name} ---

${decodedText}

--- End of Uploaded File ---
      `;
      
      // Prepend the file content to the user's text prompt
      updatedContent = [
        { type: 'text', text: `${content}\n\n${fileContentBlock}` }
      ];
    }

    processedMessages[processedMessages.length - 1].content = updatedContent;
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
        messages: processedMessages
      })
    });

    if (!resp.ok) {
        const errorData = await resp.json();
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