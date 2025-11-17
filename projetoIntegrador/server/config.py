"""Constantes de configuração centralizadas para o servidor Flask."""
from __future__ import annotations

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUESTIONS_DB_PATH = os.path.join(BASE_DIR, "questoes.db")
USERS_DB_PATH = os.path.join(BASE_DIR, "usuarios.db")

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_EXP_MINUTES = int(os.environ.get("JWT_EXP_MINUTES", "120"))

LLM_ENDPOINT = os.environ.get(
    "LLM_ENDPOINT",
    "http://localhost:1234/v1/chat/completions",
)
LLM_MODEL = os.environ.get("LLM_MODEL", "meta-llama-3.1-8b-instruct")
