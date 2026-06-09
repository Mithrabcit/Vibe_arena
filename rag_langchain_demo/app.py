import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Import the RAG pipeline utilities
from pipeline import answer_question

app = FastAPI()

# Mount static files
BASE_DIR = Path(__file__).parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open(BASE_DIR / "static" / "index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.post("/query")
async def query(request: Request):
    data = await request.json()
    question = data.get("question", "")
    if not question:
        return JSONResponse(content={"error": "No question provided"}, status_code=400)
    result = answer_question(question)
    return JSONResponse(content=result)
