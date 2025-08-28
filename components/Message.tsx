
import React from 'react';
import { Message as MessageType, Sender } from '../types';
import { AI_AVATAR_URL } from '../constants';

interface MessageProps {
  message: MessageType;
}

const parseMarkdown = (text: string): string => {
  let processedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  processedText = processedText.replace(/\n/g, '<br />');

  return processedText;
};


export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;

  return (
    <div className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'} items-start gap-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
          <img src={AI_AVATAR_URL} alt="AI Icon" className="w-5 h-5" />
        </div>
      )}
      <div className={`max-w-lg p-4 rounded-2xl ${isUser ? 'bg-brand-primary text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
        <div 
          className="text-base"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }} 
        />
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <h4 className="text-xs font-bold tracking-wider text-slate-500 mb-2">SOURCES</h4>
            <ul className="text-xs space-y-2">
              {message.sources.map((source, index) => {
                const isLemmaSource = source.uri.includes('lemmaiot.com.ng');
                
                let displayTitle = source.title;
                try {
                  // Clean up title if it's just a URI
                  if (!source.title || source.title.trim().replace(/\/$/, '') === source.uri.trim().replace(/\/$/, '')) {
                    const url = new URL(source.uri);
                    const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
                    displayTitle = url.hostname.replace(/^www\./, '') + pathname;
                  }
                } catch (e) {
                  // Fallback if URI is invalid for some reason
                  displayTitle = source.title || source.uri; 
                }

                return (
                  <li key={index} className="flex items-start">
                    <svg className="w-3 h-3 text-slate-400 mr-2 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    <div className="min-w-0">
                      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline break-words" title={source.uri}>
                        {displayTitle}
                      </a>
                      {isLemmaSource && (
                        <span className="ml-2 inline-block text-[10px] font-bold text-white bg-lemma-pink px-2 py-0.5 rounded-full align-middle leading-none">
                          LemmaIoT
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};