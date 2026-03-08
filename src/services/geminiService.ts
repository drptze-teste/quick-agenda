import { GoogleGenerativeAI } from "@google/generative-ai";

// Lê a chave que configurou no painel do Google Cloud
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const getScheduleSummary = async (schedules: any, date: string, professionals: any[]) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepara os dados para a IA ler
    const prompt = `
      Atue como coordenador da Benesse Gestão Esportiva. 
      Analise os agendamentos para o dia ${date}:
      Dados brutos: ${JSON.stringify(schedules)}
      Profissionais escalados: ${professionals.map(p => p.name).join(", ")}

      Gere um resumo executivo curto (máximo 5 linhas) informando:
      1. Total de atendimentos confirmados.
      2. Qual profissional está mais ocupado.
      3. Se há muitos horários vago.
      Use um tom profissional e motivador.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Não foi possível gerar o resumo agora. Verifique a chave da API.";
  }
};