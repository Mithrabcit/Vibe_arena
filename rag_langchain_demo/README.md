# RAG Demo with LangChain

A simple Retrieval‑Augmented Generation (RAG) system built with LangChain, FAISS, and a local LLM.

## Features
- Load `.txt`/`.md` documents from `data/`
- Build a FAISS vector store with sentence‑transformers embeddings
- Retrieve top‑k relevant chunks
- Generate answers using a HuggingFace LLM (placeholder) via LangChain
- Minimal FastAPI web UI (dark‑mode, glassmorphism)

## Setup
```bash
pip install -r requirements.txt
python ingest.py  # build the index (creates `faiss_index.pkl`)
uvicorn app:app --reload  # start the server
```

Open `http://127.0.0.1:8000` in a browser.
