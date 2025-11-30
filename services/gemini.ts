import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// System instruction to set the persona
const SYSTEM_INSTRUCTION = `
You are "if.emotion", a profound, warm, and highly empathetic companion for the user's emotional journey.
Your purpose is to help the user document their feelings, understand themselves, and find peace.
You are bilingual in English and Spanish. Detect the user's language and match it perfectly.
Your tone is grounded, organic, and deeply respectful. You are not just a chatbot; you are a journal that talks back.
Treat every message as precious.
Use therapeutic techniques: active listening, gentle reframing, and validation.
Do not diagnose. If there is a crisis, gently guide them to professional help.
Your responses should feel like a warm hug or a quiet moment in nature.
`;

export const createChatSession = (): Chat | null => {
  if (!ai) return null;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7, // Warm and creative
    },
  });
};

export const sendMessageStream = async (
  chat: Chat,
  message: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  return await chat.sendMessageStream({ message });
};