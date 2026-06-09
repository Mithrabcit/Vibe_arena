import os
from pathlib import Path

from langchain.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.llms import HuggingFacePipeline

# Paths
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data"
INDEX_PATH = BASE_DIR / "faiss_index"

# 1. Load documents from the data directory (all .txt files)
def load_documents():
    loader = DirectoryLoader(str(DATA_PATH), glob="*.txt", loader_cls=TextLoader)
    return loader.load()

# 2. Split documents into manageable chunks
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

def split_documents(docs):
    return splitter.split_documents(docs)

# 3. Embeddings
embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

# 4. Build or load FAISS index
if INDEX_PATH.exists():
    vectorstore = FAISS.load_local(str(INDEX_PATH), embeddings)
else:
    raw_docs = load_documents()
    docs = split_documents(raw_docs)
    vectorstore = FAISS.from_documents(docs, embeddings)
    vectorstore.save_local(str(INDEX_PATH))

# 5. LLM – placeholder (replace with GPT‑OSS 120B client when available)
# Using a small model for now so the demo runs out‑of‑the‑box.
llm = HuggingFacePipeline.from_model_id(model_id="gpt2", task="text-generation")

# 6. RetrievalQA chain
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
    return_source_documents=True,
)

def answer_question(query: str):
    """Run the RAG pipeline and return the answer and source docs."""
    result = qa_chain(query)
    return {
        "answer": result["result"],
        "sources": [doc.page_content for doc in result["source_documents"]],
    }
