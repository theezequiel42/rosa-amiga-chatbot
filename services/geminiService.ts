import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { retrieveContext } from './ragService';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createChatSession = (): Chat => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
  return chat;
};

export const streamMessageToBot = async (chat: Chat, message: string) => {
  // 1. Retrieve context using the new semantic-based RAG service
  const context = await retrieveContext(message);

  // 2. Construct the augmented message for the model
  const augmentedMessage = `
Com base nos trechos da base de conhecimento fornecidos abaixo, responda à pergunta do usuário.
Os trechos estão no formato "TÍTULO: ... CONTEÚDO: ...".
Se o contexto não for relevante para a pergunta, responda com base no seu conhecimento geral, sempre seguindo suas diretrizes de persona.

--- CONTEXTO ---
${context}
--- FIM DO CONTEXTO ---

Pergunta do Usuário: "${message}"
`;
  // 3. Return the stream from the chat session
  return chat.sendMessageStream({ message: augmentedMessage });
};
