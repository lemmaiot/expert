import React, { useState, KeyboardEvent, useRef, useEffect, ChangeEvent } from 'react';

interface InputBarProps {
  onSendMessage: (message: string) => Promise<boolean>;
  isLoading: boolean;
  isLimitReached: boolean;
  isAwaitingLocation: boolean;
  locationError: string | null;
}

export const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading, isLimitReached, isAwaitingLocation, locationError }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const messageToSend = input.trim();
    if (!messageToSend || isLoading || isLimitReached) return;

    // Clear input immediately. If submission fails (e.g., invalid state),
    // we'll restore it.
    setInput('');

    const success = await onSendMessage(messageToSend);

    if (!success) {
      // Restore input if the message submission failed (e.g., invalid location)
      setInput(messageToSend);
    }
  };
  
  // Auto-resize textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    }
  }, [input]);

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSend();
    }
  };

  const isDisabled = isLoading || isLimitReached;

  const placeholderText = isLimitReached 
    ? "You have reached your daily limit."
    : isAwaitingLocation
    ? "Enter your state in Nigeria..."
    : "Type your message here... (Shift+Enter for new line)";

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 border-t border-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className={`flex items-start bg-white shadow-sm p-2 transition-all duration-300 rounded-xl ring-2 ${isAwaitingLocation ? 'focus-within:ring-lemma-pink' : 'focus-within:ring-brand-primary'} ${locationError ? 'ring-red-500' : 'ring-transparent'}`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholderText}
            className="flex-1 w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 px-4 py-2 resize-none max-h-48 overflow-y-auto"
            disabled={isDisabled}
            aria-label={isAwaitingLocation ? "Enter your location" : "Chat input"}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={isDisabled || !input.trim()}
            className={`p-2 rounded-full transition-colors self-end ${isDisabled || !input.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-lemma-pink text-white hover:bg-pink-500'}`}
            aria-label={isAwaitingLocation ? "Submit location" : "Send message"}
          >
            {isAwaitingLocation ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        {isAwaitingLocation && locationError && (
          <p className="text-red-600 text-sm mt-2 ml-2">{locationError}</p>
        )}
      </div>
    </div>
  );
};