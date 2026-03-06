import { GoogleGenAI } from "@google/genai";
import { TimeSlot } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // In Vite/Vercel, we might need VITE_ prefix, but we'll try both for compatibility
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Resumo indisponível.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível gerar o resumo (verifique a chave API).";
  }
}
