/**
 * TYPE DEFINITIONS
 *
 * This file defines the "shape" of our data using TypeScript interfaces.
 * Think of interfaces as blueprints that describe what properties an object should have.
 */

// ============================================
// MESSAGE TYPES
// ============================================

/**
 * Represents a single message in the chat
 *
 * @property id - Unique identifier for the message (e.g., "msg_123")
 * @property content - The actual text content
 * @property role - Who sent it: 'user' (you) or 'assistant' (AI)
 * @property sources - Array of document sources used for the answer (optional)
 * @property timestamp - When the message was sent
 */
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';  // Union type: can ONLY be one of these two values
  sources?: string[];           // '?' means optional
  timestamp: Date;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/**
 * Data we send when asking a question
 */
export interface AskRequest {
  question: string;
}

/**
 * Data we send when ingesting a document
 */
export interface IngestRequest {
  text: string;
  source: string;
}

/**
 * Response from the /ingest endpoint
 */
export interface IngestResponse {
  status: string;
  chunks_processed: number;
  source: string;
}

/**
 * Chunks of data we receive from the streaming /ask endpoint
 * The backend sends JSON like: { "sources": [...] } or { "answer": "..." }
 */
export interface StreamChunk {
  sources?: string[];
  answer?: string;
  error?: string;
}

/**
 * Document info from /documents endpoint
 */
export interface DocumentInfo {
  id: number;
  source: string;
  content_preview: string;
}

export interface DocumentsResponse {
  total: number;
  documents: DocumentInfo[];
}

// ============================================
// CHAT STATE
// ============================================

/**
 * The overall state of our chat interface
 * This helps us manage loading states and errors
 */
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
