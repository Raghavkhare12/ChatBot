export function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  // This style remains to handle the left/right alignment of the message.
  const containerStyles = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
  };

  // We create a dynamic className string.
  // It will be "bubble user" for user messages and "bubble assistant" for assistant messages.
  const bubbleClassName = `bubble ${isUser ? 'user' : 'assistant'}`;

  return (
    <div style={containerStyles}>
      {/* The className attribute applies the styles from your globals.css file */}
      <div className={bubbleClassName}>
        {message.content}
      </div>
    </div>
  );
}