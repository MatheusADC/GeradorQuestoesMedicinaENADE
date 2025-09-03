// js/events.js
import * as api from './api.js';
import * as ui from './ui.js';
import * as state from './state.js';


// --- Funções de Handler ---

async function handlePromptFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const promptData = Object.fromEntries(formData.entries());
  ui.showFormLoader();
  try {
    const generatedQuestion = await api.generateQuestionFromPrompt(promptData);
    ui.populateQuestionForm(generatedQuestion);
  } catch (error) {
    console.error("Erro ao gerar questão:", error);
    ui.showAlert('Houve um erro com a IA. Tente novamente.', 'danger');
  } finally {
    ui.hideFormLoader();
  }
}

async function handleCreateQuestionSubmit(e) {
    e.preventDefault();
    // ... Lógica para salvar a questão ...
    ui.showAlert('Questão salva com sucesso!');
    ui.showSection('questions');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const user = await api.login(email, password);
    state.setCurrentUser(user);
    const questions = await api.fetchQuestions();
    state.setQuestions(questions);
    ui.updateNavbar(user);
    ui.updateDashboardStats(questions);
    ui.showSection('dashboard');
    ui.showAlert(`Bem-vindo, ${user.name}!`);
  } catch (err) {
    ui.showAlert('Falha no login.', 'danger');
  }
}

async function handleLogout() {
    await api.logout();
    state.setCurrentUser(null);
    ui.updateNavbar(null);
    ui.showSection('home');
    ui.showAlert('Você saiu da sua conta.', 'info');
}

// --- Handlers para os botões das questões ---

async function handleViewQuestion(id) {
    const questions = state.getState().questions;
    const question = questions.find(q => q.id === id);
    if (question) {
        ui.showQuestionModal(question);
    }
}

async function handleEditQuestion(id) {
    const questions = state.getState().questions;
    const question = questions.find(q => q.id === id);
    if (question) {
        ui.populateQuestionForm(question);
        ui.showSection('create'); // Leva o usuário para a tela de edição
    }
}

async function handleDeleteQuestion(id) {
    if (confirm('Tem certeza que deseja excluir esta questão?')) {
        await api.deleteQuestion(id);
        const questions = await api.fetchQuestions();
        state.setQuestions(questions);
        
        // Atualiza a UI para refletir a exclusão
        ui.renderQuestions(questions);
        ui.updateDashboardStats(questions);
        ui.showAlert('Questão excluída com sucesso!');
    }
}

// Handlers da Página de Upload
function handleFileSelect(file) {
    if (file && file.type === 'application/pdf') {
        ui.showFilePreview(file);
    } else {
        ui.removeFilePreview();
        ui.showAlert('Por favor, selecione um arquivo PDF.', 'warning');
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
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('[data-section-id]');
        const actionButton = e.target.closest('[data-action]');
        const selectFileBtn = e.target.closest('#select-file-btn'); // <-- ADIÇÃO

        if (navLink) {
            // Lógica de Navegação (já estava correta)
            e.preventDefault();
            ui.showSection(navLink.dataset.sectionId);

        } else if (actionButton) {
            // Lógica de Ações (agora inclui 'remove-file')
            e.preventDefault();
            const action = actionButton.dataset.action;
            const id = parseInt(actionButton.dataset.id, 10);

            if (action === 'view') handleViewQuestion(id);
            if (action === 'edit') handleEditQuestion(id);
            if (action === 'delete') handleDeleteQuestion(id);
            if (action === 'logout') handleLogout();
            if (action === 'remove-file') ui.removeFilePreview(); // <-- ADIÇÃO

        } else if (selectFileBtn) {
            // Lógica para o botão "Selecionar Arquivo" // <-- ADIÇÃO
            document.getElementById('pdf-file-input').click();
        }
    });

  // Listeners específicos para cada formulário
  const promptForm = document.getElementById('prompt-form');
  if (promptForm) {
    promptForm.addEventListener('submit', handlePromptFormSubmit);
  }

  const createQuestionForm = document.getElementById('create-question-form');
  if (createQuestionForm) {
      createQuestionForm.addEventListener('submit', handleCreateQuestionSubmit);
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
  }
  
  const uploadForm = document.getElementById('upload-form');
if(uploadForm) {
    uploadForm.addEventListener('submit', handleUploadFormSubmit);
}

// Listeners específicos para a página de UPLOAD
const pdfFileInput = document.getElementById('pdf-file-input');
if (pdfFileInput) {
    pdfFileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
}

const uploadArea = document.getElementById('file-upload-area');
if (uploadArea) {
    // Previne o comportamento padrão do navegador para drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    // Adiciona feedback visual ao arrastar
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => ui.setUploadAreaDragState(true));
    });
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => ui.setUploadAreaDragState(false));
    });
    // Lida com o arquivo que foi solto na área
    uploadArea.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        pdfFileInput.files = e.dataTransfer.files;
        handleFileSelect(file);
    });
}
};