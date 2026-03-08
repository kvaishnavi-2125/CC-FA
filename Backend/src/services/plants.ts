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
      .single();

    if (error) {
      throw error;
    }

    return data;
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

    const { error } = await this.client
      .from("plants")
      .insert([{ ...plantData, image_url: imageUrl }]);

    if (error) {
      throw error;
    }

    return true;
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