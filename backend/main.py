# Connect DB & Gemini API
import os

import google.generativeai as genai
import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(dotenv_path=".env")

app = FastAPI(title="QCPedia Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
else:
    model = None


class ChatRequest(BaseModel):
    message: str


def search_db(user_query: str):
    db = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME"),
        port=3306,
        get_warnings=True,
    )

    try:
        cursor = db.cursor()
        query = "SELECT response FROM chatbot WHERE messages LIKE %s LIMIT 1"
        cursor.execute(query, (f"%{user_query}%",))
        result = cursor.fetchone()
        return result[0] if result else None
    finally:
        db.close()


def build_reply(user_query: str) -> str:
    data = search_db(user_query)

    if not data:
        return "Maaf, data tidak ditemukan untuk pertanyaan Anda."

    if not model:
        return data

    prompt = (
        "Anda adalah asisten QCPedia. Jawab singkat, jelas, dan dalam bahasa Indonesia. "
        f"Gunakan informasi berikut sebagai sumber utama: '{data}'. "
        f"Pertanyaan pengguna: '{user_query}'"
    )

    response = model.generate_content(prompt)
    return getattr(response, "text", "").strip() or data


@app.get("/")
async def root():
    return {"message": "QCPedia backend is running"}


@app.get("/health")
async def health():
    return {"status": "ok", "gemini_configured": bool(model)}


@app.get("/chat")
async def chat_get(query: str):
    try:
        reply = build_reply(query.strip())
        return {"reply": reply}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/chat")
async def chat_post(payload: ChatRequest):
    user_message = payload.message.strip()

    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required.")

    try:
        reply = build_reply(user_message)
        return {"reply": reply}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
