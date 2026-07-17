import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I'm your TOOTHEASE Dental AI Assistant. I can help answer questions about dentistry, oral health, and our services. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Format history for Gemini API (requires parts: [{text: ...}])
      const history = messages.slice(1).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const { data } = await API.post('/ai/chat', { message: userMessage, history });
      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting to my knowledge base right now." }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm experiencing technical difficulties at the moment." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'bounce 2s infinite',
        }}
        title="Chat with Dental AI"
      >
        <i className="ti ti-messages" style={{ fontSize: '28px' }}></i>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      width: '350px',
      height: '500px',
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-robot" style={{ fontSize: '20px' }}></i>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>Dental AI Assistant</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Powered by Gemini</div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
          <i className="ti ti-x" style={{ fontSize: '20px' }}></i>
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            background: msg.role === 'user' ? '#2563eb' : 'white',
            color: msg.role === 'user' ? 'white' : '#334155',
            padding: '12px 16px',
            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            fontSize: '14px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap'
          }}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }}></i>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        padding: '15px',
        background: 'white',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        gap: '10px'
      }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a dental question..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '24px',
            border: '1px solid #cbd5e1',
            outline: 'none',
            fontSize: '14px',
            background: '#f1f5f9'
          }}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            background: (loading || !input.trim()) ? '#cbd5e1' : '#2563eb',
            color: 'white',
            border: 'none',
            cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
        >
          <i className="ti ti-send" style={{ fontSize: '18px' }}></i>
        </button>
      </form>
    </div>
  );
}
