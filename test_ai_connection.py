import asyncio
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai_service import ai_service

async def main():
    print("🧪 Testing AI Service...")
    
    # 1. Test Embedding
    text = "This is a test document about RAG systems."
    print(f"\nGenerating embedding for: '{text}'")
    try:
        embedding = await ai_service.get_embedding(text)
        print(f"✅ Embedding generated! Length: {len(embedding)}")
        assert len(embedding) == 3072, "Embedding length should be 3072"
    except Exception as e:
        print(f"❌ Embedding failed: {e}")
        return

    # 2. Test Generation
    print("\nTesting LLM Generation...")
    try:
        response = await ai_service.generate_response("Hello, are you working?", stream=False)
        print(f"✅ Response received: {response}")
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        return

    print("\n✅ AI Service checks passed!")

if __name__ == "__main__":
    asyncio.run(main())
