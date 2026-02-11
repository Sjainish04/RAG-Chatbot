/**
 * MESSAGE LIST COMPONENT
 *
 * Displays all chat messages in a scrollable container
 *
 * Features:
 * - Auto-scroll to bottom when new message arrives
 * - Different styling for user vs assistant messages
 * - Shows sources for assistant messages
 * - Formatting for message content
 *
 * Props:
 * - messages: Array of all messages to display
 */

import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { SourceTag } from './SourceTag';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
          <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Hi I am RAG Chatbot</h3>
        <p className="text-gray-500 max-w-sm">
          Upload documents on the left to start chatting with your data.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
      <div className="max-w-4xl mx-auto space-y-8 pb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                {message.role === 'user' ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </div>

              {/* Bubble */}
              <div className="space-y-2">
                <div
                  className={`rounded-2xl px-5 py-3.5 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                    {message.content || (
                      <div className="flex gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta info */}
                <div className={`flex items-center gap-3 px-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                    <SourceTag sources={message.sources} />
                  )}
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {message.timestamp instanceof Date 
                      ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
