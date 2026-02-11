def get_chunks(text: str, max_size: int = 800, overlap: int = 150):
    """
    Split text into chunks with overlap for better context preservation.
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + max_size
        chunk = text[start:end]

        # Try to find a clean break at word boundary
        if end < len(text):
            last_space = chunk.rfind(" ")
            if last_space != -1:
                chunk = chunk[:last_space]
                end = start + last_space

        chunks.append(chunk.strip())
        start = end - overlap

        # Ensure we always move forward
        if start <= end - max_size:
            start = end

    return [c for c in chunks if len(c) > 10]
