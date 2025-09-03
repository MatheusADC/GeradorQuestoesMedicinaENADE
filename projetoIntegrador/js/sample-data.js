// js/sample-data.js

/**
 * Contém os dados iniciais para popular a aplicação
 * caso o localStorage esteja vazio.
 */
export function getSampleQuestions() {
  return [
    {
      id: 1,
      title: "Infarto Agudo do Miocárdio",
      statement: "Paciente de 65 anos, diabético, chega ao pronto-socorro com dor torácica há 2 horas. ECG mostra supradesnível de ST em DII, DIII e aVF. Qual a melhor conduta?",
      alternatives: {
        A: "Fibrinolítico endovenoso",
        B: "Angioplastia primária",
        C: "Heparina não fracionada",
        D: "Observação clínica",
        E: "Cirurgia de revascularização"
      },
      correctAnswer: "B",
      explanation: "Angioplastia primária é o tratamento de escolha no IAM com supra de ST quando disponível.",
      difficultyLevel: "hard",
      subjectArea: "Cardiologia",
      status: "approved",
      sourceType: "manual",
      createdAt: "2025-01-15T10:00:00.000Z",
      authorId: 1
    },
    // ... (coloque aqui as outras questões de exemplo do código original)
    {
      id: 3,
      title: "Hipertensão na Gravidez",
      statement: "Gestante de 28 semanas apresenta PA 160/110 mmHg, proteinúria +++. Qual o diagnóstico mais provável?",
      alternatives: {
        A: "Hipertensão gestacional",
        B: "Pré-eclâmpsia",
        C: "Eclâmpsia",
        D: "Hipertensão crônica",
        E: "Síndrome HELLP"
      },
      correctAnswer: "B",
      explanation: "Hipertensão após 20 semanas com proteinúria caracteriza pré-eclâmpsia.",
      difficultyLevel: "medium",
      subjectArea: "Obstetrícia",
      status: "pending",
      sourceType: "extracted",
      createdAt: "2025-01-13T09:15:00.000Z",
      authorId: 1
    }
  ];
}