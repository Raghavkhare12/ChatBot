import { tools, availableTools } from '../../lib/tools';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { model, messages } = req.body || {};
  if (!model || !messages || messages.length === 0) {
    return res.status(400).json({ error: 'model and messages are required' });
  }

  try {
    const lastUserMessage = messages[messages.length - 1];

    // === SCENARIO 1: Handle direct clicks from utility buttons ===
    if (lastUserMessage.role === 'user' && lastUserMessage.isUtility) {
      const { toolName, toolInput } = lastUserMessage;
      const toolFunction = availableTools[toolName];

      if (!toolFunction) {
        return res.status(400).json({ error: `Unknown utility tool: ${toolName}` });
      }

      // Directly call the specified tool function.
      const toolResult = await toolFunction(toolInput || {});
      
      // We send the tool's raw output to the LLM and ask it to format a nice, user-friendly response.
      const messagesForLLM = [
        ...messages.slice(0, -1), // Send all messages except the last one which contained the tool command
        {
            role: 'user',
            content: lastUserMessage.content // e.g., "What's the weather like right now?"
        },
        {
          // This simulates the AI deciding to use a tool and getting a result.
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: `call_${toolName}`,
            type: 'function',
            function: { name: toolName, arguments: JSON.stringify(toolInput || {}) }
          }]
        },
        {
            role: 'tool',
            tool_call_id: `call_${toolName}`,
            content: toolResult
        }
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({ model, messages: messagesForLLM })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get a formatted response after tool execution.' }));
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      return res.status(200).json(data);
    }


    // === SCENARIO 2 & 3: Handle file uploads and standard text queries ===
    let processedMessages = JSON.parse(JSON.stringify(messages));
    for (let message of processedMessages) {
      if (message.role === 'user' && message.file) {
        const { content, file } = message;

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
            updatedContent = [
              { type: 'text', text: content },
              {
                type: 'image',
                source: { type: 'base64', media_type: file.type, data: base64Data },
              },
            ];
          } else {
            const decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
            const fileContentBlock = `\n\n--- Start of Uploaded File: ${file.name} ---\n\n${decodedText}\n\n--- End of Uploaded File ---`;
            updatedContent = [{ type: 'text', text: `${content}${fileContentBlock}` }];
          }
          message.content = updatedContent;
          delete message.file;

        } catch (err) {
          console.error('Error processing file in a message:', err);
          return res.status(500).json({ error: 'An error occurred while processing a file.' });
        }
      }
    }
    
    // This is the standard flow where the LLM decides if a tool is needed.
    const initialResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: processedMessages,
        tools: tools, 
      })
    });

    if (!initialResponse.ok) {
        const errorData = await initialResponse.json().catch(() => ({ error: { message: 'Failed to parse error response from API.' } }));
        console.error('OpenRouter API Error:', errorData);
        return res.status(initialResponse.status).json(errorData);
    }

    const data = await initialResponse.json();
    const choice = data.choices[0];

    if (choice.message.tool_calls) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      const toolFunction = availableTools[functionName];
      
      if (!toolFunction) throw new Error(`Unknown tool: ${functionName}`);
      
      const toolResult = await toolFunction(functionArgs);

      const secondResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            ...processedMessages,
            choice.message,
            { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
          ]
        })
      });

      if (!secondResponse.ok) {
        const errorData = await secondResponse.json().catch(() => ({ error: { message: 'Failed to parse error response from API.' } }));
        return res.status(secondResponse.status).json(errorData);
      }
      
      const finalData = await secondResponse.json();
      return res.status(200).json(finalData);

    } else {
      return res.status(200).json(data);
    }

  } catch (err) {
    console.error('Chat proxy error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}