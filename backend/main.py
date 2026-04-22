import os
import uuid

import bcrypt
import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from logic import build_reply

load_dotenv(dotenv_path=".env")

app = FastAPI(title="QCPedia Backend")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class ChatRequest(BaseModel):
    message: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    nama: str
    username: str
    email: EmailStr
    password: str


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME"),
    )


@app.get("/")
async def root(): return {"status": "running"}

@app.get("/categories")
async def get_categories(category: str):
    db = get_db_connection()

    try:
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT uuid, category
            FROM category
            WHERE LOWER(category) = LOWER(%s)
            LIMIT 1
            """,
            (category,),
        )
        category_row = cursor.fetchone()

        if not category_row:
            raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")

        cursor.execute(
            """
            SELECT
                sc.uuid,
                sc.sub_category,
                COUNT(p.uuid) AS total_pages
            FROM sub_category sc
            LEFT JOIN pages p ON p.sub_category = sc.uuid
            WHERE sc.category = %s
            GROUP BY sc.uuid, sc.sub_category
            ORDER BY sc.sub_category ASC
            """,
            (category_row["uuid"],),
        )
        sub_category_rows = cursor.fetchall()

        sub_categories = []
        for sub_category_row in sub_category_rows:
            cursor.execute(
                """
                SELECT uuid, pages
                FROM pages
                WHERE sub_category = %s
                ORDER BY pages ASC
                """,
                (sub_category_row["uuid"],),
            )
            page_rows = cursor.fetchall()

            sub_categories.append(
                {
                    "uuid": sub_category_row["uuid"],
                    "name": sub_category_row["sub_category"],
                    "total_pages": sub_category_row["total_pages"],
                    "pages": [
                        {
                            "uuid": page_row["uuid"],
                            "name": page_row["pages"],
                        }
                        for page_row in page_rows
                    ],
                }
            )

        return {
            "category": {
                "uuid": category_row["uuid"],
                "name": category_row["category"],
            },
            "sub_categories": sub_categories,
        }
    finally:
        db.close()


@app.get("/pages/{page_uuid}")
async def get_page_detail(page_uuid: str):
    db = get_db_connection()

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT uuid, pages, content
            FROM pages
            WHERE uuid = %s
            LIMIT 1
            """,
            (page_uuid,),
        )
        page_row = cursor.fetchone()

        if not page_row:
            raise HTTPException(status_code=404, detail="Halaman tidak ditemukan.")

        return {
            "uuid": page_row["uuid"],
            "name": page_row["pages"],
            "content": page_row["content"],
        }
    finally:
        db.close()


@app.post("/auth/login")
async def login(payload: LoginRequest):
    db = get_db_connection()

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT uuid, nama, username, email, password, plant, departemen, tipe_user
            FROM pegawai
            WHERE LOWER(email) = LOWER(%s)
            LIMIT 1
            """,
            (payload.email,),
        )
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="Pegawai tidak terdaftar.")

        password_hash = user["password"].replace("$2y$", "$2b$")
        if not bcrypt.checkpw(payload.password.encode("utf-8"), password_hash.encode("utf-8")):
            raise HTTPException(status_code=401, detail="Password yang Anda masukkan salah.")

        return {
            "message": "Login berhasil.",
            "user": {
                "uuid": user["uuid"],
                "nama": user["nama"],
                "username": user["username"],
                "email": user["email"],
                "plant": user["plant"],
                "departemen": user["departemen"],
                "tipe_user": user["tipe_user"],
            },
        }
    finally:
        db.close()


@app.post("/auth/signup")
async def signup(payload: SignupRequest):
    db = get_db_connection()

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT uuid
            FROM pegawai
            WHERE LOWER(email) = LOWER(%s) OR LOWER(username) = LOWER(%s)
            LIMIT 1
            """,
            (payload.email, payload.username),
        )
        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(status_code=409, detail="Email atau username sudah terdaftar.")

        cursor.execute(
            """
            SELECT plant, departemen
            FROM pegawai
            ORDER BY id ASC
            LIMIT 1
            """,
        )
        defaults = cursor.fetchone()

        if not defaults:
            raise HTTPException(status_code=500, detail="Data default pegawai belum tersedia.")

        password_hash = bcrypt.hashpw(
            payload.password.encode("utf-8"),
            bcrypt.gensalt(),
        ).decode("utf-8").replace("$2b$", "$2y$")

        user_uuid = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO pegawai (uuid, nama, username, password, email, plant, departemen, tipe_user)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_uuid,
                payload.nama,
                payload.username,
                password_hash,
                payload.email,
                defaults["plant"],
                defaults["departemen"],
                "4",
            ),
        )
        db.commit()

        return {
            "message": "Pendaftaran berhasil. Silakan login menggunakan akun Anda.",
            "user": {
                "uuid": user_uuid,
                "nama": payload.nama,
                "username": payload.username,
                "email": payload.email,
            },
        }
    finally:
        db.close()


@app.post("/chat")
async def chat(payload: ChatRequest):
    try:
        return build_reply(payload.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
