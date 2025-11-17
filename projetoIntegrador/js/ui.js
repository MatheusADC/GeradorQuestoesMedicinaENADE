// js/ui.js

/**
 * Módulo responsável por toda e qualquer manipulação do DOM.
 * Ele não sabe de onde vêm os dados, apenas como exibi-los.
 * Contém todas as funções de renderização.
 */

// Mapeamento de IDs para elementos do DOM para evitar repetição
const elements = {
  // Seções
  sections: document.querySelectorAll(".section-content"),
  // Navbar
  authLinks: document.getElementById("auth-links"),
  userMenu: document.getElementById("user-menu"),
  mainNavLinks: document.getElementById("main-nav-links"),
  // Dashboard
  totalQuestions: document.getElementById("totalQuestions"),
  approvedQuestions: document.getElementById("approvedQuestions"),
  pendingQuestions: document.getElementById("pendingQuestions"),
  draftQuestions: document.getElementById("draftQuestions"),
  recentActivity: document.getElementById("recentActivity"),
  // Lista de Questões
  questionsList: document.getElementById("questions-list"),
  pagination: document.getElementById("pagination"),
  // Formulário de Criação/Edição
  createQuestionForm: document.getElementById("create-question-form"),
  editingQuestionId: document.getElementById("editing-question-id"),
  questionTitle: document.getElementById("questionTitle"),
  questionStatement: document.getElementById("questionStatement"),
  questionSubjectArea: document.getElementById("questionSubjectArea"),
  questionDifficulty: document.getElementById("questionDifficulty"),
  questionSourceType: document.getElementById("questionSourceType"),
  questionStatus: document.getElementById("questionStatus"),
  promptForm: document.getElementById("prompt-form"),
  generateQuestionBtn: document.getElementById("generate-question-btn"),
  generateSpinner: document.getElementById("generate-spinner"),
  generateButtonIcon: document.getElementById("generate-button-icon"),
  generateButtonText: document.getElementById("generate-button-text"),
  formContainer: document.getElementById("form-container"),
  formLoader: document.getElementById("form-loader"),
  formFieldset: document.getElementById("form-fieldset"),
  correctAnswer: document.getElementById("correctAnswer"),
  explanation: document.getElementById("explanation"),
  alternatives: {
    A: document.getElementById("alternativeA"),
    B: document.getElementById("alternativeB"),
    C: document.getElementById("alternativeC"),
    D: document.getElementById("alternativeD"),
    E: document.getElementById("alternativeE"),
  },
};

const setMainNavVisibility = (isVisible) => {
  const navLinks = elements.mainNavLinks;
  if (!navLinks) return;

  navLinks.classList.toggle("nav-links-hidden", !isVisible);
  navLinks.setAttribute("aria-hidden", String(!isVisible));

  if (!isVisible) {
    navLinks.setAttribute("inert", "");
  } else {
    navLinks.removeAttribute("inert");
  }
};

// --- Funções de Renderização ---

export const showSection = (sectionId) => {
  elements.sections.forEach((section) => {
    section.classList.toggle("hidden", section.id !== sectionId);
  });
};

export const setPromptLoading = (isLoading) => {
  const {
    generateQuestionBtn,
    generateSpinner,
    generateButtonIcon,
    generateButtonText,
  } = elements;

  if (!generateQuestionBtn) return;

  generateQuestionBtn.disabled = isLoading;
  if (generateSpinner) {
    generateSpinner.classList.toggle("hidden", !isLoading);
  }
  if (generateButtonIcon) {
    generateButtonIcon.classList.toggle("hidden", isLoading);
  }
  if (generateButtonText) {
    generateButtonText.textContent = isLoading
      ? "Gerando questão..."
      : "Gerar Questão";
  }
};

const getStatusBadge = (status) => {
  const map = {
    approved: { text: "Aprovada", color: "success" },
    pending: { text: "Pendente", color: "warning" },
    draft: { text: "Rascunho", color: "secondary" },
  };
  const { text, color } = map[status] || { text: status, color: "dark" };
  return `<span class="badge bg-${color}">${text}</span>`;
};

const createQuestionCardHTML = (question) => {
  return `
    <div class="card question-card mb-3">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h5 class="card-title">${question.title}</h5>
            <p class="card-text text-muted">${question.statement.substring(
              0,
              150
            )}...</p>
            <div class="d-flex flex-wrap gap-2">
              ${getStatusBadge(question.status)}
              <span class="badge bg-info">${question.subjectArea || ""}</span>
            </div>
          </div>
          <div class="col-md-4 text-end">
            <button class="btn btn-sm btn-outline-primary" data-action="view" data-id="${
              question.id
            }">Ver</button>
            <button class="btn btn-sm btn-outline-warning" data-action="edit" data-id="${
              question.id
            }">Editar</button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${
              question.id
            }">Excluir</button>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const renderQuestions = (questions) => {
  if (questions.length === 0) {
    elements.questionsList.innerHTML = `<div class="alert alert-info">Nenhuma questão encontrada.</div>`;
    return;
  }
  elements.questionsList.innerHTML = questions
    .map(createQuestionCardHTML)
    .join("");
};

export const updateDashboardStats = (questions) => {
  elements.totalQuestions.textContent = questions.length;
  elements.approvedQuestions.textContent = questions.filter(
    (q) => q.status === "approved"
  ).length;
  elements.pendingQuestions.textContent = questions.filter(
    (q) => q.status === "pending"
  ).length;
  elements.draftQuestions.textContent = questions.filter(
    (q) => q.status === "draft"
  ).length;
};

export const updateNavbar = (user) => {
  if (user) {
    elements.authLinks.classList.add("hidden");
    elements.userMenu.classList.remove("hidden");
    setMainNavVisibility(true);
    elements.userMenu.innerHTML = `
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">${user.name}</a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" data-action="logout">Sair</a></li>
              </ul>
            </li>
        `;
  } else {
    elements.authLinks.classList.remove("hidden");
    elements.userMenu.classList.add("hidden");
    setMainNavVisibility(false);
    elements.userMenu.innerHTML = "";
  }
};

export const showAlert = (message, type = "success") => {
  const alertContainer = document.createElement("div");
  alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  alertContainer.style.zIndex = "1050";
  alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
  document.body.append(alertContainer);
  setTimeout(() => {
    const bsAlert = bootstrap.Alert.getOrCreateInstance(alertContainer);
    bsAlert.close();
  }, 5000);
};

export const populateEditForm = (question) => {
  populateQuestionForm(question);
  showSection("create");
};

export const clearCreateForm = () => {
  elements.createQuestionForm.reset();
  elements.editingQuestionId.value = "";
  if (elements.questionSubjectArea) elements.questionSubjectArea.value = "";
  if (elements.questionDifficulty) elements.questionDifficulty.value = "";
  if (elements.questionSourceType) elements.questionSourceType.value = "manual";
  if (elements.questionStatus) elements.questionStatus.value = "draft";
};

/**
 * Exibe o formulário principal e o overlay de carregamento, desabilitando os campos.
 */
export const showFormLoader = () => {
  elements.formContainer.classList.remove("hidden");
  elements.formLoader.classList.remove("hidden");
  elements.formFieldset.disabled = true;
};

/**
 * Esconde o overlay de carregamento e habilita os campos do formulário.
 */
export const hideFormLoader = () => {
  elements.formLoader.classList.add("hidden");
  elements.formFieldset.disabled = false;
};

/**
 * Preenche o formulário de criação/edição com os dados (vindo da IA ou para edição).
 * @param {object} question O objeto da questão com todos os dados.
 */
export const populateQuestionForm = (question) => {
  // Limpa o formulário para garantir que não haja dados antigos
  elements.createQuestionForm.reset();

  elements.formContainer.classList.remove("hidden");
  elements.formFieldset.disabled = false;

  elements.editingQuestionId.value = question.id || "";
  elements.questionTitle.value = question.title || "";
  elements.questionStatement.value = question.statement || "";
  elements.correctAnswer.value = question.correctAnswer || "";
  elements.explanation.value = question.explanation || "";

  if (elements.questionSubjectArea) {
    elements.questionSubjectArea.value =
      question.subjectArea || elements.questionSubjectArea.value || "";
  }
  if (elements.questionDifficulty) {
    elements.questionDifficulty.value =
      question.difficultyLevel || elements.questionDifficulty.value || "";
  }
  if (elements.questionSourceType) {
    elements.questionSourceType.value =
      question.sourceType || elements.questionSourceType.value || "manual";
  }
  if (elements.questionStatus) {
    elements.questionStatus.value =
      question.status || elements.questionStatus.value || "draft";
  }

  // Preenche as alternativas
  for (const letter of ["A", "B", "C", "D", "E"]) {
    const input = elements.alternatives[letter];
    if (input) {
      input.value = question.alternatives?.[letter] || "";
    } else {
      console.warn(`Input da alternativa ${letter} não encontrado!`);
    }
  }

  // Preenche a resposta correta (apenas a letra)
  if (question.correctAnswer) {
    elements.correctAnswer.value = question.correctAnswer;
  }
};

export const showQuestionModal = (question) => {
  // Remove qualquer modal antigo para evitar acúmulo
  const oldModal = document.getElementById("questionViewModal");
  if (oldModal) {
    oldModal.remove();
  }

  // Cria o HTML do modal dinamicamente com os dados da questão
  const modalHtml = `
    <div class="modal fade" id="questionViewModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${question.title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p><strong>Área:</strong> ${question.subjectArea}</p>
            <p><strong>Dificuldade:</strong> ${question.difficultyLevel}</p>
            <hr>
            <h6>Enunciado:</h6>
            <p>${question.statement}</p>
            <h6>Alternativas:</h6>
            ${Object.entries(question.alternatives)
              .map(
                ([key, value]) => `
              <div class="p-2 mb-2 rounded ${
                key === question.correctAnswer
                  ? "bg-success-subtle border border-success-subtle"
                  : "bg-light"
              }">
                <strong>${key})</strong> ${value}
              </div>
            `
              )
              .join("")}
            ${
              question.explanation
                ? `
              <hr>
              <h6>Explicação:</h6>
              <p>${question.explanation}</p>
            `
                : ""
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Adiciona o HTML do modal ao corpo da página
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Usa a API do Bootstrap para controlar o modal
  const modalElement = document.getElementById("questionViewModal");
  const modal = new bootstrap.Modal(modalElement);

  // Remove o elemento do DOM depois que o modal for fechado
  modalElement.addEventListener("hidden.bs.modal", () => {
    modalElement.remove();
  });

  modal.show();
};

/**
 * Mostra uma pré-visualização do arquivo PDF selecionado.
 * @param {File} file O objeto do arquivo selecionado.
 */
export const showFilePreview = (file) => {
  const previewContainer = document.getElementById("file-preview");
  const uploadBtn = document.getElementById("upload-btn");

  // Função para formatar o tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  previewContainer.classList.remove("hidden");
  previewContainer.innerHTML = `
    <div class="card bg-light">
      <div class="card-body d-flex align-items-center">
        <i class="fas fa-file-pdf text-danger fa-2x me-3"></i>
        <div class="flex-grow-1">
          <h6 class="mb-0">${file.name}</h6>
          <small class="text-muted">${formatFileSize(file.size)}</small>
        </div>
        <button type="button" class="btn-close" aria-label="Remover arquivo" data-action="remove-file"></button>
      </div>
    </div>
  `;

  if (uploadBtn) {
    uploadBtn.disabled = false;
  }
};

/**
 * Remove a pré-visualização do arquivo e desabilita o botão de upload.
 */
export const removeFilePreview = () => {
  const previewContainer = document.getElementById("file-preview");
  const pdfFileInput = document.getElementById("pdf-file-input");
  const uploadBtn = document.getElementById("upload-btn");

  if (previewContainer) previewContainer.classList.add("hidden");
  if (pdfFileInput) pdfFileInput.value = ""; // Limpa o input de arquivo
  if (uploadBtn) uploadBtn.disabled = true;
};

/**
 * Altera o estilo da área de upload para indicar que um arquivo está sendo arrastado sobre ela.
 * @param {boolean} isDragging Verdadeiro se um arquivo está sobre a área.
 */
export const setUploadAreaDragState = (isDragging) => {
  const uploadArea = document.getElementById("file-upload-area");
  if (uploadArea) {
    uploadArea.classList.toggle("border-primary", isDragging);
    uploadArea.classList.toggle("bg-primary-subtle", isDragging);
  }
};
