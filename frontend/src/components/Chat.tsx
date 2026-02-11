/**
 * MAIN CHAT COMPONENT
 *
 * This is the main container that brings everything together
 *
 * Structure:
 * - Header with title and clear button
 * - MessageList to display conversation
 * - MessageInput for user to type
 * - Error display if something goes wrong
 *
 * Uses:
 * - useChat hook for managing state and logic
 * - Child components for rendering UI
 */

import { useChat } from '../hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function Chat() {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Sub Header / Action Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-blue-${i * 100 + 300} flex items-center justify-center text-[10px] font-bold text-white`}>
                AI
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Knowledge Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">Active Session</span>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-xs font-semibold text-gray-500 hover:text-red-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Conversation
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-shake">
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-hidden relative">
        <MessageList messages={messages} />
      </div>

      {/* Message Input - with max-width container for better readability */}
      <div className="w-full max-w-4xl mx-auto pb-6 px-6">
        <MessageInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
