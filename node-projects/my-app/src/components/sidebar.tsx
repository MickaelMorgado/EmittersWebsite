import { ReactNode } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  title?: string;
}

export default function Sidebar({ isOpen, onToggle, children, title }: SidebarProps) {
  return (
    <div className={`fixed top-0 left-0 h-full bg-[rgba(0,0,0,0.75)] backdrop-blur-sm transition-all duration-300 z-10 ${isOpen ? 'w-[500px]' : 'w-12'}`}>
      <button
        onClick={onToggle}
        className="absolute top-4 right-2 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {isOpen && (
        <div className="p-4 pt-16 text-white overflow-y-auto h-full">
          {title && <h1 className="text-xl font-bold mb-4">{title}</h1>}
          {children}
        </div>
      )}
    </div>
  );
}
