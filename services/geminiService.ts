import { GoogleGenAI } from "@google/genai";
import { TimeSlot } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    try {
      // Safe access to environment variables in Vite
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        return null;
      }
      
      aiInstance = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.error("Failed to initialize Gemini AI:", e);
      return null;
    }
  }
  return aiInstance;
}

export async function getScheduleSummary(slots: TimeSlot[], professionalName: string, date: string): Promise<string> {
  const bookedSlots = slots.filter(s => s.type === 'booked');
  const availableCount = slots.filter(s => s.type === 'available').length;
  
  const prompt = `
    Analise a agenda de massoterapia do profissional ${professionalName} para o dia ${date}.
    
    Dados da Agenda:
    - Total de agendamentos realizados: ${bookedSlots.length}
    - Horários ainda disponíveis: ${availableCount}
    - Lista de clientes agendados: ${bookedSlots.map(s => `${s.time}: ${s.attendeeName}`).join(', ')}
    
    Por favor, forneça um resumo executivo muito curto (máximo 2 frases) sobre o status desta agenda. 
    Seja profissional e motivador. Use um tom corporativo.
  `;

  try {
    const ai = getAI();
    if (!ai) {
      return "Resumo indisponível (Chave API não configurada).";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Resumo indisponível.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível gerar o resumo no momento.";
  }
}
