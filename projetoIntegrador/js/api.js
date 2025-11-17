// js/api.js

/**
 * Módulo responsável pela comunicação com a API Flask (autenticação + questões).
 */

const API_BASE_URL = "http://localhost:5000";
const CURRENT_USER_KEY = "currentUser";
const AUTH_TOKEN_KEY = "authToken";

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

const authorizedFetch = async (path, options = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Faça login para acessar este recurso.");
  }
  const headers = buildHeaders(true);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  return handleJsonResponse(response);
};

// --- Funções Públicas da API ---

export const fetchQuestions = async () => {
  const token = getAuthToken();
  if (!token) {
    return [];
  }
  try {
    const data = await authorizedFetch("/questions", { method: "GET" });
    return data.questions || [];
  } catch (error) {
    if (error.message?.includes("login")) {
      return [];
    }
    console.warn("Não foi possível carregar as questões:", error);
    return [];
  }
};

export const saveQuestion = async (questionData) => {
  const hasId = Boolean(questionData.id);
  const path = hasId ? `/questions/${questionData.id}` : "/questions";
  const method = hasId ? "PUT" : "POST";
  const data = await authorizedFetch(path, {
    method,
    body: JSON.stringify(questionData),
  });
  return data.question;
};

export const deleteQuestion = async (questionId) => {
  await authorizedFetch(`/questions/${questionId}`, { method: "DELETE" });
  return { success: true };
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
