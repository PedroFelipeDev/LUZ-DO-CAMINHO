import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../types";

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

// Ensure we only create the client once if possible, or recreate if key changes (though here key is static env)
const getAIClient = (): GoogleGenAI => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
  }
  return ai;
};

export const initChatSession = (): Chat => {
  const client = getAIClient();
  chatSession = client.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7, // Slightly warmer for empathetic responses
      candidateCount: 1,
    },
  });
  return chatSession;
};

export const getChatSession = (): Chat => {
  if (!chatSession) {
    return initChatSession();
  }
  return chatSession;
};

export const sendMessageStream = async (message: string) => {
  const chat = getChatSession();

  try {
    const result = await chat.sendMessageStream({ message });
    return result;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};
