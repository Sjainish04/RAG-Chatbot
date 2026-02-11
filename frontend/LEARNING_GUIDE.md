# RAG Frontend - Learning Guide

## 🎯 Project Overview

This is a **React + TypeScript + Vite** frontend for our RAG (Retrieval-Augmented Generation) chatbot system.

### Tech Stack
- **React 18**: UI library for building component-based interfaces
- **TypeScript**: Adds type safety to JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework for styling

---

## 📁 Project Structure Explained

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Chat.tsx         # Main chat interface
│   │   ├── MessageList.tsx  # Displays chat messages
│   │   ├── MessageInput.tsx # Input field for questions
│   │   ├── DocumentUpload.tsx # Upload documents
│   │   └── SourceTag.tsx    # Shows document sources
│   │
│   ├── services/            # Backend API communication
│   │   └── api.ts           # All API calls to backend
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Shared types/interfaces
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useChat.ts       # Chat logic and state
│   │
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles (Tailwind)
│
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── tailwind.config.js       # Tailwind configuration
```

---

## 🏗️ Architecture Explained

### 1. **Components** (UI Pieces)
Think of components as LEGO blocks. Each component is a reusable piece of UI:
- `Chat.tsx` - The main container (like a chatbot window)
- `MessageList.tsx` - Shows all messages (your conversation history)
- `MessageInput.tsx` - Where you type questions
- `DocumentUpload.tsx` - Upload documents to the RAG system

### 2. **Services** (Backend Communication)
The service layer talks to our Python backend:
- Sends HTTP requests
- Handles responses
- Manages streaming data (real-time AI responses)

### 3. **Types** (Data Shapes)
TypeScript types define what our data looks like:
```typescript
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  sources?: string[];
}
```

### 4. **Hooks** (Reusable Logic)
Custom hooks contain logic we want to reuse:
- `useChat` - Manages chat state, sends messages, receives responses

---

## 🔄 How Data Flows

```
User types question
       ↓
MessageInput component
       ↓
useChat hook (state management)
       ↓
API service (HTTP request)
       ↓
Backend (Python FastAPI)
       ↓
AI generates answer (streaming)
       ↓
API service receives chunks
       ↓
useChat updates state
       ↓
MessageList shows new message
```

---

## 💬 Chat History Implementation

To add chat history (save/load previous conversations), you need:

### Option 1: **Browser Local Storage** (Simplest)
```typescript
// Save chat
localStorage.setItem('chatHistory', JSON.stringify(messages));

// Load chat
const saved = localStorage.getItem('chatHistory');
const messages = saved ? JSON.parse(saved) : [];
```

**Pros**: Simple, no backend needed
**Cons**: Only stored in browser, cleared if cache is cleared

### Option 2: **Backend Database** (Recommended)
Add to your backend:
```python
# New database model
class ChatSession(Base):
    id: int
    created_at: datetime
    messages: list[Message]

# New endpoints
POST /sessions       # Create new chat
GET /sessions        # List all chats
GET /sessions/{id}   # Load specific chat
```

**Pros**: Persistent, accessible from any device
**Cons**: More complex, requires backend changes

### Option 3: **Hybrid Approach**
- Save to localStorage immediately (instant)
- Sync to backend periodically (persistent)

---

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎨 Styling with Tailwind

Tailwind uses utility classes:
```tsx
<div className="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg shadow-md">
```

Breaking down:
- `flex` - display: flex
- `items-center` - align-items: center
- `p-4` - padding: 1rem
- `bg-blue-500` - background-color: blue
- `rounded-lg` - border-radius: large
- `shadow-md` - box-shadow: medium

---

## 🔌 Connecting to Backend

The backend runs on `http://localhost:8000`

API endpoints:
- `POST /ingest` - Upload documents
- `POST /ask` - Ask questions
- `GET /documents` - List uploaded documents

In our code:
```typescript
const response = await fetch('http://localhost:8000/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question })
});
```

---

## 📚 Key Concepts to Learn

### 1. **React State**
State is data that changes over time:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
```

### 2. **React Effects**
Effects run code when component mounts or updates:
```typescript
useEffect(() => {
  // Load saved messages
}, []);
```

### 3. **Async/Await**
Handle asynchronous operations:
```typescript
const data = await fetch(url);
```

### 4. **Event-Driven Streaming**
Real-time data from backend using Server-Sent Events (SSE):
```typescript
const eventSource = new EventSource(url);
eventSource.onmessage = (event) => {
  // Handle incoming data
};
```

---

## 🎓 Next Steps

1. Read through each component file
2. Understand the data flow
3. Try modifying styles
4. Add new features like:
   - Dark mode toggle
   - Message reactions
   - Code syntax highlighting
   - File upload progress

---

Happy coding! 🚀
