import os
import re
from difflib import SequenceMatcher
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

ENABLE_GEMINI = os.getenv("ENABLE_GEMINI", "").strip().lower() in {"1", "true", "yes", "on"}
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
model = None

if ENABLE_GEMINI and GOOGLE_API_KEY:
    try:
        import google.generativeai as genai

        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
    except Exception:
        model = None

def tokenize_text(text: str):
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    return [token for token in cleaned.split() if len(token) > 2]

def normalize_text(text: str):
    return " ".join(tokenize_text(text))

def split_message_aliases(message: str):
    aliases = re.split(r"[\/,\n]+", message)
    return [alias.strip() for alias in aliases if alias.strip()]

def get_display_label(message: str):
    aliases = split_message_aliases(message)
    return aliases[0] if aliases else message.strip()

def similarity_score(left: str, right: str):
    return SequenceMatcher(None, left, right).ratio()

def fuzzy_match_score(query: str, message: str):
    query_tokens = tokenize_text(query)
    message_tokens = tokenize_text(message)

    if not query_tokens or not message_tokens:
        return 0

    total_score = 0

    for query_token in query_tokens:
        best_token_score = 0

        for message_token in message_tokens:
            if query_token == message_token:
                best_token_score = 1
                break

            if query_token in message_token or message_token in query_token:
                best_token_score = max(best_token_score, 0.92)
                continue

            best_token_score = max(best_token_score, similarity_score(query_token, message_token))

        total_score += best_token_score

    return total_score / len(query_tokens)

def overlap_score(query: str, message: str):
    query_tokens = set(tokenize_text(query))
    message_tokens = set(tokenize_text(message))

    if not query_tokens or not message_tokens:
        return 0

    return len(query_tokens & message_tokens) / len(query_tokens)

def contains_all_query_tokens(query: str, message: str):
    query_tokens = set(tokenize_text(query))
    message_tokens = set(tokenize_text(message))

    if not query_tokens or not message_tokens:
        return False

    return query_tokens.issubset(message_tokens)

def rank_match(query: str, message: str):
    normalized_query = normalize_text(query)
    normalized_message = normalize_text(message)
    aliases = split_message_aliases(message)
    normalized_aliases = [normalize_text(alias) for alias in aliases]

    alias_exact = 1 if normalized_query and normalized_query in normalized_aliases else 0
    phrase_exact = 1 if normalized_query and normalized_query in normalized_message else 0
    overlap = overlap_score(query, message)
    fuzzy = fuzzy_match_score(query, message)

    return (
        alias_exact,
        phrase_exact,
        overlap,
        fuzzy,
        -len(normalized_message),
    )

def fetch_chatbot_rows():
    db = mysql.connector.connect(
        host=os.getenv("DB_HOST"), port=int(os.getenv("DB_PORT", "3306")), user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"), database=os.getenv("DB_NAME")
    )
    try:
        cursor = db.cursor()
        cursor.execute("SELECT messages, response FROM chatbot")
        return cursor.fetchall()
    finally:
        db.close()

def find_matches(user_query: str, rows):
    matches = []

    for message, response in rows:
        score = rank_match(user_query, message)
        alias_exact, phrase_exact, overlap, fuzzy, _ = score

        if not (alias_exact or phrase_exact or overlap >= 0.5 or fuzzy >= 0.78):
            continue

        matches.append(
            {
                "message": message,
                "response": response,
                "score": score,
                "alias_exact": alias_exact,
                "phrase_exact": phrase_exact,
                "overlap": overlap,
                "fuzzy": fuzzy,
                "contains_all_tokens": contains_all_query_tokens(user_query, message),
                "label": get_display_label(message),
            }
        )

    matches.sort(key=lambda match: match["score"], reverse=True)
    return matches

def pick_or_disambiguate(user_query: str, rows):
    matches = find_matches(user_query, rows)

    if not matches:
        return None

    top_match = matches[0]

    if top_match["alias_exact"]:
        return {"type": "match", "match": top_match}

    query_tokens = tokenize_text(user_query)

    if len(query_tokens) <= 2:
        strong_matches = [
            match
            for match in matches
            if (
                match["alias_exact"]
                or match["phrase_exact"]
                or match["contains_all_tokens"]
            )
        ]
    else:
        strong_matches = [
            match
            for match in matches[:8]
            if (
                match["phrase_exact"] == top_match["phrase_exact"]
                and match["overlap"] >= max(0.5, top_match["overlap"] - 0.1)
                and match["fuzzy"] >= top_match["fuzzy"] - 0.12
            )
        ]

    unique_options = []
    seen_labels = set()
    for match in strong_matches:
        normalized_label = match["label"].lower()
        if normalized_label in seen_labels:
            continue
        seen_labels.add(normalized_label)
        unique_options.append(
            {
                "label": match["label"],
                "value": match["message"],
            }
        )

    if len(unique_options) >= 2:
        return {
            "type": "disambiguation",
            "message": "Saya menemukan beberapa pilihan yang mirip. Silakan pilih yang kamu maksud:",
            "options": unique_options,
        }

    return {"type": "match", "match": top_match}

def fallback_normalize_query(user_query: str):
    tokens = tokenize_text(user_query)
    return " ".join(tokens[:8]).strip()

def normalize_query(user_query: str):
    if model is None:
        return fallback_normalize_query(user_query)

    prompt = (
        "Anda membantu pencarian database chatbot QCPedia. "
        "Ubah pertanyaan pengguna menjadi kata kunci singkat dalam bahasa Indonesia. "
        "Perbaiki typo ringan, buang kata yang tidak penting, dan rangkum inti kebutuhan pengguna. "
        "Balas hanya dengan 3 sampai 8 kata kunci tanpa penjelasan tambahan. "
        f"Pertanyaan pengguna: {user_query}"
    )

    try:
        response = model.generate_content(prompt)
        normalized = getattr(response, "text", "").strip()
        return normalized or fallback_normalize_query(user_query)
    except Exception:
        return fallback_normalize_query(user_query)

def build_search_candidates(user_query: str):
    normalized_query = normalize_query(user_query)
    fallback_query = fallback_normalize_query(user_query)

    candidates = [user_query.strip(), normalized_query, fallback_query]

    unique_candidates = []
    seen = set()
    for candidate in candidates:
        cleaned_candidate = candidate.strip()
        if cleaned_candidate and cleaned_candidate.lower() not in seen:
            seen.add(cleaned_candidate.lower())
            unique_candidates.append(cleaned_candidate)

    return unique_candidates

def build_reply(user_query: str):
    matched_query = None
    matched_message = None
    data = None
    rows = fetch_chatbot_rows()

    for candidate in build_search_candidates(user_query):
        result = pick_or_disambiguate(candidate, rows)
        if not result:
            continue

        if result["type"] == "disambiguation":
            return result

        match = result["match"]
        if match:
            matched_query = candidate
            matched_message = match["message"]
            data = match["response"]
            break

    if not data:
        return {"type": "reply", "reply": "Data tidak ditemukan."}

    if model is None:
        return {"type": "reply", "reply": data}

    prompt = (
        "Anda adalah asisten QCPedia. Jawab singkat, jelas, dan dalam bahasa Indonesia. "
        f"Pertanyaan asli pengguna: {user_query}. "
        f"Kata kunci pencarian yang cocok: {matched_query}. "
        f"Entri database yang dipilih: {matched_message}. "
        f"Gunakan informasi ini sebagai sumber utama: {data}"
    )
    try:
        response = model.generate_content(prompt)
        return {"type": "reply", "reply": response.text.strip()}
    except Exception:
        return {"type": "reply", "reply": data}
