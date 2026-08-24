'use client';

import { useState } from 'react';

export function StartingMenu({ onSelect }: { onSelect: (vsAI: boolean) => void }) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0512 0%, #1a0828 50%, #0a0512 100%)',
        zIndex: 1000,
        color: '#eef4ff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div
          style={{
            fontSize: '1.2rem',
            letterSpacing: '0.3em',
            color: '#ffd475',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}
        >
          3D Crystal
        </div>
        <div style={{ fontSize: '4rem', fontWeight: 300, letterSpacing: '0.1em', lineHeight: 1.1 }}>
          Chess
        </div>
        <div style={{ fontSize: '0.85rem', color: '#b8a9c4', marginTop: '0.75rem', letterSpacing: '0.15em' }}>
          Handcrafted glass pieces on a wooden board
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '280px' }}>
        <button
          onClick={() => onSelect(true)}
          onMouseEnter={() => setHoveredButton('ai')}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            background: hoveredButton === 'ai' ? 'rgba(255,212,117,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${hoveredButton === 'ai' ? '#ffd475' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '6px',
            color: '#eef4ff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            letterSpacing: '0.1em',
          }}
        >
          Play vs AI
        </button>
        <button
          onClick={() => onSelect(false)}
          onMouseEnter={() => setHoveredButton('local')}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            background: hoveredButton === 'local' ? 'rgba(255,212,117,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${hoveredButton === 'local' ? '#ffd475' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '6px',
            color: '#eef4ff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            letterSpacing: '0.1em',
          }}
        >
          Local Multiplayer
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: '2rem', color: '#5a4a6a', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
        Built with React Three Fiber
      </div>
    </div>
  );
}
