#Connect DB & Gemini API
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import mysql.connector 
import google.generativeai as genai

load_dotenv(dotenv_path=".env")  # Load environment variables from .env file
app = FastAPI()

# React manggil API dari localhost:3000, jadi kita perlu atur CORS agar React bisa akses API kita tanpa masalah
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
    )

#Setting Gemini API Key
genai.configure(api_key="AQ.Ab8RN6Jk0lNlFT1QYATCngoUhDzSHB4GFv74QgmXz_Kogwk8fw")
model = genai.GenerativeModel("gemini-2.5-flash")

# Fungsi untuk mencari jawaban di database berdasarkan pertanyaan user  
def search_Db(user_query):
    db = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME"),
        port=3306,
        get_warnings=True
    )

    # Cari di database qcpedia untuk pertanyaan yang mirip dengan user_query
    cursor = db.cursor()
    query = "SELECT response FROM chatbot WHERE messages LIKE %s"
    cursor.execute(query, (f'%{user_query}%',))
    result = cursor.fetchone()  # Ambil satu hasil yang paling mirip
    db.close()
    return result[0] if result else None


# Endpoint API untuk menerima pertanyaan dari React, mencari di database, dan mengirimkan jawaban
@app.get("/chat")
async def chat_endpoint(query: str):
    try:
    # 1. Cek SQL
        data = search_Db(query) #Cari jawaban di database berdasarkan pertanyaan user

        if data:
            #2. Kalau data ada kirim ke gemini untuk dijawab
            prompt = f"Gunakan data: '{data}' untuk menjawab: '{query}'"
            response = model.generate_content(prompt)
            return {"reply": response.text}
        else:
            #3 Kalau gak ada kirim reply data tidak ditemukan
            return {"reply": "Maaf, data tidak ditemukan untuk pertanyaan Anda."}
    
    except Exception as e:
        # Ini akan menangkap error apa pun dan menampilkannya di browser
        return {"error_detail": str(e)}