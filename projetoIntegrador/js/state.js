// js/state.js

/**
 * Módulo para gerenciar o estado da aplicação de forma centralizada.
 * Evita que dados importantes fiquem espalhados pelo código.
 */
const appState = {
  currentUser: null,
  questions: [],
  currentPage: 1,
  currentFilter: 'all',
  questionsPerPage: 10,
};

// Funções para modificar o estado de forma controlada
export const setCurrentUser = (user) => {
  appState.currentUser = user;
};

export const setQuestions = (questions) => {
  appState.questions = questions;
};

export const setCurrentPage = (page) => {
  appState.currentPage = page;
};

export const setCurrentFilter = (filter) => {
  appState.currentFilter = filter;
  appState.currentPage = 1; // Reseta a página ao mudar o filtro
};

// Função para obter uma cópia do estado (evita modificações diretas)
export const getState = () => {
  return { ...appState };
};