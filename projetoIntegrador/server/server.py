from flask import Flask, jsonify, request
import sqlite3
import requests
from flask_cors import CORS
import re

# Permite que o front acesse o Flask
app = Flask(__name__)
CORS(app)  

DB_PATH = "questoes.db"

def buscar_questoes_contexto(especialidade=None, dificuldade=None):
    """
    Busca questões do banco para fornecer como contexto ao agente.
    Se especialidade ou dificuldade forem fornecidos, faz filtro.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    query = "SELECT numero_questao, enunciado, alternativas, resposta_correta, especialidade, dificuldade FROM questoes_objetivas"
    params = []

    filtros = []
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

    # Monta uma lista de dicionários
    questoes = []
    for row in rows:
        questoes.append({
            "numero": row[0],
            "enunciado": row[1],
            "alternativas": row[2],
            "resposta_correta": row[3],
            "especialidade": row[4],
            "dificuldade": row[5]
        })
    return questoes

def gerar_questao_llm(contexto_questoes, especialidade, dificuldade, prompt):
    """
    Envia as questões como contexto para o LM Studio e retorna um dicionário com os campos da questão.
    """
    contexto_texto = ""
    for q in contexto_questoes:
        contexto_texto += f"Q{q['numero']} ({q['especialidade']}, {q['dificuldade']}): {q['enunciado']}\n"
        contexto_texto += f"Alternativas: {q['alternativas']}\n"
        contexto_texto += f"Resposta correta: {q['resposta_correta']}\n\n"

    data = {
        "model": "meta-llama-3.1-8b-instruct",
        "messages": [
            {"role": "system", "content": "Você é um gerador de questões do ENADE Medicina."},
            {"role": "user", "content": f"Use os exemplos abaixo como referência para criar uma nova questão.\n\n{contexto_texto}\nCrie uma questão de {especialidade}, dificuldade {dificuldade}, sobre {prompt}. Dê 5 alternativas e indique a correta. Siga ESTRITAMENTE a seguinte forma para me dar a resposta e NÃO ESQUEÇA de usar como referência os exemplos que foram fornecidos:\nTítulo da Questão: ...\nEnunciado da Questão: ...\nAlternativas da Questão: A) ... B) ... C) ... D) ... E) ...\nAlternativa Correta: ..."}
        ]
    }

    response = requests.post("http://localhost:1234/v1/chat/completions", json=data)
    raw_content = response.json()["choices"][0]["message"]["content"]

    # --- Parse da resposta para criar um dicionário ---
    question_dict = {}

    # Título
    m = re.search(r'Título da Questão:\s*(.*)', raw_content)
    question_dict['title'] = m.group(1).strip() if m else f"Questão sobre {especialidade}"

    # Enunciado
    m = re.search(r'Enunciado da Questão:\s*(.*?)(?:Alternativas da Questão:|$)', raw_content, re.DOTALL)
    question_dict['statement'] = m.group(1).strip() if m else ''

    # Alternativas
    m = re.search(r'Alternativas da Questão:\s*(.*?)(?:Alternativa Correta:|$)', raw_content, re.DOTALL)
    alternatives_text = m.group(1).strip() if m else ''
    alternatives = {}
    for line in alternatives_text.split('\n'):
        line = line.strip()
        if line and re.match(r'^[A-E]\)', line):
            key, val = line.split(')', 1)
            alternatives[key.strip()] = val.strip()
    question_dict['alternatives'] = alternatives

    # Alternativa correta
    m = re.search(r'Alternativa Correta:\s*(.*)', raw_content)
    correct_raw = m.group(1).strip() if m else ''

    # Extrai apenas a letra A-E
    match = re.search(r'([A-E])', correct_raw)
    question_dict['correctAnswer'] = match.group(1) if match else ''

    question_dict['title'] = question_dict['title'].lstrip('* ').strip()
    question_dict['statement'] = question_dict['statement'].strip('* ').strip()

    return question_dict

# Endpoint para gerar questão
@app.route("/gerar_questao", methods=["POST"])
def gerar_questao_endpoint():
    """
    Recebe JSON com 'especialidade', 'dificuldade', 'prompt' e retorna a questão gerada pelo LLM.
    """
    data = request.json
    especialidade = data.get("especialidade")
    dificuldade = data.get("dificuldade")
    prompt = data.get("prompt")

    # Busca questões do banco como contexto
    contexto_questoes = buscar_questoes_contexto(especialidade, dificuldade)

    # Gera nova questão
    questao_gerada = gerar_questao_llm(contexto_questoes, especialidade, dificuldade, prompt)

    return jsonify(questao_gerada)

if __name__ == "__main__":

    app.run(debug=True)
