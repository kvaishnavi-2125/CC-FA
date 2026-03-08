import Supabase from "./supabase.js";
import { Data } from "./users.js";

export interface Plant extends Data {
  plant_name: string;
  nickname?: string;
  plant_type: string;
  species: string;
  image_url: string;
  location_in_home: string;
  pot_size: string;
  acquisition_date?: string;
  last_watered: string;
  sunlight_exposure: string;
  soil_type?: string;
  health_status: string;
  care_recommendations?: string;
}

class PlantService {
  private supabase: Supabase;

  constructor() {
    this.supabase = new Supabase();
  }

  get client() {
    return this.supabase.client;
  }

  async uploadFile(bucket: string, path: string, file: File | Blob) {
    return this.supabase.uploadFile(bucket, path, file);
  }
  async getUserPlants(user_id: string) {
    const { data, error } = await this.client
      .from("plants")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async getPlantById(plant_id: string) {
    const { data, error } = await this.client
      .from("plants")
      .select("*")
      .eq("plant_id", plant_id)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    const { data: fallbackData, error: fallbackError } = await this.client
      .from("plants")
      .select("*")
      .eq("id", plant_id)
      .limit(1)
      .maybeSingle();

    if (fallbackError) {
      throw fallbackError;
    }

    return fallbackData;
  }

  async createPlant(plantData: Plant, imageFile?: File | Blob) {
    let imageUrl = plantData.image_url;

    if (imageFile) {
      const timestamp = Date.now();
      const filePath = `plants/${plantData.user_id}/${timestamp}-${plantData.plant_name}`;
      const uploadResult = await this.uploadFile("plant-images", filePath, imageFile);
      const { data } = await this.client.storage.from('plant-images').getPublicUrl(uploadResult.path);
      imageUrl = data.publicUrl;
    }

    const insertPayload: Record<string, any> = {
      ...plantData,
      image_url: imageUrl,
      // Compatibility if DB uses `name` instead of `plant_name`.
      name: plantData.plant_name,
    };

    let attempts = 0;
    while (attempts < 8) {
      const { data, error } = await this.client
        .from("plants")
        .insert([insertPayload])
        .select()
        .single();

      if (!error) {
        return data;
      }

      const message = String(error?.message || "");
      const missingColumnMatch = message.match(/Could not find the '([^']+)' column/);

      if (missingColumnMatch?.[1]) {
        delete insertPayload[missingColumnMatch[1]];
        attempts += 1;
        continue;
      }

      throw error;
    }

    throw new Error("Failed to insert plant due to schema mismatch");
  }

  async updateCareRecommendations(plantId: string, careRecommendations: string) {
    const { error } = await this.client
      .from("plants")
      .update({ care_recommendations: careRecommendations })
      .eq("id", plantId);

    if (error) {
      console.error("Error updating care recommendations:", error);
      throw new Error("Failed to update care recommendations");
    }

    console.log(`Updated care recommendations for plant ID: ${plantId}`);
  }
}

export default PlantService;