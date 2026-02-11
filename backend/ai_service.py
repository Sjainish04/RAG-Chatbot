import os
import google.generativeai as genai
from openai import AsyncOpenAI
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load API Key from .env file
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Configure Gemini for Embeddings
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
else:
    logger.error("❌ GOOGLE_API_KEY not found!")

# Configure OpenRouter for Chat
# If no key is provided, it might fail, but we'll initialize the client
client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY or "PASTE_YOUR_OPENROUTER_KEY_HERE",
)

class AIService:
    def __init__(self):
        # Gemini Embedding Model (Consistent with our DB schema)
        self.embedding_model = "models/gemini-embedding-001"
        
        # OpenRouter Model (You can change this to any model on OpenRouter)
        # Examples: "google/gemini-2.0-flash-001", "mistralai/mistral-7b-instruct", "meta-llama/llama-3-8b-instruct:free"
        self.chat_model_name = "google/gemini-2.0-flash-001"
        logger.info(f"✅ AIService initialized with OpenRouter ({self.chat_model_name}) and Gemini Embeddings")

    async def get_embedding(self, text: str):
        try:
            result = await genai.embed_content_async(
                model=self.embedding_model,
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"❌ Gemini Embedding Error: {e}")
            raise

    async def get_query_embedding(self, query: str):
        try:
            result = await genai.embed_content_async(
                model=self.embedding_model,
                content=query,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"❌ Gemini Query Embedding Error: {e}")
            raise

    async def generate_response(self, prompt: str, stream: bool = False):
        """
        Generates a response using OpenRouter (OpenAI-compatible).
        """
        try:
            if not OPENROUTER_API_KEY:
                return "Error: OPENROUTER_API_KEY is missing in .env file."

            response = await client.chat.completions.create(
                model=self.chat_model_name,
                messages=[{"role": "user", "content": prompt}],
                stream=stream,
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000", # Optional, for OpenRouter rankings
                    "X-Title": "Gemini RAG Local", # Optional
                }
            )
            
            if stream:
                return self._stream_generator(response)
            else:
                return response.choices[0].message.content
        except Exception as e:
            logger.error(f"❌ OpenRouter Error: {e}")
            raise

    async def _stream_generator(self, response):
        """Helper to normalize OpenRouter stream to match our backend expectation"""
        async for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                # We wrap it in an object with a .text property to match 
                # what main.py expects from the previous Gemini SDK implementation
                class ChunkWrap:
                    def __init__(self, text):
                        self.text = text
                yield ChunkWrap(content)

# Singleton instance
ai_service = AIService()