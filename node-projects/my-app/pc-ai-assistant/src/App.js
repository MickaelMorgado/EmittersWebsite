import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [status, setStatus] = useState('idle');
  const [conversationLines, setConversationLines] = useState([]);

  useEffect(() => {
    // Connect to the voice assistant server
    const socket = io('http://localhost:3001');

    // Socket event listeners
    socket.on('speech_start', () => {
      setStatus('listening');
    });

    socket.on('speech_end', () => {
      setStatus('processing');
    });

    socket.on('ai_response_start', () => {
      setStatus('speaking');
    });

    socket.on('ai_response_end', () => {
      setStatus('idle');
    });

    socket.on('idle', () => {
      setStatus('idle');
    });

    socket.on('user_speech', (text) => {
      addConversationText(`You: ${text}`);
    });

    socket.on('ai_response', (text) => {
      addConversationText(`AI: ${text}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addConversationText = (text) => {
    // Split text into lines of 1-5 words
    const words = text.split(' ');
    const lines = [];
    let currentLine = [];

    words.forEach(word => {
      currentLine.push(word);
      if (currentLine.length >= 5) {
        lines.push(currentLine.join(' '));
        currentLine = [];
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    // Add lines to conversation
    setConversationLines(prev => [...prev, ...lines]);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening': return '#00ff00';
      case 'processing': return '#ffff00';
      case 'speaking': return '#00ff00';
      default: return '#ffffff';
    }
  };

  return (
    <div className="App">
      {/* Conversation Text Display */}
      <div className="conversation-container">
        {conversationLines.slice(-10).map((line, index) => (
          <div
            key={conversationLines.length - 10 + index}
            className="conversation-line"
            style={{
              opacity: 1 - (index * 0.1),
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Status Badge */}
      <div
        className="status-badge"
        style={{ backgroundColor: getStatusColor() }}
      >
        {status.toUpperCase()}
      </div>
    </div>
  );
}

export default App;
