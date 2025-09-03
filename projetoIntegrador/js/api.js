// js/api.js
import { getSampleQuestions } from './sample-data.js';

/**
 * Módulo responsável pela comunicação com a "fonte de dados".
 * Atualmente, simula uma API usando o localStorage do navegador.
 * QUANDO O BACK-END ESTIVER PRONTO, ESTE É O ÚNICO ARQUIVO A SER MODIFICADO.
 */

const QUESTIONS_KEY = 'medicalQuestions';

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

// --- Funções Públicas da API ---

export const fetchQuestions = () => {
  // Em uma API real: return fetch('/api/questions').then(res => res.json());
  return Promise.resolve(questions);
};

export const saveQuestion = (questionData) => {
  // Lógica para criar ou atualizar uma questão
  const existingIndex = questions.findIndex(q => q.id === questionData.id);
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
  questions = questions.filter(q => q.id !== questionId);
  persistQuestions();
  return Promise.resolve({ success: true });
};

export const approveQuestion = (questionId) => {
  const question = questions.find(q => q.id === questionId);
  if (question) {
    question.status = 'approved';
    persistQuestions();
  }
  return Promise.resolve(question);
};

// Funções de login/registro simuladas
export const login = (email, password) => {
  console.log('Simulando login para:', email, password);
  const demoUser = {
    id: 1,
    name: 'Dr. João Silva',
    email: email,
  };
  localStorage.setItem('currentUser', JSON.stringify(demoUser));
  return Promise.resolve(demoUser);
};

export const register = (userData) => {
  console.log('Simulando registro para:', userData);
  const newUser = {
    id: Date.now(),
    name: userData.name,
    email: userData.email,
  };
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  return Promise.resolve(newUser);
};

export const logout = () => {
    localStorage.removeItem('currentUser');
    return Promise.resolve();
};

export const getLoggedInUser = () => {
    return JSON.parse(localStorage.getItem('currentUser'));
}

export const generateQuestionFromPrompt = (promptData) => {
  console.log('Enviando para a IA:', promptData);

  return new Promise(resolve => {
    // Simula um delay de 2.5 segundos do back-end processando
    setTimeout(() => {
      console.log('IA retornou uma resposta.');
      
      // Objeto de exemplo que a IA retornaria
      const generatedQuestion = {
        title: `Questão sobre ${promptData.subjectArea}`,
        statement: `Baseado no prompt "${promptData.questionPrompt}", qual das seguintes opções representa o cenário correto para um paciente em estado ${promptData.difficultyLevel}?`,
        alternatives: {
          A: "Alternativa A gerada pela IA.",
          B: "Alternativa B gerada pela IA.",
          C: "Alternativa C gerada pela IA.",
          D: "Alternativa D gerada pela IA.",
          E: ""
        },
        correctAnswer: "A",
        explanation: "Esta explicação foi gerada automaticamente pela IA com base no prompt fornecido.",
        difficultyLevel: promptData.difficultyLevel,
        subjectArea: promptData.subjectArea,
        status: 'draft', 
        sourceType: 'ia-generated',
      };
      
      // Resolve a Promise, entregando a questão gerada
      resolve(generatedQuestion);
    }, 2500); 
  });
};