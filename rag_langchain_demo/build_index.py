import os
from pathlib import Path

# Import components from the pipeline module
import pipeline

def main():
    # Ensure data directory exists
    if not pipeline.DATA_PATH.exists():
        print(f"Data directory not found: {pipeline.DATA_PATH}")
        return

    # Build index if it doesn't exist
    if not pipeline.INDEX_PATH.exists():
        print("Building FAISS index...")
        raw_docs = pipeline.load_documents()
        docs = pipeline.split_documents(raw_docs)
        vectorstore = pipeline.FAISS.from_documents(docs, pipeline.embeddings)
        vectorstore.save_local(str(pipeline.INDEX_PATH))
        print("FAISS index created at", pipeline.INDEX_PATH)
    else:
        print("FAISS index already exists at", pipeline.INDEX_PATH)

if __name__ == "__main__":
    main()
