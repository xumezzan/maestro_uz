import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, ServiceCategory } from "../types";
import api from "./api";
const BACKEND_URL = '/api';
// Fallback client-side key if backend is down (Optional, safe to remove if backend is reliable)
// Lazy init to prevent crash if key is missing
const getAIClient = () => {
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env.API_KEY) ? process.env.API_KEY : ((import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '');
  if (!apiKey) {
    console.warn("Gemini API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper for offline keyword matching to ensure Demo always works
const keywordMap: Record<string, ServiceCategory> = {
  'сантех': ServiceCategory.REPAIR,
  'труб': ServiceCategory.REPAIR,
  'кран': ServiceCategory.REPAIR,
  'ремонт': ServiceCategory.REPAIR,
  'электр': ServiceCategory.REPAIR,
  'сборка': ServiceCategory.REPAIR,
  'мебель': ServiceCategory.REPAIR,
  'плитк': ServiceCategory.REPAIR,
  'двер': ServiceCategory.REPAIR,

  'убор': ServiceCategory.CLEANING,
  'клининг': ServiceCategory.CLEANING,
  'мыть': ServiceCategory.CLEANING,
  'чист': ServiceCategory.CLEANING,
  'окна': ServiceCategory.CLEANING,

  'репетитор': ServiceCategory.TUTORS,
  'математ': ServiceCategory.TUTORS,
  'английс': ServiceCategory.TUTORS,
  'язык': ServiceCategory.TUTORS,
  'учит': ServiceCategory.TUTORS,
  'школ': ServiceCategory.TUTORS,

  'маникюр': ServiceCategory.BEAUTY,
  'визаж': ServiceCategory.BEAUTY,
  'волос': ServiceCategory.BEAUTY,
  'стриж': ServiceCategory.BEAUTY,
  'ресниц': ServiceCategory.BEAUTY,
  'бров': ServiceCategory.BEAUTY,

  'сайт': ServiceCategory.IT,
  'дизайн': ServiceCategory.IT,
  'лого': ServiceCategory.IT,
  'smm': ServiceCategory.IT,
  'програм': ServiceCategory.IT,

  'няня': ServiceCategory.DOMESTIC,
  'сидел': ServiceCategory.DOMESTIC,
  'повар': ServiceCategory.DOMESTIC,
  'водит': ServiceCategory.DOMESTIC,

  'перевоз': ServiceCategory.TRANSPORT,
  'достав': ServiceCategory.TRANSPORT,
  'груз': ServiceCategory.TRANSPORT,

  'юрист': ServiceCategory.FINANCE,
  'адвокат': ServiceCategory.FINANCE,
  'бухгалтер': ServiceCategory.FINANCE,

  'тренер': ServiceCategory.SPORT,
  'фитнес': ServiceCategory.SPORT,
  'йога': ServiceCategory.SPORT,

  'фото': ServiceCategory.EVENTS,
  'видео': ServiceCategory.EVENTS,
  'праздник': ServiceCategory.EVENTS,
  'dj': ServiceCategory.EVENTS,
  'аниматор': ServiceCategory.EVENTS
};

const determineCategoryByKeywords = (query: string): ServiceCategory => {
  const lowerQuery = query.toLowerCase();
  for (const [key, category] of Object.entries(keywordMap)) {
    if (lowerQuery.includes(key)) return category;
  }
  // Default to REPAIR if nothing found, as it's the most common/popular category in the demo
  return ServiceCategory.REPAIR;
};

export const analyzeServiceRequest = async (userQuery: string): Promise<AIAnalysisResult> => {
  // 1. Try Backend API first (Secure way)
  try {
    const response = await api.post('/ai/analyze/', { query: userQuery });
    if (response.data && response.data.category) {
      return response.data;
    }
  } catch (e) {
    // Backend down, ignore and proceed to client-side
  }

  // 2. Fallback to Client-side API call
  try {
    // Only attempt if we have a key, otherwise jump to keyword match
    // @ts-ignore
    const apiKey = (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';
    if (!apiKey) throw new Error("No API Key");

    const model = "gemini-3-flash-preview";
    const prompt = `
      You are an AI assistant for "Maestro", a service marketplace in Uzbekistan.
      Analyze the user's request and structure it into a JSON object.
      
      Context:
      - Currency: UZS.
      - Categories: ${Object.values(ServiceCategory).join(', ')}.
      
      Task:
      1. Identify the most relevant ServiceCategory.
      2. Create a short, professional title.
      3. Improve the description.
      4. Estimate a realistic price range in UZS.
      5. Extract tags.
      6. Extract location if mentioned.

      User Query: "${userQuery}"
    `;

    const response = await getAIClient().models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: Object.values(ServiceCategory) },
            suggestedTitle: { type: Type.STRING },
            suggestedDescription: { type: Type.STRING },
            estimatedPriceRange: { type: Type.STRING },
            relevantTags: { type: Type.ARRAY, items: { type: Type.STRING } },
            location: { type: Type.STRING, nullable: true },
          },
          required: ["category", "suggestedTitle", "suggestedDescription", "estimatedPriceRange", "relevantTags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    // 3. Ultimate Fallback (Keyword Matching)
    // This ensures the demo WORKS even without API keys or Backend
    console.warn("Using keyword fallback for analysis");

    const fallbackCategory = determineCategoryByKeywords(userQuery);

    return {
      category: fallbackCategory,
      suggestedTitle: userQuery.length > 50 ? "Новый заказ" : userQuery,
      suggestedDescription: userQuery,
      estimatedPriceRange: "По договоренности",
      relevantTags: [fallbackCategory, "Срочно"],
      location: "Ташкент"
    };
  }
};

export const generateImprovedDescription = async (title: string, userQuery: string): Promise<string> => {
  // Try Backend first
  try {
    const response = await api.post('/ai/generate-description/', { title, description: userQuery });
    if (response.data && response.data.description && response.data.description !== userQuery) {
      return response.data.description;
    }
  } catch (e) {
    // Ignore
  }

  // Fallback
  try {
    // @ts-ignore
    const apiKey = (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';
    if (!apiKey) throw new Error("No API Key");

    const model = "gemini-3-flash-preview";
    const prompt = `
      Rewrite this task description to be professional and clear (in Russian).
      Title: "${title}"
      Draft: "${userQuery}"
      Return ONLY the raw text.
    `;

    const response = await getAIClient().models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text?.trim() || userQuery;
  } catch (error) {
    return userQuery;
  }
};