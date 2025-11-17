// js/main.js
import * as api from "./api.js";
import * as ui from "./ui.js";
import * as state from "./state.js";
import * as events from "./events.js";

/**
 * Ponto de entrada da aplicação.
 * Responsável por orquestrar a inicialização dos módulos.
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("IAQuestMed App Inicializado!");

  // 1. Configura os event listeners
  events.initialize();

  // 2. Verifica se há um usuário logado na sessão (sincronizando com o back-end)
  let user = null;
  try {
    user = await api.restoreSession();
  } catch (error) {
    console.warn("Sessão inválida:", error);
  }

  if (user) {
    state.setCurrentUser(user);
  }

  // 3. Atualiza a navbar imediatamente para evitar flashes
  ui.updateNavbar(user);

  // 4. Carrega os dados iniciais da "API"
  const questions = await api.fetchQuestions();
  state.setQuestions(questions);

  // 5. Renderiza a interface inicial com os dados carregados
  ui.updateDashboardStats(questions);
  ui.renderQuestions(questions); // Renderiza a lista completa inicialmente

  // 6. Exibe a seção correta (dashboard se logado, home se não)
  if (user) {
    ui.showSection("dashboard");
  } else {
    ui.showSection("home");
  }
});
