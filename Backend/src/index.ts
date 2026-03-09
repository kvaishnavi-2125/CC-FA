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
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_BACKEND_URL = process.env.PUBLIC_BACKEND_URL || "";

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://plant-care-app.s3-website.ap-south-1.amazonaws.com",
  "https://plant-care-app.s3.ap-south-1.amazonaws.com",
];

const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

// In-memory token storage (token -> {email, timestamp})
// In production, use a database table for persistence
const verificationTokens: Map<string, { email: string; timestamp: number }> = new Map();
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser calls (curl, health checks) and configured browser origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "GreenGuardian Backend is running!" });
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

    if (!userData.email) {
      return res.status(400).json({ error: "Missing email" });
    }

    if (!userData.username) {
      return res.status(400).json({ error: "Missing username" });
    }

    const userService = new UserService();

    // Check if user already exists
    const existingUser = await userService.getUser(userData.user_id).catch(() => null);
    const isNewUser = !existingUser;

    if (isNewUser) {
      // Set default notification preferences if not provided
      if (!userData.notification_preferences) {
        userData.notification_preferences = {
          watering: true,
          fertilizing: true,
          disease_alerts: true,
        };
      }

      // Clean up userData - only keep required fields for database
      const cleanUserData: User = {
        user_id: userData.user_id,
        email: userData.email,
        username: userData.username,
        first_name: userData.first_name || userData.username?.split(' ')[0] || '',
        last_name: userData.last_name || userData.username?.split(' ')[1] || '',
        profile_pic_url: userData.profile_pic_url || null,
        location: userData.location || undefined,
        climate_zone: userData.climate_zone || undefined,
        notification_preferences: userData.notification_preferences,
      };

      const newUser = await userService.createUser(cleanUserData);

      // Send verification email ONLY for new users
      try {
        const emailService = new EmailService();
        const verificationToken = emailService.generateVerificationToken();
        
        // Store token for verification (24 hour expiry)
        verificationTokens.set(verificationToken, {
          email: userData.email,
          timestamp: Date.now(),
        });
        
        // Build verification link
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(userData.email)}`;
        
        await emailService.sendVerificationEmail(userData.email, userData.username, verificationLink);
        
        console.log("Verification email sent to new user");
      } catch (emailError: any) {
        console.error("Warning: Failed to send verification email:", emailError.message);
        // Don't fail user creation if email fails
      }

      return res.status(201).json(newUser);
    } else {
      // Existing user - just return their data
      return res.status(200).json(existingUser);
    }
  } catch (error: any) {
    console.error("Error creating/retrieving user:", error);
    return res.status(500).json({ error: error.message || "Failed to create user" });
  }
});

// Verify email endpoint
app.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ error: "Missing token or email" });
    }

    // Check if token exists and is valid
    const tokenData = verificationTokens.get(token);
    
    if (!tokenData) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    // Check if token has expired
    if (Date.now() - tokenData.timestamp > TOKEN_EXPIRY_MS) {
      verificationTokens.delete(token);
      return res.status(400).json({ error: "Verification token has expired" });
    }

    // Check if email matches
    if (tokenData.email !== email) {
      return res.status(400).json({ error: "Email does not match token" });
    }

    // Token is valid - mark user as verified
    // You can update a verified_at field in your users table
    const userService = new UserService();
    
    // Update user verification status (add this method to UserService)
    await userService.verifyUserEmail(email);

    // Delete token after use
    verificationTokens.delete(token);

    return res.json({ message: "Email verified successfully" });
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return res.status(500).json({ error: error.message || "Failed to verify email" });
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

    if (!plantData.image_url) {
      plantData.image_url = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop";
    }

    let careRecommendations: any = {
      recommendation: "Keep the soil lightly moist, provide indirect light, and monitor leaf health weekly.",
      fertilizers: ["Balanced NPK fertilizer"],
      precautions: ["Avoid overwatering", "Ensure proper drainage"],
      water_frequency: 7,
    };

    // Try to generate AI recommendations, but don't block plant creation if it fails.
    try {
      const geminiService = new GeminiService();
      careRecommendations = await geminiService.getCareRecommendations(
        plantData,
        undefined
      );
    } catch (aiError) {
      console.error("AI recommendation generation failed, using defaults:", aiError);
    }

    plantData.care_recommendations = JSON.stringify(careRecommendations);

    // Create plant
    const plantService = new PlantService();
    const newPlant = await plantService.createPlant(plantData, undefined);

    if (!newPlant) {
      return res.status(500).json({ error: "Failed to create plant" });
    }

    let emailSent = false;

    // Send email with recommendations
    try {
      const userService = new UserService();
      const user = await userService.getUser(plantData.user_id);
      
      if (user?.email) {
        const emailService = new EmailService();
        const emailContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <header style="background-color: #4CAF50; color: white; padding: 10px; text-align: center;">
              <h1>GreenGuardian </h1>
            </header>
            <main style="padding: 20px;">
              <h2>Plant Care Recommendations</h2>
              <p><strong>Plant Name:</strong> ${plantData.plant_name}</p>
              <p><strong>Nickname:</strong> ${plantData.nickname || "N/A"}</p>
              <p><strong>Care Recommendations:</strong> ${careRecommendations?.recommendation || "N/A"}</p>
              <p><strong>Fertilizers:</strong> ${(careRecommendations?.fertilizers || []).join(", ")}</p>
              <p><strong>Precautions:</strong> ${(careRecommendations?.precautions || []).join(", ")}</p>
              <p><strong>Water Frequency:</strong> Every ${careRecommendations?.water_frequency || "N/A"} days</p>
            </main>
            <footer style="background-color: #f1f1f1; color: #555; text-align: center; padding: 10px; margin-top: 20px;">
              <p>Thank you for using GreenGuardian!</p>
            </footer>
          </div>
        `;
        await emailService.sendEmail(user.email, "Your Plant Care Recommendations", emailContent);
        emailSent = true;
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      message: "Plant created successfully",
      plant: newPlant,
      emailSent,
    });
  } catch (error: any) {
    console.error("Error creating plant:", error);
    return res.status(500).json({ error: error.message || "Failed to process plant data" });
  }
});

// ===== CHAT ENDPOINT =====

app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message in request body" });
    }

    const sanitizedHistory = Array.isArray(history)
      ? history
          .filter((item) => item && typeof item.text === "string" && typeof item.isUser === "boolean")
          .slice(-10)
          .map((item) => `${item.isUser ? "User" : "Assistant"}: ${item.text}`)
          .join("\n")
      : "";

    const geminiService = new GeminiService();
    const systemPrompt = `
      You are a smart plant care assistant developed by GreenGuardian team.
      Your task is to answer questions strictly related to plants, their care, and related topics.
      If the question is unrelated to plants, politely redirect the user to ask plant-related questions.
      Keep responses concise and practical.
      Ask at most one follow-up question in each reply.
      Never ask multiple questions in the same response.
      Prefer giving one clear next step first, then one optional question.
      Keep reply length under 90 words unless the user asks for detailed explanation.
    `;

    const messageWithContext = sanitizedHistory
      ? `Conversation history:\n${sanitizedHistory}\n\nLatest user question: ${message}`
      : message;

    const response = await geminiService.getChatResponse(systemPrompt, messageWithContext);
    console.log("Chat response:", response);

    return res.json({ response });
  } catch (error: any) {
    console.error("Error processing chat message:", error);
    const errorText = String(error?.message || "").toLowerCase();
    if (
      errorText.includes("quota") ||
      errorText.includes("resource_exhausted") ||
      errorText.includes("rate limit")
    ) {
      return res.status(429).json({ error: "Chat service is temporarily busy. Please try again in a few moments." });
    }

    return res.status(500).json({ error: error.message || "Failed to process chat message" });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(Number(PORT), HOST, () => {
  const displayUrl = PUBLIC_BACKEND_URL || `http://${HOST}:${PORT}`;
  console.log(`✅ Backend server running on ${displayUrl}`);
});

export default app;
