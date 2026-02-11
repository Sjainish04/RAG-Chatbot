"""
Simple database models for RAG system.
"""
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from database import Base


class Document(Base):
    """
    Simple document model for RAG.
    Stores text chunks with embeddings for semantic search.
    """
    __tablename__ = "documents"
    __table_args__ = {'extend_existing': True}

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # The actual text content used for RAG context
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Source identifier (e.g., "manual.pdf", "page 12")
    source: Mapped[str] = mapped_column(String, nullable=False, index=True)

    # Vector embedding (3072 dimensions for gemini-embedding-001)
    embedding = mapped_column(Vector(3072), nullable=False)

    def __repr__(self):
        return f"<Document(id={self.id}, source={self.source})>"

