"""Fornece um backend compatível com PyJWT com fallback totalmente em Python."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import datetime
from typing import Any, Dict, Iterable


def _load_pyjwt():
    try:
        import jwt as _pyjwt  # type: ignore

        if not hasattr(_pyjwt, "encode") or not hasattr(_pyjwt, "decode"):
            raise ImportError("PyJWT API not available")
        return _pyjwt
    except Exception:  # pragma: no cover - fallback exercised when PyJWT absent
        return None


class _SimpleExpiredSignatureError(Exception):
    """Lançada quando a claim exp do token está no passado."""


class _SimpleInvalidTokenError(Exception):
    """Lançada para tokens malformados ou assinaturas inválidas."""


class _SimpleJWT:
    """Implementação mínima de HS256 utilizada quando o PyJWT não está disponível."""

    ExpiredSignatureError = _SimpleExpiredSignatureError
    InvalidTokenError = _SimpleInvalidTokenError

    @staticmethod
    def _b64_encode(raw: bytes) -> str:
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")

    @staticmethod
    def _b64_decode(raw: str) -> bytes:
        padding = "=" * (-len(raw) % 4)
        return base64.urlsafe_b64decode((raw + padding).encode("ascii"))

    @staticmethod
    def _normalize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
        normalized: Dict[str, Any] = {}
        for key, value in payload.items():
            if isinstance(value, datetime):
                normalized[key] = int(value.timestamp())
            else:
                normalized[key] = value
        return normalized

    @classmethod
    def encode(
        cls,
        payload: Dict[str, Any],
        secret: str,
        algorithm: str = "HS256",
    ) -> str:
        if algorithm != "HS256":
            raise ValueError("Simple JWT fallback only supports HS256")

        header = {"alg": "HS256", "typ": "JWT"}
        normalized_payload = cls._normalize_payload(payload)

        header_segment = cls._b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
        payload_segment = cls._b64_encode(
            json.dumps(normalized_payload, separators=(",", ":")).encode("utf-8")
        )
        signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
        signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
        signature_segment = cls._b64_encode(signature)
        return f"{header_segment}.{payload_segment}.{signature_segment}"

    @classmethod
    def decode(
        cls,
        token: str,
        secret: str,
        algorithms: Iterable[str] | None = None,
    ) -> Dict[str, Any]:
        algorithms = list(algorithms or ["HS256"])
        if "HS256" not in algorithms:
            raise ValueError("Simple JWT fallback only supports HS256")

        try:
            header_segment, payload_segment, signature_segment = token.split(".")
        except ValueError as exc:
            raise cls.InvalidTokenError("Token JWT malformado.") from exc

        header = json.loads(cls._b64_decode(header_segment))
        if header.get("alg") != "HS256":
            raise cls.InvalidTokenError("Algoritmo JWT não suportado.")

        signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
        expected_signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected_signature, cls._b64_decode(signature_segment)):
            raise cls.InvalidTokenError("Assinatura JWT inválida.")

        payload = json.loads(cls._b64_decode(payload_segment))
        exp = payload.get("exp")
        if exp is not None:
            exp_ts = float(exp)
            if datetime.utcnow().timestamp() > exp_ts:
                raise cls.ExpiredSignatureError("Token expirado.")

        return payload


def get_jwt_backend():
    """Retorna o PyJWT quando disponível, caso contrário usa o fallback simples."""
    pyjwt = _load_pyjwt()
    return pyjwt if pyjwt is not None else _SimpleJWT
