"""
Simple RAG Backend with FastAPI.
Provides document ingestion and question-answering with semantic search and conversation memory.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession
import json
import io
from pypdf import PdfReader

from database import engine, Base, get_db
from models import Document
from ai_service import ai_service
from utils import get_chunks


# Startup/Shutdown handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database initialized!")
    yield
    print("👋 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Simple RAG Backend",
    description="A simple, working RAG system",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def process_text_and_ingest(text: str, source: str, db: AsyncSession):
    """
    Common logic to chunk text and store in database with rate-limit handling.
    """
    import asyncio
    chunks = get_chunks(text, max_size=800, overlap=150)
    print(f"📄 Processing {len(chunks)} chunks from source: {source}")

    for i, chunk in enumerate(chunks):
        # Retry logic for embeddings
        max_retries = 3
        for attempt in range(max_retries):
            try:
                vector = await ai_service.get_embedding(chunk)
                doc = Document(
                    content=chunk,
                    source=source,
                    embedding=vector
                )
                db.add(doc)
                break # Success
            except Exception as e:
                if "429" in str(e) and attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2
                    print(f"⚠️ Rate limit hit, waiting {wait_time}s... (Chunk {i+1}/{len(chunks)})")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"❌ Permanent error at chunk {i+1}: {e}")
                    raise

        # Small delay between every few chunks to stay under RPM limits
        if i % 5 == 0 and i > 0:
            await asyncio.sleep(0.5)

    await db.commit()
    print(f"✅ Successfully ingested {len(chunks)} chunks from {source}")
    return len(chunks)


# --- Request/Response Models ---

class IngestRequest(BaseModel):
    text: str
    source: str = "manual"


class AskRequest(BaseModel):
    question: str
    history: list[dict] = [] # List of {"role": "user/assistant", "content": "..."}


# --- API Endpoints ---

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Simple RAG Backend is running!",
        "version": "1.0.0",
        "endpoints": {
            "ingest": "/ingest",
            "ingest-file": "/ingest-file",
            "ask": "/ask",
            "docs": "/docs"
        }
    }


@app.post("/ingest")
async def ingest_data(request: IngestRequest, db: AsyncSession = Depends(get_db)):
    """
    Ingest text data into the RAG system.
    """
    try:
        chunks_count = await process_text_and_ingest(request.text, request.source, db)
        return {
            "status": "success",
            "chunks_processed": chunks_count,
            "source": request.source
        }
    except Exception as e:
        await db.rollback()
        print(f"❌ Ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest-file")
async def ingest_file(
    file: UploadFile = File(...),
    source: str = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest text or PDF file into the RAG system.
    """
    try:
        source_name = source or file.filename
        content = ""

        if file.content_type == "application/pdf" or file.filename.endswith(".pdf"):
            # Process PDF
            pdf_content = await file.read()
            pdf_reader = PdfReader(io.BytesIO(pdf_content))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    content += page_text + "\n"
        elif file.content_type == "text/plain" or file.filename.endswith(".txt"):
            # Process text file
            text_content = await file.read()
            content = text_content.decode("utf-8")
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Only PDF and TXT are supported."
            )

        if not content.strip():
            raise HTTPException(status_code=400, detail="File is empty or no text could be extracted.")

        chunks_count = await process_text_and_ingest(content, source_name, db)

        return {
            "status": "success",
            "chunks_processed": chunks_count,
            "source": source_name,
            "filename": file.filename
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"❌ File ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask")
async def ask_question(request: AskRequest, db: AsyncSession = Depends(get_db)):
    """
    Ask a question using RAG with conversation memory and precise citations.
    """
    try:
        print(f"❓ Question: {request.question}")

        # Get query embedding
        question_vector = await ai_service.get_query_embedding(request.question)

        # Find top 5 most relevant documents with a tighter similarity threshold
        threshold = 0.5
        stmt = select(Document).where(
            Document.embedding.cosine_distance(question_vector) < threshold
        ).order_by(
            Document.embedding.cosine_distance(question_vector)
        ).limit(5)
        
        result = await db.execute(stmt)
        related_docs = result.scalars().all()

        # Build context with clear source mapping
        context_text = ""
        source_map = {}
        if related_docs:
            print(f"📚 Found {len(related_docs)} relevant documents")
            
            # Map unique sources to numbers [1], [2], etc.
            unique_sources = []
            for doc in related_docs:
                if doc.source not in unique_sources:
                    unique_sources.append(doc.source)
            
            source_map = {name: i+1 for i, name in enumerate(unique_sources)}
            
            context_blocks = []
            for doc in related_docs:
                s_id = source_map[doc.source]
                # Extremely explicit labeling to prevent source confusion
                context_blocks.append(f"--- START REFERENCE [{s_id}] (FILE: {doc.source}) ---\n{doc.content}\n--- END REFERENCE [{s_id}] ---")
            context_text = "\n\n---\n\n".join(context_blocks)

        # Format conversation history for the prompt
        history_text = ""
        if request.history:
            for msg in request.history[-6:]: # Keep last 6 messages
                role = "User" if msg["role"] == "user" else "Assistant"
                history_text += f"{role}: {msg['content']}\n"

        # Generate streaming response
        async def generate_answer():
            # Send source mapping first
            sources = list(source_map.keys())
            yield f"data: {json.dumps({'sources': sources})}\n\n"

            # Create prompt
            source_list_str = "\n".join([f"[{i}]: {name}" for name, i in source_map.items()])
            
            prompt = f"""
You are a precision-oriented AI assistant with access to a Knowledge Base and Conversation History.

CONVERSATION HISTORY:
{history_text if history_text else "No previous history."}

KNOWLEDGE BASE CONTEXT (Use these for specific facts):
{context_text if context_text else "No relevant context found."}

SOURCE KEY (Reference IDs for citations):
{source_list_str if source_map else "None."}

CRITICAL INSTRUCTIONS:
1. CITATION ACCURACY: 
   - Every fact you take from the Context MUST be cited immediately with its REFERENCE ID, e.g., "The release is in October [1]."
   - Verify the SOURCE FILE and REFERENCE ID carefully. DO NOT attribute everything to [1] if it came from a different reference block.
   - If a fact is not in the context, do NOT use a citation number.
2. CONVERSATION CONTEXT: Use the Conversation History to understand pronouns like "that," "it," or "the previous document."
3. BE HELPFUL: Always answer the question. If context is missing, use your general knowledge (without citations).
4. STRUCTURE: Use clear paragraphs and **bold text** for key names/terms.

QUESTION:
{request.question}
"""

            # Stream the AI response
            response = await ai_service.generate_response(prompt, stream=True)

            async for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'answer': chunk.text})}\n\n"

        return StreamingResponse(generate_answer(), media_type="text/event-stream")

    except Exception as e:
        print(f"❌ Error processing question: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents")
async def list_documents(db: AsyncSession = Depends(get_db)):
    """List all documents in the database."""
    try:
        stmt = select(Document)
        result = await db.execute(stmt)
        documents = result.scalars().all()

        return {
            "total": len(documents),
            "documents": [
                {
                    "id": doc.id,
                    "source": doc.source,
                    "content_preview": doc.content[:100] + "..." if len(doc.content) > 100 else doc.content
                }
                for doc in documents
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/documents/{source}")
async def delete_document(source: str, db: AsyncSession = Depends(get_db)):
    """Delete all chunks associated with a specific source."""
    try:
        from sqlalchemy import delete
        stmt = delete(Document).where(Document.source == source)
        await db.execute(stmt)
        await db.commit()
        return {"status": "success", "message": f"Deleted all records for source: {source}"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication."""
    await websocket.accept()
    print("🔌 WebSocket client connected")
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        print("🔌 WebSocket client disconnected")
