import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const PcAiAssistant: React.FC = () => {
  const [status, setStatus] = useState('idle');
  const [conversationLines, setConversationLines] = useState<string[]>([]);

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

    socket.on('user_speech', (text: string) => {
      addConversationText(`You: ${text}`);
    });

    socket.on('ai_response', (text: string) => {
      addConversationText(`AI: ${text}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addConversationText = (text: string) => {
    // Split text into lines of 1-5 words
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine: string[] = [];

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      color: '#fff'
    }}>
      {/* Conversation Text Display */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        zIndex: 10,
        background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 20%, #cccccc 40%, #999999 60%, #666666 80%, #000000 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {conversationLines.slice(-10).map((line, index) => (
          <div
            key={conversationLines.length - 10 + index}
            style={{
              fontSize: '25px',
              fontWeight: 'bold',
              margin: '5px 0',
              color: '#ffffff',
              transition: 'all 0.5s ease-in-out'
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: getStatusColor(),
        color: '#000',
        padding: '10px 20px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 20
      }}>
        {status.toUpperCase()}
      </div>
    </div>
  );
};

export default PcAiAssistant;
