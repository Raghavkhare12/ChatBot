export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { model, messages } = req.body || {};
  if (!model || !messages) return res.status(400).json({ error: 'model and messages required' });

  // Use the messages directly, but create a deep copy to avoid mutation issues.
  let processedMessages = JSON.parse(JSON.stringify(messages));

  const lastMessage = processedMessages[processedMessages.length - 1];
  const { content, file } = lastMessage;

  // If a file exists, process it and restructure the last message.
  if (file && file.data && file.type) {
    const base64Data = file.data.split(',')[1];
    let updatedContent = [];

    if (file.type.startsWith('image/')) {
      // Format for image files
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
      // Format for text-based files (like code)
      const decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
      const fileContentBlock = `
--- Start of Uploaded File: ${file.name} ---

${decodedText}

--- End of Uploaded File ---
      `;
      updatedContent = [{ type: 'text', text: `${content}\n\n${fileContentBlock}` }];
    }
    
    // Replace the content of the last message and remove the file object
    lastMessage.content = updatedContent;
    delete lastMessage.file;
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
        // Filter out any remaining file objects just in case, before sending.
        messages: processedMessages.map(({ file, ...rest }) => rest)
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