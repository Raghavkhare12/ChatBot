import { useEffect, useState, useRef } from 'react';
import { FileIcon, ImageIcon, MicIcon, WeatherIcon, TimeIcon } from '../components/icons';
import { FilePreview } from '../components/file-preview';
import { ChatMessage } from '../components/ChatMessage';

export default function Home() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const currentModel = models.find(m => m.id === model);
  const modelCapabilities = currentModel?.capabilities || ['text'];

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
    if (messages.length > 0) {
      localStorage.setItem('mm:messages', JSON.stringify(messages));
    } else {
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

  const handleUtilityButtonClick = (toolName) => {
    setLoading(true);

    if (toolName === 'getDateTime') {
      const userMsg = {
        role: 'user',
        content: 'What is the current date and time?',
        isUtility: true,
        toolName,
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      send(nextMessages);
      return;
    }

    if (toolName === 'getCurrentWeather') {
      if (!navigator.geolocation) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Geolocation is not supported by your browser." }]);
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userMsg = {
            role: 'user',
            content: "What's the weather like right now?",
            isUtility: true,
            toolName,
            toolInput: { latitude, longitude }
          };
          const nextMessages = [...messages, userMsg];
          setMessages(nextMessages);
          send(nextMessages);
        },
        () => {
          setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't get your location. Please enable location services." }]);
          setLoading(false);
        }
      );
    }
  };

  async function send(messagesToSend = null) {
    const currentMessages = messagesToSend || messages;

    if (!input.trim() && !attachedFile && !messagesToSend) return;

    let nextMessages;

    if (!messagesToSend) {
      const userMsg = {
        role: 'user',
        content: input,
        ...(attachedFile && { file: attachedFile }),
      };
      nextMessages = [...currentMessages, userMsg];
      setMessages(nextMessages);
      setInput('');
      setAttachedFile(null);
    } else {
      nextMessages = currentMessages;
    }
    
    setLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: nextMessages })
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        const errorMessage = errorData.error?.message || 'Error: failed to get response.';
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.content !== errorMessage) {
            setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        }
        return;
      }

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

      setMessages(prev => {
          const newMessages = [...prev];
          newMessages.push({ role: 'assistant', content: assistantText });
          return newMessages;
      });

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
  }

  return (
    <div className="container">
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
            {/* START: CONFIRMED ICONS */}
            <button onClick={() => handleUtilityButtonClick('getCurrentWeather')} title="Get Current Weather"><WeatherIcon /></button>
            <button onClick={() => handleUtilityButtonClick('getDateTime')} title="Get Date & Time"><TimeIcon /></button>
            {/* END: CONFIRMED ICONS */}
            
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
                  send();
                }
              }}
              placeholder="Type a message..."
            />
            <button className="send-button" onClick={() => send()} disabled={loading}>Send</button>
          </div>
        </footer>
      </main>
    </div>
  );
}