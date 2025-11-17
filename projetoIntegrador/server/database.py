"""Utilitários de banco de dados para persistência de usuários."""
from __future__ import annotations

import sqlite3
from datetime import datetime
from typing import Dict, Optional, Tuple

from werkzeug.security import generate_password_hash

try:
    from .config import USERS_DB_PATH
except ImportError:
    from config import USERS_DB_PATH


def get_db_connection(path: str):
    return sqlite3.connect(path)


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
