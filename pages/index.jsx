import { useEffect, useState, useRef } from 'react';
import { FileIcon, ImageIcon, MicIcon } from '../components/icons';
import { FilePreview } from '../components/file-preview';
import { ChatMessage } from '../components/ChatMessage';

export default function Home() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState('');
  const [input, setInput] = useState('');
  // Initialize with an empty array to prevent hydration errors.
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const currentModel = models.find(m => m.id === model);
  const modelCapabilities = currentModel?.capabilities || ['text'];

  // This effect runs only once on the client-side after the initial render.
  // This is the safe way to load data from localStorage.
  useEffect(() => {
    try {
      const savedMessages = JSON.parse(localStorage.getItem('mm:messages')) || [];
      setMessages(savedMessages);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    fetch('/api/models').then(r => r.json()).then(data => {
      setModels(data);
      if (!model && data.length) setModel(data[0].id);
    });
  }, []);

  useEffect(() => {
    // Only save to localStorage if there are messages to prevent overwriting on initial load.
    if (messages.length > 0) {
      localStorage.setItem('mm:messages', JSON.stringify(messages));
    } else {
      // If messages are cleared, also remove from storage.
      localStorage.removeItem('mm:messages');
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  async function send() {
    if (!input.trim() && !attachedFile) return;

    const userMsg = {
      role: 'user',
      content: input,
      ...(attachedFile && { file: attachedFile }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setAttachedFile(null);
    setLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: nextMessages })
      });
      const data = await resp.json();
      let assistantText = '';
      if (data?.choices && data.choices[0]) {
        const ch = data.choices[0];
        assistantText = ch?.message?.content ?? ch?.text ?? JSON.stringify(ch);
      } else if (data?.message) {
        assistantText = data.message?.content ?? JSON.stringify(data.message);
      } else if (resp.ok) {
        assistantText = JSON.stringify(data);
      } else {
        assistantText = data.error?.message || 'Error: failed to get response.';
      }
      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: failed to get response.' }]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setAttachedFile(null);
    // The useEffect hook will handle removing the item from localStorage.
  }

  return (
    <div className="container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">Multi-Model Chat</div>
        <ul className="model-list">
          {models.map(m => (
            <li 
              key={m.id} 
              className={model === m.id ? 'active' : ''}
              onClick={() => { setModel(m.id); setAttachedFile(null); }}
            >
              {m.name}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button onClick={clearChat}>Clear Conversation</button>
        </div>
      </aside>

      {/* Main Chat Panel */}
      <main className="chat-panel">
        <header className="chat-header">
          {currentModel?.name || 'Select a model'}
        </header>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="start-conversation">
              Start a conversation — choose a model and say hi 👋
            </div>
          )}
          {messages.map((m, idx) => <ChatMessage key={idx} message={m} />)}
          {loading && <div>Assistant is typing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <footer className="chat-footer">
          {attachedFile && <FilePreview file={attachedFile} onClear={() => setAttachedFile(null)} />}
          <div className="input-area">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            
            {modelCapabilities.includes('image') && (
              <button onClick={() => { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); }}><ImageIcon /></button>
            )}
            {modelCapabilities.includes('audio') && (
              <button onClick={() => { fileInputRef.current.accept = 'audio/*'; fileInputRef.current.click(); }}><MicIcon /></button>
            )}
            {modelCapabilities.includes('file') && (
              <button onClick={() => { fileInputRef.current.accept = '*/*'; fileInputRef.current.click(); }}><FileIcon /></button>
            )}
            
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) send(); }}
              placeholder="Type a message..."
            />
            <button className="send-button" onClick={send} disabled={loading}>Send</button>
          </div>
        </footer>
      </main>
    </div>
  );
}