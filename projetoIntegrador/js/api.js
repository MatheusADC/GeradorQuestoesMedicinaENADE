// js/api.js
import { getSampleQuestions } from "./sample-data.js";

/**
 * Módulo responsável pela comunicação com a "fonte de dados".
 * Atualmente, simula uma API usando o localStorage do navegador.
 * QUANDO O BACK-END ESTIVER PRONTO, ESTE É O ÚNICO ARQUIVO A SER MODIFICADO.
 */

const API_BASE_URL = "http://localhost:5000";
const QUESTIONS_KEY = "medicalQuestions";
const CURRENT_USER_KEY = "currentUser";
const AUTH_TOKEN_KEY = "authToken";

// Carrega as questões do localStorage ou usa os dados de exemplo
const loadInitialQuestions = () => {
  const savedQuestions = localStorage.getItem(QUESTIONS_KEY);
  if (savedQuestions) {
    return JSON.parse(savedQuestions);
  }
  const sampleQuestions = getSampleQuestions();
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(sampleQuestions));
  return sampleQuestions;
};

let questions = loadInitialQuestions();

const persistQuestions = () => {
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
};

const handleJsonResponse = async (response) => {
  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    // Mantém data vazio quando não há corpo
  }

  if (!response.ok) {
    const message = data?.message || "Erro inesperado ao falar com o servidor.";
    throw new Error(message);
  }

  return data;
};

const persistSession = (user, token) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

const buildHeaders = (includeToken = false) => {
  const headers = { "Content-Type": "application/json" };
  if (includeToken) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
};

// --- Funções Públicas da API ---

export const fetchQuestions = () => {
  // Em uma API real: return fetch('/api/questions').then(res => res.json());
  return Promise.resolve(questions);
};

export const saveQuestion = (questionData) => {
  // Lógica para criar ou atualizar uma questão
  const existingIndex = questions.findIndex((q) => q.id === questionData.id);
  if (existingIndex > -1) {
    questions[existingIndex] = { ...questions[existingIndex], ...questionData };
  } else {
    questionData.id = Date.now();
    questionData.createdAt = new Date().toISOString();
    questions.push(questionData);
  }
  persistQuestions();
  return Promise.resolve(questionData);
};

export const deleteQuestion = (questionId) => {
  questions = questions.filter((q) => q.id !== questionId);
  persistQuestions();
  return Promise.resolve({ success: true });
};

export const approveQuestion = (questionId) => {
  const question = questions.find((q) => q.id === questionId);
  if (question) {
    question.status = "approved";
    persistQuestions();
  }
  return Promise.resolve(question);
};

export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ email, password }),
  });

  const data = await handleJsonResponse(response);
  persistSession(data.user, data.token);
  return data.user;
};

export const register = async ({ name, email, password }) => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ name, email, password }),
  });

  const data = await handleJsonResponse(response);
  persistSession(data.user, data.token);
  return data.user;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  return Promise.resolve();
};

export const getLoggedInUser = () => {
  const serialized = localStorage.getItem(CURRENT_USER_KEY);
  return serialized ? JSON.parse(serialized) : null;
};

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const restoreSession = async () => {
  const token = getAuthToken();
  if (!token) {
    return getLoggedInUser();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: "GET",
      headers: buildHeaders(true),
    });
    const data = await handleJsonResponse(response);
    persistSession(data.user, token);
    return data.user;
  } catch (error) {
    await logout();
    return null;
  }
};

export const generateQuestionFromPrompt = (promptData) => {
  console.log("Enviando para a IA:", promptData);

  return new Promise((resolve) => {
    // Simula um delay de 2.5 segundos do back-end processando
    setTimeout(() => {
      console.log("IA retornou uma resposta.");

      // Objeto de exemplo que a IA retornaria
      const generatedQuestion = {
        title: `Questão sobre ${promptData.subjectArea}`,
        statement: `Baseado no prompt "${promptData.questionPrompt}", qual das seguintes opções representa o cenário correto para um paciente em estado ${promptData.difficultyLevel}?`,
        alternatives: {
          A: "Alternativa A gerada pela IA.",
          B: "Alternativa B gerada pela IA.",
          C: "Alternativa C gerada pela IA.",
          D: "Alternativa D gerada pela IA.",
          E: "",
        },
        correctAnswer: "A",
        explanation:
          "Esta explicação foi gerada automaticamente pela IA com base no prompt fornecido.",
        difficultyLevel: promptData.difficultyLevel,
        subjectArea: promptData.subjectArea,
        status: "draft",
        sourceType: "ia-generated",
      };

      // Resolve a Promise, entregando a questão gerada
      resolve(generatedQuestion);
    }, 2500);
  });
};
