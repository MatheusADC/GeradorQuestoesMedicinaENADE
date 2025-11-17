// js/events.js
import * as api from "./api.js";
import * as ui from "./ui.js";
import * as state from "./state.js";

// --- Funções de Handler ---
async function handlePromptFormSubmit(e) {
  e.preventDefault();

  // Pega os valores do formulário
  const especialidade = document.getElementById("subjectArea").value;
  const dificuldade = document.getElementById("difficultyLevel").value;
  const prompt = document.getElementById("questionPrompt").value;

  // Monta o JSON
  const payload = {
    especialidade,
    dificuldade,
    prompt,
  };

  ui.setPromptLoading(true);
  ui.showFormLoader();
  try {
    const token = api.getAuthToken();
    if (!token) {
      throw new Error("Faça login para gerar questões com a IA.");
    }

    const response = await fetch("http://localhost:5000/gerar_questao", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload?.message || "Falha ao gerar questão.");
    }

    const data = await response.json();
    const generatedQuestion = {
      ...data,
      subjectArea: especialidade,
      difficultyLevel: dificuldade,
      status: "draft",
      sourceType: "ia-generated",
    };
    ui.populateQuestionForm(generatedQuestion);
  } catch (error) {
    console.error("Erro ao gerar questão:", error);
    ui.showAlert(
      error.message || "Houve um erro com a IA. Tente novamente.",
      "danger"
    );
  } finally {
    ui.setPromptLoading(false);
    ui.hideFormLoader();
  }
}

async function handleCreateQuestionSubmit(e) {
  e.preventDefault();
  const { currentUser } = state.getState();
  if (!currentUser) {
    ui.showAlert("Faça login para salvar questões.", "warning");
    ui.showSection("login");
    return;
  }

  const editingId = document.getElementById("editing-question-id").value;
  const title = document.getElementById("questionTitle").value.trim();
  const statement = document.getElementById("questionStatement").value.trim();
  const correctAnswer = document
    .getElementById("correctAnswer")
    .value.trim()
    .toUpperCase();
  const explanation = document.getElementById("explanation").value.trim();

  const subjectAreaHidden = document
    .getElementById("questionSubjectArea")
    .value.trim();
  const difficultyHidden = document
    .getElementById("questionDifficulty")
    .value.trim();
  const sourceTypeHidden = document
    .getElementById("questionSourceType")
    .value.trim();
  const statusHidden = document.getElementById("questionStatus").value.trim();

  const subjectAreaSelect = document.getElementById("subjectArea");
  const difficultySelect = document.getElementById("difficultyLevel");
  const subjectAreaFallback = subjectAreaSelect
    ? subjectAreaSelect.value.trim()
    : "";
  const difficultyFallback = difficultySelect
    ? difficultySelect.value.trim()
    : "";

  const alternatives = {
    A: document.getElementById("alternativeA").value.trim(),
    B: document.getElementById("alternativeB").value.trim(),
    C: document.getElementById("alternativeC").value.trim(),
    D: document.getElementById("alternativeD").value.trim(),
    E: document.getElementById("alternativeE").value.trim(),
  };

  const payload = {
    id: editingId ? Number(editingId) : undefined,
    title,
    statement,
    alternatives,
    correctAnswer,
    explanation,
    subjectArea: subjectAreaHidden || subjectAreaFallback,
    difficultyLevel: difficultyHidden || difficultyFallback,
    sourceType: sourceTypeHidden || "manual",
    status: statusHidden || "draft",
  };

  try {
    await api.saveQuestion(payload);
    const questions = await api.fetchQuestions();
    state.setQuestions(questions);
    ui.renderQuestions(questions);
    ui.updateDashboardStats(questions);
    ui.showAlert("Questão salva com sucesso!");
    ui.showSection("questions");
    ui.clearCreateForm();
  } catch (error) {
    ui.showAlert(
      error.message || "Não foi possível salvar a questão.",
      "danger"
    );
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    const user = await api.login(email, password);
    state.setCurrentUser(user);
    const questions = await api.fetchQuestions();
    state.setQuestions(questions);
    ui.updateNavbar(user);
    ui.updateDashboardStats(questions);
    ui.renderQuestions(questions);
    ui.showSection("dashboard");
    ui.showAlert(`Bem-vindo, ${user.name}!`);
  } catch (err) {
    ui.showAlert(err.message || "Falha no login.", "danger");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("doctorName").value;
  const email = document.getElementById("doctorEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const user = await api.register({ name, email, password });
    state.setCurrentUser(user);
    const questions = await api.fetchQuestions();
    state.setQuestions(questions);
    ui.updateNavbar(user);
    ui.updateDashboardStats(questions);
    ui.renderQuestions(questions);
    ui.showSection("dashboard");
    ui.showAlert("Conta criada com sucesso! Bem-vindo(a).");
  } catch (error) {
    ui.showAlert(error.message || "Falha no cadastro.", "danger");
  }
}

async function handleLogout() {
  await api.logout();
  state.setCurrentUser(null);
  const questions = await api.fetchQuestions();
  state.setQuestions(questions);
  ui.renderQuestions(questions);
  ui.updateDashboardStats(questions);
  ui.updateNavbar(null);
  ui.showSection("home");
  ui.showAlert("Você saiu da sua conta.", "info");
}

// --- Handlers para os botões das questões ---

async function handleViewQuestion(id) {
  const questions = state.getState().questions;
  const question = questions.find((q) => q.id === id);
  if (question) {
    ui.showQuestionModal(question);
  }
}

async function handleEditQuestion(id) {
  const questions = state.getState().questions;
  const question = questions.find((q) => q.id === id);
  if (question) {
    ui.populateQuestionForm(question);
    ui.showSection("create"); // Leva o usuário para a tela de edição
  }
}

async function handleDeleteQuestion(id) {
  if (confirm("Tem certeza que deseja excluir esta questão?")) {
    try {
      await api.deleteQuestion(id);
      const questions = await api.fetchQuestions();
      state.setQuestions(questions);

      // Atualiza a UI para refletir a exclusão
      ui.renderQuestions(questions);
      ui.updateDashboardStats(questions);
      ui.showAlert("Questão excluída com sucesso!");
    } catch (error) {
      ui.showAlert(
        error.message || "Não foi possível excluir a questão.",
        "danger"
      );
    }
  }
}

// Handlers da Página de Upload
function handleFileSelect(file) {
  if (file && file.type === "application/pdf") {
    ui.showFilePreview(file);
  } else {
    ui.removeFilePreview();
    ui.showAlert("Por favor, selecione um arquivo PDF.", "warning");
  }
}

async function handleUploadFormSubmit(e) {
  e.preventDefault();
  // ... (lógica de upload simulado) ...
}

// --- Função Principal de Inicialização de Eventos ---

export const initialize = () => {
  // Listener de cliques gerais para navegação e ações
  // CÓDIGO CORRIGIDO E COMPLETO
  document.addEventListener("click", (e) => {
    const navLink = e.target.closest("[data-section-id]");
    const actionButton = e.target.closest("[data-action]");
    const selectFileBtn = e.target.closest("#select-file-btn"); // <-- ADIÇÃO

    if (navLink) {
      // Lógica de Navegação (já estava correta)
      e.preventDefault();
      ui.showSection(navLink.dataset.sectionId);
    } else if (actionButton) {
      // Lógica de Ações (agora inclui 'remove-file')
      e.preventDefault();
      const action = actionButton.dataset.action;
      const id = parseInt(actionButton.dataset.id, 10);

      if (action === "view") handleViewQuestion(id);
      if (action === "edit") handleEditQuestion(id);
      if (action === "delete") handleDeleteQuestion(id);
      if (action === "logout") handleLogout();
      if (action === "remove-file") ui.removeFilePreview(); // <-- ADIÇÃO
    } else if (selectFileBtn) {
      // Lógica para o botão "Selecionar Arquivo" // <-- ADIÇÃO
      document.getElementById("pdf-file-input").click();
    }
  });

  // Listeners específicos para cada formulário
  const promptForm = document.getElementById("prompt-form");
  if (promptForm) {
    promptForm.addEventListener("submit", handlePromptFormSubmit);
  }

  const createQuestionForm = document.getElementById("create-question-form");
  if (createQuestionForm) {
    createQuestionForm.addEventListener("submit", handleCreateQuestionSubmit);
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  const uploadForm = document.getElementById("upload-form");
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleUploadFormSubmit);
  }

  // Listeners específicos para a página de UPLOAD
  const pdfFileInput = document.getElementById("pdf-file-input");
  if (pdfFileInput) {
    pdfFileInput.addEventListener("change", (e) =>
      handleFileSelect(e.target.files[0])
    );
  }

  const uploadArea = document.getElementById("file-upload-area");
  if (uploadArea) {
    // Previne o comportamento padrão do navegador para drag and drop
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    // Adiciona feedback visual ao arrastar
    ["dragenter", "dragover"].forEach((eventName) => {
      uploadArea.addEventListener(eventName, () =>
        ui.setUploadAreaDragState(true)
      );
    });
    ["dragleave", "drop"].forEach((eventName) => {
      uploadArea.addEventListener(eventName, () =>
        ui.setUploadAreaDragState(false)
      );
    });
    // Lida com o arquivo que foi solto na área
    uploadArea.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      pdfFileInput.files = e.dataTransfer.files;
      handleFileSelect(file);
    });
  }
};
