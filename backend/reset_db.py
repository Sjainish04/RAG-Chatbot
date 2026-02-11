import asyncio
from database import engine
from sqlalchemy import text

async def reset():
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS documents"))
        print("Table 'documents' dropped successfully.")

if __name__ == "__main__":
    asyncio.run(reset())
