'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
          isUser ? 'bg-[var(--primary)]' : 'bg-teal-500'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-[var(--primary)] text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
        )}
      >
        <div className="text-sm whitespace-pre-wrap break-words">
          {formatMessageContent(message.content)}
        </div>
        <div
          className={cn(
            'text-xs mt-1',
            isUser ? 'text-blue-200' : 'text-gray-400'
          )}
        >
          {new Date(message.created_at).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

// Simple markdown-like formatting
function formatMessageContent(content: string): React.ReactNode {
  // Split by code blocks first
  const parts = content.split(/```[\s\S]*?```/g);

  // Handle bold text and line breaks
  return parts.map((part, index) => (
    <span key={index}>
      {part.split(/\*\*(.*?)\*\*/g).map((text, i) =>
        i % 2 === 1 ? <strong key={i}>{text}</strong> : text
      )}
    </span>
  ));
}
