
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CLARA_SYSTEM_PROMPT } from "../constants";
import { SalonState } from "../types";

// Fix: Initialize GoogleGenAI using the named parameter 'apiKey' and use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getClaraResponse = async (
  userMessage: string, 
  history: {role: 'user' | 'assistant', content: string}[],
  salonData: SalonState
) => {
  // Lógica de Lembretes do Dia para a Clara saber quem cobrar
  const now = new Date();
  const dailyReminders = salonData.clients.filter(c => {
    const lastVisit = new Date(c.lastVisit + "T00:00:00");
    const diffDays = Math.ceil(Math.abs(now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays === 30 || diffDays === 45 || diffDays === 60;
  }).map(c => c.name);

  // Fix: Call generateContent directly and await its result, using GenerateContentResponse type
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: userMessage }] }
    ],
    config: {
      systemInstruction: `
        ${CLARA_SYSTEM_PROMPT}
        
        SISTEMA DE LEMBRETES:
        Você tem ${dailyReminders.length} lembretes críticos para hoje.
        Clientes que atingiram a marca de 30, 45 ou 60 dias sem voltar: ${dailyReminders.join(', ') || 'Nenhum por enquanto'}.
        Priorize sugerir o resgate dessas clientes.

        CONTEXTO ATUAL DO SALÃO:
        Clientes: ${JSON.stringify(salonData.clients)}
        Atendimentos: ${JSON.stringify(salonData.appointments)}
        Mês Atual: ${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())}
      `,
      temperature: 0.7,
    }
  });

  // Fix: Access the text content via the .text property as per latest SDK guidelines
  return response.text || "Desculpe, tive um erro ao processar sua mensagem.";
};

// Specialized parser for extracting data if Clara suggests a confirmation
export const parseAppointmentFromText = (text: string): any => {
  // Simple extraction regex for common patterns in Clara's confirmation messages
  const clienteMatch = text.match(/Cliente:\s*(.*)/i);
  const telefoneMatch = text.match(/Telefone:\s*(.*)/i);
  const dataMatch = text.match(/Data:\s*(.*)/i);
  const servicoMatch = text.match(/Serviço:\s*(.*)/i);
  const valorMatch = text.match(/Valor:\s*R\$\s*([\d,.]+)/i);

  if (clienteMatch && servicoMatch) {
    return {
      clientName: clienteMatch[1].trim(),
      phone: telefoneMatch ? telefoneMatch[1].trim() : '',
      date: dataMatch ? dataMatch[1].trim() : new Date().toLocaleDateString('pt-BR'),
      service: servicoMatch[1].trim(),
      value: valorMatch ? parseFloat(valorMatch[1].replace(',', '.')) : 0,
    };
  }
  return null;
};
