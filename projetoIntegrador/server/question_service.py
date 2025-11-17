"""Serviços para buscar contexto e gerar questões via LLM."""
from __future__ import annotations

import re
from typing import Dict, List, Optional

import requests

try:
    from .config import LLM_ENDPOINT, LLM_MODEL, QUESTIONS_DB_PATH
    from .database import get_db_connection
except ImportError:
    from config import LLM_ENDPOINT, LLM_MODEL, QUESTIONS_DB_PATH
    from database import get_db_connection


def buscar_questoes_contexto(especialidade: Optional[str] = None, dificuldade: Optional[str] = None):
    conn = get_db_connection(QUESTIONS_DB_PATH)
    cursor = conn.cursor()
    query = (
        "SELECT numero_questao, enunciado, alternativas, resposta_correta, "
        "especialidade, dificuldade FROM questoes_objetivas"
    )
    params: List[str] = []

    filtros: List[str] = []
    if especialidade:
        filtros.append("especialidade = ?")
        params.append(especialidade)
    if dificuldade:
        filtros.append("dificuldade = ?")
        params.append(dificuldade)

    if filtros:
        query += " WHERE " + " AND ".join(filtros)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    questoes = []
    for row in rows:
        questoes.append(
            {
                "numero": row[0],
                "enunciado": row[1],
                "alternativas": row[2],
                "resposta_correta": row[3],
                "especialidade": row[4],
                "dificuldade": row[5],
            }
        )
    return questoes


def gerar_questao_llm(contexto_questoes, especialidade, dificuldade, prompt):
    contexto_texto = ""
    for q in contexto_questoes:
        contexto_texto += (
            f"Q{q['numero']} ({q['especialidade']}, {q['dificuldade']}): {q['enunciado']}\n"
        )
        contexto_texto += f"Alternativas: {q['alternativas']}\n"
        contexto_texto += f"Resposta correta: {q['resposta_correta']}\n\n"

    data = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": "Você é um gerador de questões do ENADE Medicina."},
            {
                "role": "user",
                "content": (
                    "Use os exemplos abaixo como referência para criar uma nova questão.\n\n"
                    f"{contexto_texto}\nCrie uma questão de {especialidade}, dificuldade {dificuldade}, sobre {prompt}. "
                    "Dê 5 alternativas e indique a correta. Siga ESTRITAMENTE a seguinte forma para me dar a resposta "
                    "e NÃO ESQUEÇA de usar como referência os exemplos que foram fornecidos:\n"
                    "Título da Questão: ...\nEnunciado da Questão: ...\nAlternativas da Questão: A) ... B) ... C) ... D) ... E) ...\n"
                    "Alternativa Correta: ...\nGabarito Comentado: Para cada alternativa, escreva um comentário conciso, claro, detalhado e explicativo, "
                    "seguindo rigorosamente o formato:\nA) Correta/Errada: justificativa completa e objetiva\n"
                    "B) Correta/Errada: justificativa completa e objetiva\nC) Correta/Errada: justificativa completa e objetiva\n"
                    "D) Correta/Errada: justificativa completa e objetiva\nE) Correta/Errada: justificativa completa e objetiva\n"
                    "Sempre deixe as alternativas na ordem A, B, C, D, E, indicando explicitamente se cada uma está correta ou errada..."
                ),
            },
        ],
    }

    response = requests.post(LLM_ENDPOINT, json=data)
    raw_content = response.json()["choices"][0]["message"]["content"]

    question_dict: Dict[str, str] = {}

    m = re.search(r"Título da Questão:\s*(.*)", raw_content)
    question_dict["title"] = m.group(1).strip() if m else f"Questão sobre {especialidade}"

    m = re.search(r"Enunciado da Questão:\s*(.*?)(?:Alternativas da Questão:|$)", raw_content, re.DOTALL)
    question_dict["statement"] = m.group(1).strip() if m else ""

    m = re.search(r"Alternativas da Questão:\s*(.*?)(?:Alternativa Correta:|$)", raw_content, re.DOTALL)
    alternatives_text = m.group(1).strip() if m else ""
    alternatives = {}
    for line in alternatives_text.split("\n"):
        line = line.strip()
        if line and re.match(r"^[A-E]\)", line):
            key, val = line.split(")", 1)
            alternatives[key.strip()] = val.strip()
    question_dict["alternatives"] = alternatives

    m = re.search(r"Alternativa Correta:\s*(.*)", raw_content)
    correct_raw = m.group(1).strip() if m else ""
    match = re.search(r"([A-E])", correct_raw)
    question_dict["correctAnswer"] = match.group(1) if match else ""

    m = re.search(r"Gabarito Comentado:\s*(.*)", raw_content, re.DOTALL)
    question_dict["explanation"] = m.group(1).strip() if m else ""

    question_dict["title"] = question_dict["title"].lstrip("* ").strip()
    question_dict["statement"] = question_dict["statement"].strip("* ").strip()

    return question_dict
