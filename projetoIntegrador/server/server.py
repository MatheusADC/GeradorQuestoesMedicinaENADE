from flask import Flask, jsonify, request, g
from flask_cors import CORS
from werkzeug.security import check_password_hash

try:
    from .database import (
        create_user,
        create_user_question,
        delete_user_question,
        get_user_by_email,
        init_user_db,
        list_user_questions,
        update_user_question,
    )
    from .question_service import buscar_questoes_contexto, gerar_questao_llm
    from .security import generate_jwt, token_required
except ImportError:
    from database import (
        create_user,
        create_user_question,
        delete_user_question,
        get_user_by_email,
        init_user_db,
        list_user_questions,
        update_user_question,
    )
    from question_service import buscar_questoes_contexto, gerar_questao_llm
    from security import generate_jwt, token_required

app = Flask(__name__)
CORS(app)


def build_user_payload(row):
    return {"id": row[0], "name": row[1], "email": row[2]}


@app.route("/gerar_questao", methods=["POST"])
@token_required
def gerar_questao_endpoint():
    data = request.json or {}
    especialidade = data.get("especialidade")
    dificuldade = data.get("dificuldade")
    prompt = data.get("prompt")

    contexto_questoes = buscar_questoes_contexto(especialidade, dificuldade)
    questao_gerada = gerar_questao_llm(contexto_questoes, especialidade, dificuldade, prompt)

    return jsonify(questao_gerada)


@app.route("/register", methods=["POST"])
def register_user():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"message": "Nome, email e senha são obrigatórios."}), 400

    if len(password) < 6:
        return jsonify({"message": "A senha deve possuir ao menos 6 caracteres."}), 400

    if get_user_by_email(email):
        return jsonify({"message": "Email já cadastrado."}), 409

    user = create_user(name, email, password)
    token = generate_jwt(user)
    return jsonify({"user": user, "token": token}), 201


@app.route("/login", methods=["POST"])
def login_user():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "Email e senha são obrigatórios."}), 400

    row = get_user_by_email(email)
    if not row or not check_password_hash(row[3], password):
        return jsonify({"message": "Credenciais inválidas."}), 401

    user = build_user_payload(row)
    token = generate_jwt(user)
    return jsonify({"user": user, "token": token})


@app.route("/me", methods=["GET"])
@token_required
def get_current_user():
    return jsonify({"user": g.current_user})


def _validate_question_payload(data):
    if not isinstance(data, dict):
        raise ValueError("Dados inválidos para a questão.")
    return data


@app.route("/questions", methods=["GET"])
@token_required
def list_questions_endpoint():
    questions = list_user_questions(g.current_user["id"])
    return jsonify({"questions": questions})


@app.route("/questions", methods=["POST"])
@token_required
def create_question_endpoint():
    try:
        data = _validate_question_payload(request.get_json() or {})
        question = create_user_question(g.current_user["id"], data)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"question": question}), 201


@app.route("/questions/<int:question_id>", methods=["PUT"])
@token_required
def update_question_endpoint(question_id: int):
    try:
        data = _validate_question_payload(request.get_json() or {})
        question = update_user_question(g.current_user["id"], question_id, data)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    except LookupError:
        return jsonify({"message": "Questão não encontrada."}), 404
    return jsonify({"question": question})


@app.route("/questions/<int:question_id>", methods=["DELETE"])
@token_required
def delete_question_endpoint(question_id: int):
    deleted = delete_user_question(g.current_user["id"], question_id)
    if not deleted:
        return jsonify({"message": "Questão não encontrada."}), 404
    return jsonify({"success": True})


init_user_db()


if __name__ == "__main__":
    app.run(debug=True)
