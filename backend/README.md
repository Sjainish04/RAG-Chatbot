# Simple RAG Backend

A clean, working Retrieval-Augmented Generation (RAG) system using FastAPI, PostgreSQL with pgvector, and Google Gemini AI.

## Features

- **Document Ingestion**: Store documents with automatic chunking and embedding generation
- **Semantic Search**: Find relevant documents using vector similarity search
- **Streaming Responses**: Real-time answer generation with source citations
- **Simple Architecture**: Easy to understand and modify

## Project Structure

```
backend/
├── main.py           # FastAPI application with all endpoints
├── ai_service.py     # Google Gemini AI integration
├── database.py       # Database connection setup
├── models.py         # SQLAlchemy Document model
├── reset_db.py       # Utility to reset database
├── .env              # Environment variables (not in git)
└── .env.example      # Example environment configuration
```

## Setup

### Prerequisites
- Python 3.13+
- PostgreSQL with pgvector extension
- Docker & Docker Compose (for PostgreSQL)
- Google Gemini API key

### Installation

1. **Start PostgreSQL with pgvector**
   ```bash
   cd ..
   docker-compose up -d
   ```

2. **Create virtual environment**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install fastapi uvicorn sqlalchemy asyncpg python-dotenv pydantic pgvector google-generativeai
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your GOOGLE_API_KEY
   ```

5. **Reset database** (if needed)
   ```bash
   python reset_db.py
   ```

## Running the Application

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### `GET /`
Health check endpoint
```bash
curl http://localhost:8000/
```

### `POST /ingest`
Ingest documents into the system
```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your document text here...",
    "source": "document-name"
  }'
```

### `POST /ask`
Ask questions using RAG
```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Python?"}'
```

Returns a streaming response with sources and answer.

### `GET /documents`
List all documents in the database
```bash
curl http://localhost:8000/documents
```

### `GET /docs`
Interactive API documentation (Swagger UI)
```
http://localhost:8000/docs
```

## How It Works

1. **Ingestion**: Text is split into chunks, embedded using Google Gemini, and stored in PostgreSQL
2. **Retrieval**: Questions are embedded and similar documents are found using vector search
3. **Generation**: Retrieved context is sent to Gemini to generate an answer with citations

## Configuration

Edit `.env` to customize:
- `GOOGLE_API_KEY`: Your Google Gemini API key (required)
- `DATABASE_URL`: PostgreSQL connection string

## Database Reset

To clear all documents and reset the database:
```bash
python reset_db.py
```

## Troubleshooting

### Database Connection Error
Make sure PostgreSQL is running:
```bash
docker ps
```

If not running:
```bash
cd ..
docker-compose up -d
```

### API Key Error
Make sure your Google Gemini API key is set in `.env`

## Technologies Used

- **FastAPI**: Modern web framework for building APIs
- **PostgreSQL + pgvector**: Vector database for similarity search
- **Google Gemini**: AI for embeddings and text generation
- **SQLAlchemy**: Database ORM
- **Pydantic**: Data validation

## License

MIT
