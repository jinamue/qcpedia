import os
import time
import uuid
import json
import base64
import hmac
import hashlib
import smtplib
from pathlib import Path
from email.message import EmailMessage
from typing import Optional

import bcrypt
import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from logic import build_reply

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

app = FastAPI(title="QCPedia Backend")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
ACCESS_TOKEN_TTL_SECONDS = int(os.getenv("ACCESS_TOKEN_TTL_SECONDS", "43200"))
APP_SECRET_KEY = os.getenv("APP_SECRET_KEY", "qcpedia-dev-secret-change-me")


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
    tipe_user: str = "4"


class AdminCreatePageRequest(BaseModel):
    category_uuid: str
    sub_category_uuid: Optional[str] = None
    sub_category_name: Optional[str] = None
    page_name: str
    content: str


class AdminUpdatePageRequest(BaseModel):
    page_name: str
    content: str


class ContactMessageRequest(BaseModel):
    name: str
    email: EmailStr
    recipient_email: EmailStr
    message: str


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME"),
    )


def is_admin_user(tipe_user: str) -> bool:
    # Existing signup flow stores regular users as tipe_user=4.
    # We treat any other tipe_user as admin unless configured differently later.
    return str(tipe_user).strip() != "4"


def get_allowed_contact_recipients() -> list[str]:
    raw_value = os.getenv(
        "CONTACT_ALLOWED_RECIPIENTS",
        "adminqc.rtm@cp.co.id,putri.harnis@cp.co.id,7ayyentt@gmail.com",
    )
    recipients = [item.strip().lower() for item in raw_value.split(",") if item.strip()]
    return list(dict.fromkeys(recipients))


def send_contact_email(payload: ContactMessageRequest) -> None:
    smtp_username = os.getenv("GMAIL_SMTP_EMAIL", os.getenv("SMTP_EMAIL", "")).strip()
    smtp_password = os.getenv("GMAIL_SMTP_APP_PASSWORD", os.getenv("SMTP_PASSWORD", "")).strip()
    smtp_sender = os.getenv("GMAIL_SENDER_EMAIL", smtp_username).strip()

    if not smtp_username or not smtp_password:
        raise HTTPException(
            status_code=500,
            detail="Konfigurasi email belum lengkap. Isi GMAIL_SMTP_EMAIL dan GMAIL_SMTP_APP_PASSWORD di backend/.env.",
        )

    message = EmailMessage()
    message["Subject"] = f"QCPedia Contact: {payload.name}"
    message["From"] = smtp_sender
    message["To"] = payload.recipient_email
    message["Reply-To"] = payload.email
    message.set_content(
        "\n".join(
            [
                "Pesan baru dari halaman kontak QCPedia.",
                "",
                f"Nama pengirim: {payload.name}",
                f"Email pengirim: {payload.email}",
                f"Email tujuan: {payload.recipient_email}",
                "",
                "Pesan:",
                payload.message.strip(),
            ]
        )
    )

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(message)
    except smtplib.SMTPException as exc:
        raise HTTPException(status_code=502, detail="Gagal mengirim email ke Gmail.") from exc


def _base64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _base64url_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(f"{raw}{padding}")


def create_access_token(user: dict) -> str:
    payload = {
        "sub": user["uuid"],
        "email": user["email"],
        "tipe_user": str(user["tipe_user"]),
        "exp": int(time.time()) + ACCESS_TOKEN_TTL_SECONDS,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_b64 = _base64url_encode(payload_bytes)
    signature = hmac.new(APP_SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    return f"{payload_b64}.{_base64url_encode(signature)}"


def decode_access_token(token: str) -> dict:
    try:
        payload_b64, signature_b64 = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Token tidak valid.") from exc

    expected_signature = hmac.new(
        APP_SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    provided_signature = _base64url_decode(signature_b64)

    if not hmac.compare_digest(expected_signature, provided_signature):
        raise HTTPException(status_code=401, detail="Token tidak valid.")

    try:
        payload = json.loads(_base64url_decode(payload_b64).decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=401, detail="Token tidak valid.") from exc

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Sesi admin sudah kedaluwarsa. Silakan login kembali.")

    return payload


def get_current_admin(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token admin diperlukan.")

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)

    if not is_admin_user(payload.get("tipe_user", "")):
        raise HTTPException(status_code=403, detail="Hanya admin yang dapat mengakses fitur ini.")

    db = get_db_connection()

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT uuid, nama, username, email, plant, departemen, tipe_user
            FROM pegawai
            WHERE uuid = %s
            LIMIT 1
            """,
            (payload["sub"],),
        )
        user = cursor.fetchone()
    finally:
        db.close()

    if not user or not is_admin_user(user["tipe_user"]):
        raise HTTPException(status_code=403, detail="Akun admin tidak ditemukan atau tidak aktif.")

    return user


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

        if not is_admin_user(user["tipe_user"]):
            raise HTTPException(status_code=403, detail="Halaman login ini hanya untuk admin.")

        return {
            "message": "Login berhasil.",
            "access_token": create_access_token(user),
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
async def signup(payload: SignupRequest, authorization: Optional[str] = Header(default=None)):
    current_admin = get_current_admin(authorization)
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
                payload.tipe_user,
            ),
        )
        db.commit()

        return {
            "message": "Akun baru berhasil dibuat oleh admin.",
            "user": {
                "uuid": user_uuid,
                "nama": payload.nama,
                "username": payload.username,
                "email": payload.email,
                "tipe_user": payload.tipe_user,
                "created_by": current_admin["username"],
            },
        }
    finally:
        db.close()


@app.get("/admin/pegawai")
async def get_admin_pegawai(authorization: Optional[str] = Header(default=None)):
    get_current_admin(authorization)
    db = get_db_connection()

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT uuid, nama, username, email, plant, departemen, tipe_user
            FROM pegawai
            ORDER BY nama ASC, username ASC
            """
        )
        rows = cursor.fetchall()

        return {
            "pegawai": [
                {
                    "uuid": row["uuid"],
                    "nama": row["nama"],
                    "username": row["username"],
                    "email": row["email"],
                    "plant": row["plant"],
                    "departemen": row["departemen"],
                    "tipe_user": row["tipe_user"],
                }
                for row in rows
            ]
        }
    finally:
        db.close()


@app.get("/admin/categories")
async def get_admin_categories(authorization: Optional[str] = Header(default=None)):
    get_current_admin(authorization)
    db = get_db_connection()

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT uuid, category
            FROM category
            ORDER BY category ASC
            """
        )
        category_rows = cursor.fetchall()

        categories = []
        for category_row in category_rows:
            cursor.execute(
                """
                SELECT uuid, sub_category
                FROM sub_category
                WHERE category = %s
                ORDER BY sub_category ASC
                """,
                (category_row["uuid"],),
            )
            sub_category_rows = cursor.fetchall()
            categories.append(
                {
                    "uuid": category_row["uuid"],
                    "name": category_row["category"],
                    "sub_categories": [
                        {"uuid": sub_category_row["uuid"], "name": sub_category_row["sub_category"]}
                        for sub_category_row in sub_category_rows
                    ],
                }
            )

        return {"categories": categories}
    finally:
        db.close()


@app.post("/admin/pages")
async def create_admin_page(
    payload: AdminCreatePageRequest,
    authorization: Optional[str] = Header(default=None),
):
    current_admin = get_current_admin(authorization)
    db = get_db_connection()

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT uuid, category
            FROM category
            WHERE uuid = %s
            LIMIT 1
            """,
            (payload.category_uuid,),
        )
        category_row = cursor.fetchone()

        if not category_row:
            raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")

        sub_category_uuid = payload.sub_category_uuid
        sub_category_name = (payload.sub_category_name or "").strip()

        if not sub_category_uuid and not sub_category_name:
            raise HTTPException(
                status_code=422,
                detail="Pilih subkategori yang ada atau isi nama subkategori baru.",
            )

        if sub_category_uuid:
            cursor.execute(
                """
                SELECT uuid, sub_category
                FROM sub_category
                WHERE uuid = %s AND category = %s
                LIMIT 1
                """,
                (sub_category_uuid, payload.category_uuid),
            )
            sub_category_row = cursor.fetchone()

            if not sub_category_row:
                raise HTTPException(status_code=404, detail="Subkategori tidak ditemukan.")
        else:
            cursor.execute(
                """
                SELECT uuid, sub_category
                FROM sub_category
                WHERE LOWER(sub_category) = LOWER(%s) AND category = %s
                LIMIT 1
                """,
                (sub_category_name, payload.category_uuid),
            )
            sub_category_row = cursor.fetchone()

            if not sub_category_row:
                sub_category_uuid = str(uuid.uuid4())
                cursor.execute(
                    """
                    INSERT INTO sub_category (uuid, username, category, sub_category)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (sub_category_uuid, current_admin["username"], payload.category_uuid, sub_category_name),
                )
                sub_category_row = {"uuid": sub_category_uuid, "sub_category": sub_category_name}

        page_name = payload.page_name.strip()
        if not page_name:
            raise HTTPException(status_code=422, detail="Nama dokumen wajib diisi.")

        cursor.execute(
            """
            SELECT uuid
            FROM pages
            WHERE LOWER(pages) = LOWER(%s) AND sub_category = %s
            LIMIT 1
            """,
            (page_name, sub_category_row["uuid"]),
        )
        existing_page = cursor.fetchone()

        if existing_page:
            raise HTTPException(status_code=409, detail="Nama dokumen sudah ada pada subkategori ini.")

        page_uuid = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO pages (uuid, username, sub_category, pages, content)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (page_uuid, current_admin["username"], sub_category_row["uuid"], page_name, payload.content),
        )
        db.commit()

        return {
            "message": "Dokumen berhasil ditambahkan ke database.",
            "page": {
                "uuid": page_uuid,
                "name": page_name,
                "category": category_row["category"],
                "sub_category": sub_category_row["sub_category"],
            },
        }
    finally:
        db.close()


@app.put("/admin/pages/{page_uuid}")
async def update_admin_page(
    page_uuid: str,
    payload: AdminUpdatePageRequest,
    authorization: Optional[str] = Header(default=None),
):
    current_admin = get_current_admin(authorization)
    db = get_db_connection()

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT uuid, sub_category
            FROM pages
            WHERE uuid = %s
            LIMIT 1
            """,
            (page_uuid,),
        )
        existing_page = cursor.fetchone()

        if not existing_page:
            raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")

        page_name = payload.page_name.strip()
        content = payload.content.strip()

        if not page_name:
            raise HTTPException(status_code=422, detail="Nama dokumen wajib diisi.")

        if not content:
            raise HTTPException(status_code=422, detail="Isi dokumen wajib diisi.")

        cursor.execute(
            """
            SELECT uuid
            FROM pages
            WHERE LOWER(pages) = LOWER(%s) AND sub_category = %s AND uuid <> %s
            LIMIT 1
            """,
            (page_name, existing_page["sub_category"], page_uuid),
        )
        duplicate_page = cursor.fetchone()

        if duplicate_page:
            raise HTTPException(status_code=409, detail="Nama dokumen sudah digunakan pada subkategori ini.")

        cursor.execute(
            """
            UPDATE pages
            SET pages = %s, content = %s, username = %s
            WHERE uuid = %s
            """,
            (page_name, content, current_admin["username"], page_uuid),
        )
        db.commit()

        return {
            "message": "Isi kategori berhasil diperbarui.",
            "page": {
                "uuid": page_uuid,
                "name": page_name,
                "content": content,
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


@app.post("/contact")
async def submit_contact_message(payload: ContactMessageRequest):
    allowed_recipients = get_allowed_contact_recipients()
    recipient_email = payload.recipient_email.strip().lower()

    if recipient_email not in allowed_recipients:
        raise HTTPException(
            status_code=422,
            detail="Email tujuan tidak terdaftar. Pilih salah satu kontak resmi yang tersedia.",
        )

    if not payload.name.strip():
        raise HTTPException(status_code=422, detail="Nama wajib diisi.")

    if not payload.message.strip():
        raise HTTPException(status_code=422, detail="Pesan wajib diisi.")

    send_contact_email(
        ContactMessageRequest(
            name=payload.name.strip(),
            email=payload.email,
            recipient_email=recipient_email,
            message=payload.message.strip(),
        )
    )

    return {"message": "Pesan berhasil dikirim ke email tujuan."}
