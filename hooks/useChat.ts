import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Sender } from '../types';
import { getVisitorId } from '../services/fingerprintService';
import { getLemmaConsultantResponse } from '../services/geminiService';
import { MAX_MESSAGES_PER_DAY, INITIAL_MESSAGE_LOCATION, INITIAL_MESSAGE_PROMPT } from '../constants';
import { NIGERIAN_STATES } from '../data/nigerianStates';

// Helper to check if a timestamp is from today
const isToday = (timestamp: number) => {
  const today = new Date();
  const date = new Date(timestamp);
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};


export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState<number>(0);
  const [isLimitReached, setIsLimitReached] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isAwaitingLocation, setIsAwaitingLocation] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Effect to get visitorId on mount
  useEffect(() => {
    const initFingerprint = async () => {
      const id = await getVisitorId();
      setVisitorId(id);
    };
    initFingerprint();
  }, []);

  // Effect to load data from localStorage once visitorId is available
  useEffect(() => {
    if (!visitorId) return;

    // Load usage logs
    const usageLogsRaw = localStorage.getItem(`usage_${visitorId}`);
    if (usageLogsRaw) {
      const usageLogs = JSON.parse(usageLogsRaw);
      if (isToday(usageLogs.last_activity)) {
        const currentCount = usageLogs.count || 0;
        setUsageCount(currentCount);
        if (currentCount >= MAX_MESSAGES_PER_DAY) {
          setIsLimitReached(true);
        }
      } else {
        localStorage.removeItem(`usage_${visitorId}`);
      }
    }

    // Load session data (history and location)
    const sessionRaw = localStorage.getItem(`session_${visitorId}`);
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      if (session.location) {
        setUserLocation(session.location);
        setIsAwaitingLocation(false);
        // If a session exists with a location, restore its history.
        // The history should be an array; if it's not, default to the prompt.
        setMessages(Array.isArray(session.message_history) ? session.message_history : [INITIAL_MESSAGE_PROMPT]);
      } else {
        // No location found in session, start from scratch.
        setMessages([INITIAL_MESSAGE_LOCATION]);
        setIsAwaitingLocation(true);
      }
    } else {
      // No session found at all, start from scratch.
      setMessages([INITIAL_MESSAGE_LOCATION]);
      setIsAwaitingLocation(true);
    }
    
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitorId]);
  
  // Effect to save data to localStorage whenever it changes
  useEffect(() => {
    if (!visitorId || isLoading) return; // Don't save while loading initial state

    // Save usage logs
    const usageData = { count: usageCount, last_activity: Date.now() };
    localStorage.setItem(`usage_${visitorId}`, JSON.stringify(usageData));
    
    // Only save session after location is provided and there are messages
    if (userLocation && messages.length > 0) {
      const sessionData = { message_history: messages, location: userLocation };
      localStorage.setItem(`session_${visitorId}`, JSON.stringify(sessionData));
    }

  }, [usageCount, messages, userLocation, visitorId, isLoading]);

  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (isLoading || isLimitReached || !text.trim()) return false;

    // Stage 1: Handle location submission
    if (isAwaitingLocation) {
        const normalizedInput = text.trim();
        const isValidState = NIGERIAN_STATES.some(state => state.toLowerCase() === normalizedInput.toLowerCase());

        if (isValidState) {
            setLocationError(null); // Clear error on valid input
            const properCasedState = NIGERIAN_STATES.find(state => state.toLowerCase() === normalizedInput.toLowerCase()) || normalizedInput;

            const userLocationMessage: Message = { id: uuidv4(), sender: Sender.User, text: properCasedState };
            setUserLocation(properCasedState);
            setIsAwaitingLocation(false);
            setMessages(prev => [...prev, userLocationMessage, INITIAL_MESSAGE_PROMPT]);
            return true; // Success, clear input
        } else {
            setLocationError("That doesn't look like a valid Nigerian state. Please check your spelling and try again (e.g., 'Lagos', 'Kano', 'Rivers').");
            return false; // Failure, do not clear input
        }
    }

    // Stage 2: Handle regular chat messages with streaming
    const newUserMessage: Message = { id: uuidv4(), sender: Sender.User, text };
    
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    const newCount = usageCount + 1;
    setUsageCount(newCount);
    
    if (newCount >= MAX_MESSAGES_PER_DAY) {
        setIsLimitReached(true);
    }
    
    let aiMessageId: string | null = null;
    let accumulatedText = '';

    try {
      // Non-null assertion is safe because isAwaitingLocation is false here
      const stream = getLemmaConsultantResponse(text, updatedMessages, userLocation!);

      for await (const chunk of stream) {
        if (aiMessageId === null) {
          // First chunk received, stop the global loading indicator
          // and create the new AI message bubble
          setIsLoading(false);
          aiMessageId = uuidv4();
          setMessages(prev => [...prev, { id: aiMessageId!, sender: Sender.AI, text: '' }]);
        }

        if (chunk.textChunk) {
          accumulatedText += chunk.textChunk;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
          ));
        }

        if (chunk.sources) {
          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, sources: chunk.sources } : msg
          ));
        }
        
        if (chunk.error) {
           const errorMessage = chunk.error;
           if (aiMessageId) {
             setMessages(prev => prev.map(msg => 
               msg.id === aiMessageId ? { ...msg, text: errorMessage } : msg
             ));
           } else {
             // Error happened before we could even create a message
             setIsLoading(false);
             setMessages(prev => [...prev, { id: uuidv4(), sender: Sender.AI, text: errorMessage }]);
           }
           break; // Exit loop on error
        }
      }

      // If stream was empty for some reason, ensure loading is off
      if (aiMessageId === null) {
        setIsLoading(false);
      }

    } catch (error) {
        console.error("Error processing stream in useChat:", error);
        setIsLoading(false);
        const errorMsg: Message = { 
            id: aiMessageId || uuidv4(), 
            sender: Sender.AI, 
            text: "I'm having trouble connecting right now. Please check your connection or try sending that again in a moment."
        };
        // If message bubble was already created, update it. Otherwise, add a new one.
        if (aiMessageId) {
            setMessages(prev => prev.map(m => m.id === aiMessageId ? errorMsg : m));
        } else {
            setMessages(prev => [...prev, errorMsg]);
        }
    }
    
    return true; // Success from the input's perspective, clear it
  }, [isLoading, isLimitReached, userLocation, usageCount, messages, isAwaitingLocation]);

  const clearChat = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      if (visitorId) {
        localStorage.removeItem(`session_${visitorId}`);
      }
      setUserLocation(null);
      setIsAwaitingLocation(true);
      setMessages([INITIAL_MESSAGE_LOCATION]);
    }
  }, [visitorId]);

  return { messages, isLoading, sendMessage, usageCount, isLimitReached, isAwaitingLocation, clearChat, locationError };
};