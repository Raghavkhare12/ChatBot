export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { model, messages } = req.body || {};
  if (!model || !messages) return res.status(400).json({ error: 'model and messages required' });

  // Create a clean version of messages to modify
  let processedMessages = messages.map(msg => ({ role: msg.role, content: msg.content }));

  const lastMessage = messages[messages.length - 1];
  const { content, file } = lastMessage;

  // Check if there is file data to process
  if (file && file.data && file.type) {
    // Strip the metadata from the data URI (e.g., "data:image/png;base64,")
    const base64Data = file.data.split(',')[1];
    
    // Construct a more robust payload for multi-modal models.
    // This format is well-understood by OpenRouter for services like Anthropic/Claude and adapted for others.
    const updatedLastMessageContent = [
      { type: 'text', text: content },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.type, // Pass the correct media type (e.g., 'image/png')
          data: base64Data,      // Pass only the raw base64 data
        },
      },
    ];

    // Replace the content of the last message with the new multi-modal structure
    processedMessages[processedMessages.length - 1].content = updatedLastMessageContent;
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

    // If the response is not OK, log the error for better debugging
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