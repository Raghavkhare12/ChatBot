export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { model, messages } = req.body || {};
  if (!model || !messages) {
    return res.status(400).json({ error: 'model and messages are required' });
  }

  // Create a deep copy to safely modify the messages array.
  let processedMessages = JSON.parse(JSON.stringify(messages));

  // --- FIX: Loop through ALL messages to process files, not just the last one ---
  for (let message of processedMessages) {
    if (message.role === 'user' && message.file) {
      const { content, file } = message;

      // Basic validation for the file object
      if (!file.data || !file.type || !file.name) {
        return res.status(400).json({ error: 'Invalid file data in one of the messages.' });
      }
      if (!file.data.startsWith('data:')) {
        return res.status(400).json({ error: 'Invalid file data format. Expected a data URL.' });
      }

      const base64Data = file.data.split(',')[1];
      let updatedContent = [];

      try {
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
          // Format for text-based files
          const decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
          const fileContentBlock = `\n\n--- Start of Uploaded File: ${file.name} ---\n\n${decodedText}\n\n--- End of Uploaded File ---`;
          updatedContent = [{ type: 'text', text: `${content}${fileContentBlock}` }];
        }
        
        // Replace the content of the current message and delete the temporary file object.
        message.content = updatedContent;
        delete message.file;

      } catch (err) {
        console.error('Error processing file in a message:', err);
        return res.status(500).json({ error: 'An error occurred while processing a file.' });
      }
    }
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
        messages: processedMessages // Send the fully processed message history
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