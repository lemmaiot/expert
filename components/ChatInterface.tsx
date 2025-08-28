
import React, { useRef, useEffect } from 'react';
import { Message as MessageType } from '../types';
import { Message } from './Message';

interface ChatInterfaceProps {
  messages: MessageType[];
  isLoading: boolean;
}

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-2 ml-12 mb-4">
    <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse delay-0"></div>
    <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse delay-200"></div>
    <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse delay-400"></div>
  </div>
);

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
