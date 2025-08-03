import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ChatMessage } from '@/@types/types';

interface ChatContextType {
  // Chat state
  chatMessages: ChatMessage[];
  isTyping: boolean;

  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
  setTyping: (isTyping: boolean) => void;
  removeTypingMessages: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const addChatMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    console.log('💬 Added chat message:', newMessage.type);
  }, []);

  const clearChatHistory = useCallback(() => {
    console.log('🧹 Clearing chat history');
    setChatMessages([]);
    setIsTyping(false);
  }, []);

  const setTyping = useCallback((typing: boolean) => {
    setIsTyping(typing);
  }, []);

  const removeTypingMessages = useCallback(() => {
    setChatMessages((prev) => prev.filter((msg) => msg.type !== 'typing'));
    setIsTyping(false);
  }, []);

  const value: ChatContextType = {
    chatMessages,
    isTyping,
    addChatMessage,
    clearChatHistory,
    setTyping,
    removeTypingMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
