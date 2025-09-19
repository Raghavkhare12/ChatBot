import { useEffect, useState, useRef } from 'react';
import { FileIcon, ImageIcon, MicIcon, XIcon } from '../components/icons';
import { FilePreview } from '../components/file-preview';

function ChatBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 8
    }}>
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: 12,
        background: isUser ? '#4b9fff' : '#f1f3f5',
        color: isUser ? 'white' : 'black'
      }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mm:messages')) || [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  const currentModel = models.find(m => m.id === model);
  const modelCapabilities = currentModel?.capabilities || ['text'];

  useEffect(() => {
    fetch('/api/models').then(r => r.json()).then(data => {
      setModels(data);
      if (!model && data.length) setModel(data[0].id);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('mm:messages', JSON.stringify(messages));
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
      } else {
        assistantText = JSON.stringify(data);
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
    localStorage.removeItem('mm:messages');
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', gap: 12, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Multi-Model Chatbot</h2>
        <select value={model} onChange={e => { setModel(e.target.value); setAttachedFile(null); }} style={{ marginLeft: 'auto' }}>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button onClick={clearChat} style={{ marginLeft: 8 }}>Clear</button>
      </header>

      <main style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {messages.length === 0 && <div style={{ color: '#666' }}>Start a conversation — choose a model and say hi 👋</div>}
        {messages.map((m, idx) =>
          <ChatBubble key={idx} role={m.role} text={m.content} />
        )}
        {loading && <div style={{ color: '#666' }}>Assistant is typing...</div>}
      </main>

      <footer style={{ padding: 12, borderTop: '1px solid #eee' }}>
        {attachedFile && <FilePreview file={attachedFile} onClear={() => setAttachedFile(null)} />}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
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
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Type a message and press Enter"
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }}
          />
          <button onClick={send} disabled={loading} style={{ padding: '8px 12px', borderRadius: 8 }}>
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}