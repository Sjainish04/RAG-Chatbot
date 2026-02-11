/**
 * CUSTOM CHAT HOOK
 *
 * This is a custom React hook that manages all chat-related state and logic.
 *
 * What is a hook?
 * - A function that "hooks into" React features
 * - Can use state, effects, and other hooks
 * - Must start with "use" (e.g., useState, useEffect, useChat)
 *
 * Why create a custom hook?
 * - Separates logic from UI
 * - Reusable across components
 * - Easier to test
 * - Keeps components clean and focused on rendering
 */

import { useState, useCallback } from 'react';
import { askQuestion } from '../services/api';
import type { Message, ChatState } from '../types';

/**
 * Generate a unique ID for messages
 * Uses timestamp + random number to ensure uniqueness
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * useChat Hook
 *
 * This hook provides:
 * - messages: Array of all chat messages
 * - isLoading: Whether AI is currently responding
 * - error: Any error message
 * - sendMessage: Function to send a new message
 * - clearMessages: Function to clear chat history
 */
export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      content: question,
      role: 'user',
      timestamp: new Date(),
    };

    const assistantMsgId = generateId();
    const assistantMessage: Message = {
      id: assistantMsgId,
      content: '',
      role: 'assistant',
      sources: [],
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      isLoading: true,
      error: null,
    }));

    try {
      await askQuestion(
        { question },
        (chunk) => {
          setState((prev) => {
            const newMessages = prev.messages.map((msg) => {
              if (msg.id === assistantMsgId) {
                const updatedMsg = { ...msg };
                if (chunk.sources) {
                  updatedMsg.sources = [...(updatedMsg.sources || []), ...chunk.sources];
                  // Remove duplicates
                  updatedMsg.sources = [...new Set(updatedMsg.sources)];
                }
                if (chunk.answer) {
                  updatedMsg.content += chunk.answer;
                }
                return updatedMsg;
              }
              return msg;
            });

            return { ...prev, messages: newMessages };
          });
        },
        () => {
          setState((prev) => ({ ...prev, isLoading: false }));
        },
        (error) => {
          console.error('Chat error:', error);
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message,
            // Keep the partial message but mark it with error if you want, 
            // or just leave it.
          }));
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to send message',
      }));
    }
  }, []);
  // Empty dependency array: function never changes

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
    });
  }, []);

  // Return state and functions to be used by components
  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearMessages,
  };
}
