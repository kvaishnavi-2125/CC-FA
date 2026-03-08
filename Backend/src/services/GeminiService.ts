import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

export default class GeminiService {
  private groq: Groq;
  private chatModel: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required");
    }
    this.groq = new Groq({ apiKey });
    this.chatModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  }

  private async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    const completion = await this.groq.chat.completions.create({
      model: this.chatModel,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const text = completion.choices?.[0]?.message?.content;

    if (!text || typeof text !== "string") {
      throw new Error("Empty response from Groq model");
    }

    return text.trim();
  }

  private extractFirstJsonObject(text: string): string {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    if (start === -1) {
      throw new Error("No JSON object found in model response");
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === "\\") {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === "{") depth++;
      if (ch === "}") depth--;

      if (depth === 0) {
        return cleaned.slice(start, i + 1);
      }
    }

    throw new Error("Incomplete JSON object in model response");
  }

  async getCareRecommendations(plantData: any, imageFile?: File | Blob) {
    const systemPrompt = `
      You are a smart plant care assistant developed by GreenGuardian team.
      Your task is to provide care recommendations for a plant based on its details and the image provided.
      Output only valid JSON and nothing else.
      Respond with a JSON object containing the following fields:
      - "recommendation": A paragraph with care instructions.
      - "fertilizers": An array of recommended fertilizers.
      - "precautions": An array of precautionary measures.
      - "water_frequency": An integer representing the number of days between watering.
    `;

    try {
      const compactPlantDetails = {
        plant_name: String(plantData?.plant_name || "").slice(0, 80),
        nickname: String(plantData?.nickname || "").slice(0, 80),
        plant_type: String(plantData?.plant_type || "").slice(0, 50),
        species: String(plantData?.species || "").slice(0, 80),
        location_in_home: String(plantData?.location_in_home || "").slice(0, 80),
        sunlight_exposure: String(plantData?.sunlight_exposure || "").slice(0, 50),
        soil_type: String(plantData?.soil_type || "").slice(0, 50),
        health_status: String(plantData?.health_status || "").slice(0, 50),
        last_watered: String(plantData?.last_watered || "").slice(0, 30),
      };

      const userPrompt = JSON.stringify({
        plantDetails: compactPlantDetails,
        imageProvided: Boolean(imageFile),
      });

      const text = await this.generateText(systemPrompt, userPrompt);
      const jsonText = this.extractFirstJsonObject(text);
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Error fetching care recommendations from Groq:", error);
      throw new Error("Failed to fetch care recommendations from Groq");
    }
  }

  async getChatResponse(systemPrompt: string, userMessage: string) {
    try {
      return await this.generateText(systemPrompt, userMessage);
    } catch (error: any) {
      console.error("Error fetching chat response from Groq model:", error);

      // Graceful fallback for quota / rate limit issues so chat remains functional.
      const rawError = String(error?.message || "").toLowerCase();
      const isQuotaOrRateLimit =
        rawError.includes("429") ||
        rawError.includes("resource_exhausted") ||
        rawError.includes("quota") ||
        rawError.includes("rate limit");

      if (isQuotaOrRateLimit) {
        return "I am currently experiencing high traffic. I can still help with plant care basics. Share your plant name, sunlight, watering routine, and any symptoms (yellow leaves, spots, drooping), and I will suggest next steps.";
      }

      throw new Error("Failed to fetch chat response from Groq model");
    }
  }
}
