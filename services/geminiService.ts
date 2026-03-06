import { GoogleGenAI } from "@google/genai";
import { TimeSlot } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

export async function getScheduleSummary(
  slots: TimeSlot[], 
  professionalName: string, 
  date: string
): Promise<string> {

  const bookedSlots = slots.filter(s => s.type === 'booked');
  const availableCount = slots.filter(s => s.type === 'available').length;

  const prompt = `
    Analise a agenda de massoterapia do profissional ${professionalName} para o dia ${date}.
    - Total de agendamentos: ${bookedSlots.length}
    - Horários disponíveis: ${availableCount}
    - Clientes: ${bookedSlots.map(s => `${s.time}: ${s.attendeeName}`).join(', ')}
    Forneça um resumo executivo curto (máximo 2 frases). Tom corporativo e motivador.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    return response.text || "Resumo indisponível.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
