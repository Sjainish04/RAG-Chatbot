/**
 * MESSAGE INPUT COMPONENT
 *
 * Input field where users type their questions
 *
 * Features:
 * - Text input field
 * - Send button
 * - Enter key to send
 * - Disabled during loading
 *
 * Props:
 * - onSend: Callback function when user sends a message
 * - isLoading: Whether the AI is currently responding
 */

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function MessageInput({ onSend, isLoading }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      <div className={`
        relative flex items-end gap-2 p-2 rounded-2xl bg-white border border-gray-200 shadow-lg transition-all duration-200
        ${isLoading ? 'bg-gray-50' : 'focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50'}
      `}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={isLoading}
          rows={1}
          className="flex-1 max-h-[200px] min-h-[44px] resize-none bg-transparent border-none px-4 py-3 text-[15px] focus:ring-0 outline-none disabled:cursor-not-allowed"
        />

        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className={`
            flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200
            ${isLoading || !input.trim() 
              ? 'bg-gray-100 text-gray-400' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 active:scale-95'}
          `}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest">
        Shift + Enter for new line • Gemini RAG v1.0
      </p>
    </div>
  );
}
