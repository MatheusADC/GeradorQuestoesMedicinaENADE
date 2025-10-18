// js/main.js
import * as api from './api.js';
import * as ui from './ui.js';
import * as state from './state.js';
import * as events from './events.js';

/**
 * Ponto de entrada da aplicação.
 * Responsável por orquestrar a inicialização dos módulos.
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('IAQuestMed App Inicializado!');

  // 1. Configura os event listeners
  events.initialize();

  // 2. Verifica se há um usuário logado na sessão
  const user = api.getLoggedInUser();
  if (user) {
    state.setCurrentUser(user);
  }
  
  // 3. Carrega os dados iniciais da "API"
  const questions = await api.fetchQuestions();
  state.setQuestions(questions);

  // 4. Renderiza a interface inicial com os dados carregados
  ui.updateNavbar(user);
  ui.updateDashboardStats(questions);
  ui.renderQuestions(questions); // Renderiza a lista completa inicialmente
  
  // 5. Exibe a seção correta (dashboard se logado, home se não)
  if (user) {
    ui.showSection('dashboard');
  } else {
    ui.showSection('home');
  }
});