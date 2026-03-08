import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export default class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is required");
    }
    this.ai = new GoogleGenAI({
      apiKey: apiKey
    });
  }

  async getCareRecommendations(plantData: any, imageFile?: File | Blob) {
    const systemPrompt = `
      You are a smart plant care assistant developed by Fern Helper team.
      Your task is to provide care recommendations for a plant based on its details and the image provided.
      Respond with a JSON object containing the following fields:
      - "recommendation": A paragraph with care instructions.
      - "fertilizers": An array of recommended fertilizers.
      - "precautions": An array of precautionary measures.
      - "water_frequency": An integer representing the number of days between watering.
    `;

    try {
      let uploadedFileUri = null;

      // Upload the image file if provided
      if (imageFile) {
        const uploadedFile = await this.ai.files.upload({
          file: imageFile,
          config: { mimeType: "image/jpeg" },
        });
        console.log("Uploaded file:", uploadedFile);
        uploadedFileUri = uploadedFile.uri;
      }

      // Generate content using the uploaded file's URI (or without if no image)
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: JSON.stringify({
          prompt: systemPrompt,
          plantDetails: plantData,
          ...(uploadedFileUri && { imageUri: uploadedFileUri }),
        }),
      });
      console.log("AI response:", response.text);
      
      if (!response.text) throw new Error("Empty response from GoogleGenAI");
      return JSON.parse(response.text.replace(/```/g, "").replace(/json/g, ""));
    } catch (error) {
      console.error("Error fetching care recommendations from GoogleGenAI:", error);
      throw new Error("Failed to fetch care recommendations from GoogleGenAI");
    }
  }

  async getChatResponse(systemPrompt: string, userMessage: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: JSON.stringify({
          prompt: systemPrompt,
          userMessage,
        }),
      });

      if (!response.text) {
        throw new Error("Empty response from Gemini model");
      }

      return response.text.trim();
    } catch (error) {
      console.error("Error fetching chat response from Gemini model:", error);
      throw new Error("Failed to fetch chat response from Gemini model");
    }
  }
}
