import asyncio
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import engine, Base, AsyncSessionLocal
from backend.models import Document
from backend.ai_service import ai_service
from backend.utils import get_chunks
from sqlalchemy import text, select

async def process_text_and_ingest(text_content, source, db):
    chunks = get_chunks(text_content)
    print(f"📄 Processing {len(chunks)} chunks...")
    
    for chunk in chunks:
        vector = await ai_service.get_embedding(chunk)
        doc = Document(
            content=chunk,
            source=source,
            embedding=vector
        )
        db.add(doc)
    await db.commit()
    return len(chunks)

async def main():
    print("🚀 Starting Full RAG Logic Test...")
    
    # 1. Setup Database
    async with engine.begin() as conn:
        print("🛠️ Creating extension and tables...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as db:
        # 2. Ingest Data
        fact_source = "secret_memo_001"
        fact_text = "The password for the secret vault is 'GOLDEN_ELEPHANT_2026'. This vault is located in the basement of the abandoned lighthouse."
        print(f"\n📥 Ingesting fact: '{fact_text}'")
        count = await process_text_and_ingest(fact_text, fact_source, db)
        print(f"✅ Ingested {count} chunks.")

        # 3. Retrieve and Generate
        question = "What is the password for the secret vault and where is it located?"
        print(f"\n❓ Question: '{question}'")
        
        # Retrieval
        question_vector = await ai_service.get_query_embedding(question)
        stmt = select(Document).order_by(
            Document.embedding.l2_distance(question_vector)
        ).limit(3)
        result = await db.execute(stmt)
        related_docs = result.scalars().all()
        
        print(f"📚 Found {len(related_docs)} relevant chunks.")
        for i, doc in enumerate(related_docs):
            print(f"   Chunk {i+1} from {doc.source}: {doc.content[:50]}...")

        # Generation
        context = "\n\n".join([f"[[SOURCE: {d.source}]]\n{d.content}" for d in related_docs])
        prompt = f"""
        Answer the question using ONLY the provided context.
        CONTEXT:
        {context}
        
        QUESTION:
        {question}
        """
        
        print("\n🤖 Generating answer...")
        answer = await ai_service.generate_response(prompt)
        print(f"\n✨ ANSWER:\n{answer}")
        
        if "GOLDEN_ELEPHANT_2026" in answer and "lighthouse" in answer.lower():
            print("\n✅ RAG SUCCESS: The LLM correctly used the ingested context!")
        else:
            print("\n❌ RAG FAILURE: The LLM did not provide the correct answer from context.")

if __name__ == "__main__":
    asyncio.run(main())
