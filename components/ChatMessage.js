export function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const bubbleStyles = {
    background: isUser ? '#4b9fff' : '#333333',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '18px',
    maxWidth: '75%',
    marginBottom: '12px',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  };

  const containerStyles = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
  };

  return (
    <div style={containerStyles}>
      <div style={bubbleStyles}>
        {message.content}
      </div>
    </div>
  );
}