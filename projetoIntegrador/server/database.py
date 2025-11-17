"""Utilitários de banco de dados para persistência de usuários e questões."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from werkzeug.security import generate_password_hash

try:
    from .config import USERS_DB_PATH
except ImportError:
    from config import USERS_DB_PATH


def get_db_connection(path: str):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_user_db() -> None:
    conn = get_db_connection(USERS_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL,
            criado_em TEXT NOT NULL
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS user_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            statement TEXT NOT NULL,
            alternatives TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            explanation TEXT,
            subject_area TEXT,
            difficulty_level TEXT,
            status TEXT,
            source_type TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
        """
    )
    conn.commit()
    conn.close()


def get_user_by_email(email: str) -> Optional[Tuple[int, str, str, str, str]]:
    conn = get_db_connection(USERS_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, nome, email, senha_hash, criado_em FROM usuarios WHERE email = ?",
        (email,),
    )
    row = cursor.fetchone()
    conn.close()
    return row


def create_user(name: str, email: str, password: str) -> Dict[str, str | int]:
    conn = get_db_connection(USERS_DB_PATH)
    cursor = conn.cursor()
    senha_hash = generate_password_hash(password)
    criado_em = datetime.utcnow().isoformat()
    cursor.execute(
        """
        INSERT INTO usuarios (nome, email, senha_hash, criado_em)
        VALUES (?, ?, ?, ?)
        """,
        (name, email, senha_hash, criado_em),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return {"id": user_id, "name": name, "email": email}


def _row_to_question(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "title": row["title"],
        "statement": row["statement"],
        "alternatives": json.loads(row["alternatives"]),
        "correctAnswer": row["correct_answer"],
        "explanation": row["explanation"],
        "subjectArea": row["subject_area"],
        "difficultyLevel": row["difficulty_level"],
        "status": row["status"],
        "sourceType": row["source_type"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def _serialize_alternatives(alternatives: Dict[str, Any]) -> str:
    if not isinstance(alternatives, dict) or not alternatives:
        raise ValueError("Alternativas inválidas.")
    normalized = {key: (value or "") for key, value in alternatives.items()}
    return json.dumps(normalized, ensure_ascii=False)


def _prepare_question_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    title = (data.get("title") or "").strip()
    statement = (data.get("statement") or "").strip()
    correct_answer = (data.get("correctAnswer") or "").strip()
    if not title or not statement or not correct_answer:
        raise ValueError("Título, enunciado e alternativa correta são obrigatórios.")

    alternatives = data.get("alternatives") or {}
    alternatives_json = _serialize_alternatives(alternatives)

    return {
        "title": title,
        "statement": statement,
        "alternatives": alternatives_json,
        "correct_answer": correct_answer,
        "explanation": (data.get("explanation") or "").strip() or None,
        "subject_area": (data.get("subjectArea") or "").strip() or None,
        "difficulty_level": (data.get("difficultyLevel") or "").strip() or None,
        "status": (data.get("status") or "draft").strip() or "draft",
        "source_type": (data.get("sourceType") or "manual").strip() or "manual",
    }


def list_user_questions(user_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection(USERS_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM user_questions WHERE user_id = ? ORDER BY datetime(created_at) DESC",
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_question(row) for row in rows]


def get_user_question(user_id: int, question_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection(USERS_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM user_questions WHERE id = ? AND user_id = ?",
        (question_id, user_id),
    )
    row = cursor.fetchone()
    conn.close()
    return _row_to_question(row) if row else None


def create_user_question(user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    payload = _prepare_question_payload(data)
    now = datetime.utcnow().isoformat()
    conn = get_db_connection(USERS_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO user_questions (
            user_id, title, statement, alternatives, correct_answer, explanation,
            subject_area, difficulty_level, status, source_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            payload["title"],
            payload["statement"],
            payload["alternatives"],
            payload["correct_answer"],
            payload["explanation"],
            payload["subject_area"],
            payload["difficulty_level"],
            payload["status"],
            payload["source_type"],
            now,
            now,
        ),
    )
    question_id = cursor.lastrowid
    conn.commit()
    conn.close()
    question = get_user_question(user_id, question_id)
    if question is None:
        raise RuntimeError("Erro ao criar a questão do usuário.")
    return question


def update_user_question(user_id: int, question_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    if get_user_question(user_id, question_id) is None:
        raise LookupError("Questão não encontrada.")

    payload = _prepare_question_payload(data)
    now = datetime.utcnow().isoformat()
    conn = get_db_connection(USERS_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE user_questions
        SET title = ?, statement = ?, alternatives = ?, correct_answer = ?, explanation = ?,
            subject_area = ?, difficulty_level = ?, status = ?, source_type = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
        """,
        (
            payload["title"],
            payload["statement"],
            payload["alternatives"],
            payload["correct_answer"],
            payload["explanation"],
            payload["subject_area"],
            payload["difficulty_level"],
            payload["status"],
            payload["source_type"],
            now,
            question_id,
            user_id,
        ),
    )
    conn.commit()
    conn.close()
    question = get_user_question(user_id, question_id)
    if question is None:
        raise RuntimeError("Erro ao atualizar a questão do usuário.")
    return question


def delete_user_question(user_id: int, question_id: int) -> bool:
    conn = get_db_connection(USERS_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM user_questions WHERE id = ? AND user_id = ?",
        (question_id, user_id),
    )
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
