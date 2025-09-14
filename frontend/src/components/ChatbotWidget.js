import React, { useState } from 'react';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I\'m your AI assistant for this blockchain-based financial ledger system. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages([...messages, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      const botMsg = { sender: 'bot', text: data?.payload?.text || 'Sorry, I could not understand.' };
      setMessages(msgs => [...msgs, botMsg]);
    } catch (err) {
      setMessages(msgs => [...msgs, { sender: 'bot', text: 'Error connecting to chatbot.' }]);
    }
    setInput('');
    setLoading(false);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button 
          className="chatbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          title="Open AI Assistant"
        >
          💬
        </button>
      )}
      
      {/* Chat Widget */}
      {isOpen && (
        <div className="chatbot-widget">
          <div className="chatbot-header">
            <span>AI Assistant</span>
            <button 
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              title="Close Chat"
            >
              ×
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg-${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg chatbot-msg-bot">
                <div className="chatbot-typing">AI is typing...</div>
              </div>
            )}
          </div>
          <div className="chatbot-input-row">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' ? sendMessage() : null}
              placeholder="Ask about transactions, budgets, analytics..."
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
