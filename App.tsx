
import React from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { InputBar } from './components/InputBar';
import { LimitModal } from './components/LimitModal';
import { useChat } from './hooks/useChat';
import { MAX_MESSAGES_PER_DAY } from './constants';

const ApiKeyMissingError: React.FC = () => (
  <div className="bg-slate-100 w-screen h-screen flex flex-col items-center justify-center p-4 antialiased">
    <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-lg mx-auto border-t-4 border-red-500">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Configuration Error</h2>
      <p className="text-gray-600 mb-2">
        The AI provider API key is missing. The application cannot start without it.
      </p>
      <p className="text-gray-600">
        If you are the administrator, please configure the <code className="bg-slate-200 text-red-700 font-mono text-sm px-1 py-0.5 rounded">API_KEY</code> environment variable in your deployment settings.
      </p>
    </div>
  </div>
);


const App: React.FC = () => {
  const isApiKeyMissing = !process.env.API_KEY;

  if (isApiKeyMissing) {
    return <ApiKeyMissingError />;
  }

  const {
    messages,
    isLoading,
    sendMessage,
    usageCount,
    isLimitReached,
    isAwaitingLocation,
    clearChat,
    locationError,
  } = useChat();

  return (
    <div className="bg-slate-100 font-sans w-screen h-screen flex flex-col antialiased">
      <Header 
        usageLeft={MAX_MESSAGES_PER_DAY - usageCount} 
        onClearChat={clearChat} 
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatInterface messages={messages} isLoading={isLoading} />
        <InputBar 
          onSendMessage={sendMessage} 
          isLoading={isLoading} 
          isLimitReached={isLimitReached} 
          isAwaitingLocation={isAwaitingLocation}
          locationError={locationError}
        />
      </div>
      {isLimitReached && <LimitModal />}
    </div>
  );
};

export default App;