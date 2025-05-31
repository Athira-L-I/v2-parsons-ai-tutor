import React from 'react';
import { ChatMessage as ChatMessageType } from '@/@types/types';

interface ChatMessageProps {
  message: ChatMessageType;
  className?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  className = '',
}) => {
  const { role, content, timestamp, isTyping } = message;

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isStudent = role === 'student';

  return (
    <div
      className={`flex w-full mb-3 ${
        isStudent ? 'justify-end' : 'justify-start'
      } ${className}`}
    >
      <div
        className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-lg ${
          isStudent
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Role indicator */}
        <div
          className={`text-xs font-medium mb-1 ${
            isStudent ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {role === 'student' ? 'You' : 'AI Tutor'}
        </div>

        {/* Message content */}
        <div className="text-sm leading-relaxed">
          {isTyping ? (
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
              <span className="ml-2">typing...</span>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>

        {/* Timestamp */}
        {!isTyping && (
          <div
            className={`text-xs mt-1 ${
              isStudent ? 'text-blue-100' : 'text-gray-400'
            }`}
          >
            {formatTimestamp(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
