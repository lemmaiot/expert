import React from 'react';
import { LOGO_URL } from '../constants';

interface HeaderProps {
  usageLeft: number;
  onClearChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ usageLeft, onClearChat }) => {
  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center z-10 shrink-0">
      <div className="flex items-center">
        <img src={LOGO_URL} alt="LemmaIoT Logo" className="h-10 w-auto" />
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onClearChat}
          className="text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md px-3 py-2 transition-colors"
          aria-label="Clear chat history"
        >
          Clear Chat
        </button>
        <div className="bg-brand-primary text-white text-sm font-semibold px-4 py-2 rounded-full">
          Uses left today: {usageLeft > 0 ? usageLeft : 0}
        </div>
      </div>
    </header>
  );
};