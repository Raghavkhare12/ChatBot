import { useEffect, useState, useRef } from 'react';
import { FileIcon, ImageIcon, MicIcon } from '../components/icons';
import { FilePreview } from '../components/file-preview';
import { ChatMessage } from '../components/ChatMessage';
import { useChatHandler } from '../components/useChatHandler';

export default function Home() {
  const [models, setModels] = useState([]);
  const [input, setInput] = useState('');
  const fileInputRef = useRef(null);
  
  // Use the custom hook for all chat logic
  const {
    model,
    setModel,
    messages,
    loading,
    attachedFile,
    setAttachedFile,
    messagesEndRef,
    handleFileChange,
    sendMessage,
    clearChat,
  } = useChatHandler(models[0]?.id);

  const currentModel = models.find(m => m.id === model);
  const modelCapabilities = currentModel?.capabilities || ['text'];

  useEffect(() => {
    fetch('/api/models').then(r => r.json()).then(data => {
      setModels(data);
      if (data.length && !model) {
        setModel(data[0].id);
      }
    });
  }, [model, setModel]);

  const handleSend = () => {
    sendMessage(input);
    setInput('');
  };

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
              onKeyDown={e => {
                if (e.key === 'Enter' && !loading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
            />
            <button className="send-button" onClick={handleSend} disabled={loading}>Send</button>
          </div>
        </footer>
      </main>
    </div>
  );
}