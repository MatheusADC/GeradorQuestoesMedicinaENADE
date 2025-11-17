"""Utilitários de autenticação (geração de JWT e decoradores)."""
from __future__ import annotations

from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Dict, Optional

from flask import g, jsonify, request

try:
    from .config import JWT_EXP_MINUTES, JWT_SECRET
    from .jwt_backend import get_jwt_backend
except ImportError:
    from config import JWT_EXP_MINUTES, JWT_SECRET
    from jwt_backend import get_jwt_backend

JwtBackend = get_jwt_backend()


def generate_jwt(user_dict: Dict[str, Any]) -> str:
    payload = {
        "sub": user_dict["id"],
        "name": user_dict["name"],
        "email": user_dict["email"],
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES),
    }
    token = JwtBackend.encode(payload, JWT_SECRET, algorithm="HS256")
    return token if isinstance(token, str) else token.decode("utf-8")


def decode_jwt(token: str) -> Dict[str, Any]:
    return JwtBackend.decode(token, JWT_SECRET, algorithms=["HS256"])


def token_required(func: Callable):
    @wraps(func)
    def decorated(*args, **kwargs):
        auth_header: Optional[str] = request.headers.get("Authorization", "")
        token = None
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({"message": "Token ausente."}), 401

        try:
            decoded = decode_jwt(token)
        except JwtBackend.ExpiredSignatureError:
            return jsonify({"message": "Token expirado."}), 401
        except JwtBackend.InvalidTokenError:
            return jsonify({"message": "Token inválido."}), 401

        g.current_user = {
            "id": decoded.get("sub"),
            "name": decoded.get("name"),
            "email": decoded.get("email"),
        }
        return func(*args, **kwargs)

    return decorated
