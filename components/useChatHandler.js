import { useState, useEffect, useRef } from 'react';

export function useChatHandler(initialModel) {
  const [model, setModel] = useState(initialModel);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load messages from localStorage on initial render
  useEffect(() => {
    try {
      const savedMessages = JSON.parse(localStorage.getItem('mm:messages')) || [];
      setMessages(savedMessages);
    } catch {
      setMessages([]);
    }
  }, []);

  // Save messages to localStorage and scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('mm:messages', JSON.stringify(messages));
    } else {
      localStorage.removeItem('mm:messages');
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (input) => {
    if (!input.trim()) return;

    setLoading(true);

    const userMsg = {
      role: 'user',
      content: input,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: newMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        const errorMessage = errorData.error?.message || 'Error: Failed to get response from API.';
        setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        return;
      }

      const data = await resp.json();
      const choice = data.choices?.[0];
      const assistantText = choice?.message?.content || 'Sorry, I could not provide a response.';
      
      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
    } catch (err) {
      console.error("API call failed:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: An unexpected error occurred.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    model,
    setModel,
    messages,
    loading,
    messagesEndRef,
    sendMessage,
    clearChat,
  };
}