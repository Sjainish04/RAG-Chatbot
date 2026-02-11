/**
 * API SERVICE
 *
 * This file handles ALL communication with our Python backend.
 * It's like a "translator" between the frontend and backend.
 *
 * Why separate this into its own file?
 * - Reusability: Use these functions anywhere in our app
 * - Maintainability: All API logic in one place
 * - Testing: Easy to mock/test API calls
 */

import type {
  AskRequest,
  IngestRequest,
  IngestResponse,
  DocumentsResponse,
  StreamChunk,
} from '../types';

// ============================================
// CONFIGURATION
// ============================================

/**
 * Base URL of our backend API
 * Change this if your backend runs on a different port
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generic function to make HTTP requests
 * This is a wrapper around the native fetch API
 *
 * @param endpoint - API endpoint (e.g., '/ingest')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Parsed JSON response
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    // Make the HTTP request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    // Check if the response was successful (status 200-299)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // Parse and return the JSON response
    return await response.json();
  } catch (error) {
    // Re-throw error with more context
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * INGEST DOCUMENT
 *
 * Sends a document to the backend to be processed and stored
 *
 * How it works:
 * 1. User provides text and source name
 * 2. Backend splits text into chunks
 * 3. Backend generates embeddings for each chunk
 * 4. Backend stores in vector database
 *
 * @param request - Document text and source
 * @returns Number of chunks processed
 */
export async function ingestDocument(
  request: IngestRequest
): Promise<IngestResponse> {
  return apiRequest<IngestResponse>('/ingest', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * INGEST FILE
 *
 * Sends a file (PDF or TXT) to the backend to be processed and stored
 *
 * @param file - The file to upload
 * @param source - Optional source name
 * @returns Number of chunks processed
 */
export async function ingestFile(
  file: File,
  source?: string
): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (source) {
    formData.append('source', source);
  }

  const response = await fetch(`${API_BASE_URL}/ingest-file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * ASK QUESTION (STREAMING)
 *
 * Asks a question and receives a STREAMING response
 * This means the answer arrives in real-time, chunk by chunk
 *
 * How streaming works:
 * 1. Backend finds relevant documents from vector DB
 * 2. Backend streams AI-generated answer
 * 3. Frontend receives answer chunks and displays them progressively
 *
 * We use Server-Sent Events (SSE) for streaming:
 * - Server pushes data to client
 * - Connection stays open
 * - Data arrives in chunks prefixed with "data: "
 *
 * @param request - User's question
 * @param onChunk - Callback function called for each chunk received
 * @param onComplete - Callback when streaming is complete
 * @param onError - Callback when an error occurs
 */
export async function askQuestion(
  request: AskRequest,
  onChunk: (chunk: StreamChunk) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    // Make the POST request
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the response body as a readable stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    // Text decoder to convert binary data to string
    const decoder = new TextDecoder();
    let buffer = '';

    // Read the stream chunk by chunk
    while (true) {
      const { done, value } = await reader.read();

      // If stream is finished, process remaining buffer and exit
      if (done) {
        if (buffer) {
          processLines(buffer, onChunk);
        }
        onComplete();
        break;
      }

      // Convert binary chunk to text and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines from buffer
      const lastNewlineIndex = buffer.lastIndexOf('\n');
      if (lastNewlineIndex !== -1) {
        const completeLines = buffer.slice(0, lastNewlineIndex);
        buffer = buffer.slice(lastNewlineIndex + 1);
        processLines(completeLines, onChunk);
      }
    }
  } catch (error) {
    onError(error as Error);
  }
}

/**
 * Helper to process SSE lines
 */
function processLines(text: string, onChunk: (chunk: StreamChunk) => void) {
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line.trim() || !line.startsWith('data: ')) {
      continue;
    }

    try {
      const jsonStr = line.slice(6).trim();
      if (jsonStr) {
        const data = JSON.parse(jsonStr) as StreamChunk;
        onChunk(data);
      }
    } catch (e) {
      console.warn('Failed to parse chunk:', line, e);
    }
  }
}

/**
 * GET DOCUMENTS
 *
 * Fetches list of all documents in the database
 *
 * @returns List of documents with previews
 */
export async function getDocuments(): Promise<DocumentsResponse> {
  return apiRequest<DocumentsResponse>('/documents');
}

/**
 * DELETE DOCUMENT
 *
 * Removes all chunks associated with a specific source name
 */
export async function deleteDocument(source: str): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(source)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * CHECK HEALTH
 *
 * Pings the backend to check if it's running
 *
 * @returns Health check response
 */
export async function checkHealth(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/');
}
