import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import UserService, { User } from "./services/users.js";
import PlantService, { Plant } from "./services/plants.js";
import GeminiService from "./services/GeminiService.js";
import EmailService from "./services/EmailService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
}));

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Fern Helper Backend is running!" });
});

// ===== USER ENDPOINTS =====

// Get user by ID
app.get("/user", async (req: Request, res: Response) => {
  try {
    const uid = req.query.uid as string;

    if (!uid) {
      return res.status(400).json({ error: "Missing uid param" });
    }

    const userService = new UserService();
    const userData = await userService.getUser(uid);
    return res.json(userData);
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch user" });
  }
});

// Create user
app.post("/user", async (req: Request, res: Response) => {
  try {
    const userData: User = req.body;

    if (!userData.user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    // Set default notification preferences if not provided
    if (!userData.notification_preferences) {
      userData.notification_preferences = {
        watering: true,
        fertilizing: true,
        disease_alerts: true,
      };
    }

    const userService = new UserService();
    const newUser = await userService.createUser(userData);
    return res.status(201).json(newUser);
  } catch (error: any) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: error.message || "Failed to create user" });
  }
});

// ===== PLANT ENDPOINTS =====

// Get all plants for a user
app.get("/plants", async (req: Request, res: Response) => {
  try {
    const uid = req.query.uid as string;

    if (!uid) {
      return res.status(400).json({ error: "Missing uid param" });
    }

    const plantService = new PlantService();
    const plants = await plantService.getUserPlants(uid);
    return res.json(plants);
  } catch (error: any) {
    console.error("Error fetching plants:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch plants" });
  }
});

// Get plant by ID
app.get("/plants/:id", async (req: Request, res: Response) => {
  try {
    const plantId = req.params.id;

    if (!plantId) {
      return res.status(400).json({ error: "Missing plant ID" });
    }

    const plantService = new PlantService();
    const plant = await plantService.getPlantById(plantId);
    return res.json(plant);
  } catch (error: any) {
    console.error("Error fetching plant:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch plant" });
  }
});

// Create plant
app.post("/plants", async (req: Request, res: Response) => {
  try {
    const plantData: Plant = req.body;

    if (!plantData.user_id) {
      return res.status(400).json({ error: "Missing plant data" });
    }

    // Generate care recommendations
    const geminiService = new GeminiService();
    const careRecommendations = await geminiService.getCareRecommendations(
      plantData,
      undefined  // No file upload for now, images come as base64 in body
    );
    plantData.care_recommendations = careRecommendations;

    // Create plant
    const plantService = new PlantService();
    const newPlant = await plantService.createPlant(plantData, undefined);

    if (!newPlant) {
      return res.status(500).json({ error: "Failed to create plant" });
    }

    // Send email with recommendations
    try {
      const userService = new UserService();
      const user = await userService.getUser(plantData.user_id);
      
      if (user?.email) {
        const emailService = new EmailService();
        const emailContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <header style="background-color: #4CAF50; color: white; padding: 10px; text-align: center;">
              <h1>Fern Helper</h1>
            </header>
            <main style="padding: 20px;">
              <h2>Plant Care Recommendations</h2>
              <p><strong>Plant Name:</strong> ${plantData.plant_name}</p>
              <p><strong>Nickname:</strong> ${plantData.nickname || "N/A"}</p>
              <p><strong>Care Recommendations:</strong> ${careRecommendations.recommendation}</p>
              <p><strong>Fertilizers:</strong> ${careRecommendations.fertilizers.join(", ")}</p>
              <p><strong>Precautions:</strong> ${careRecommendations.precautions.join(", ")}</p>
              <p><strong>Water Frequency:</strong> Every ${careRecommendations.water_frequency} days</p>
            </main>
            <footer style="background-color: #f1f1f1; color: #555; text-align: center; padding: 10px; margin-top: 20px;">
              <p>Thank you for using Fern Helper!</p>
            </footer>
          </div>
        `;
        await emailService.sendEmail(user.email, "Your Plant Care Recommendations", emailContent);
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      message: "Plant created successfully",
      plant: newPlant,
    });
  } catch (error: any) {
    console.error("Error creating plant:", error);
    return res.status(500).json({ error: error.message || "Failed to process plant data" });
  }
});

// ===== CHAT ENDPOINT =====

app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message in request body" });
    }

    const geminiService = new GeminiService();
    const systemPrompt = `
      You are a smart plant care assistant developed by Fern Helper team.
      Your task is to answer questions strictly related to plants, their care, and related topics.
      If the question is unrelated to plants, politely redirect the user to ask plant-related questions.
    `;

    const response = await geminiService.getChatResponse(systemPrompt, message);
    console.log("Chat response:", response);

    return res.json({ response });
  } catch (error: any) {
    console.error("Error processing chat message:", error);
    return res.status(500).json({ error: error.message || "Failed to process chat message" });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});

export default app;
