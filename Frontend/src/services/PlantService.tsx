import axios from "axios";
import { supabase } from "@/services/SupabaseService";

const BASE_URL = import.meta.env.VITE_APP_BACKEND_BASE_URL;

export const addPlant = async (plantData: any) => {
  try {
    let uploadedImageUrl = plantData.image_url;
    let imageUploaded = false;

    if (plantData.image instanceof File) {
      const file = plantData.image as File;
      const ext = file.name.split(".").pop() || "jpg";
      const userId = plantData.user_id || "anonymous";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const storagePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("plant-images")
        .upload(storagePath, file, {
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (!uploadError) {
        const { data } = supabase.storage.from("plant-images").getPublicUrl(storagePath);
        uploadedImageUrl = data.publicUrl;
        imageUploaded = true;
      }
    }

    const payload = {
      ...plantData,
      image: undefined,
      // Avoid sending long base64 strings to backend DB column with varchar limits.
      image_url: typeof uploadedImageUrl === "string" && uploadedImageUrl.startsWith("data:")
        ? ""
        : uploadedImageUrl,
    };

    const response = await axios.post(`${BASE_URL}/plants`, payload);
    return {
      ...response.data,
      imageUploaded,
    };
  } catch (error) {
    console.error("Error adding plant:", error);
    throw error;
  }
};

export const fetchUserPlants = async (userId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/plants`, {
      params: { uid: userId },
    });
    return (response.data || []).map((plant: any) => {
      if (plant?.care_recommendations && typeof plant.care_recommendations === "string") {
        try {
          plant.care_recommendations = JSON.parse(plant.care_recommendations);
        } catch {
          // Keep original string if not valid JSON.
        }
      }
      return plant;
    });
  } catch (error) {
    console.error("Error fetching user plants:", error);
    throw error;
  }
};

export const fetchPlantById = async (id: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/plants/${id}`);
    const plant = response.data;
    if (plant?.care_recommendations && typeof plant.care_recommendations === "string") {
      try {
        plant.care_recommendations = JSON.parse(plant.care_recommendations);
      } catch {
        // Keep original string if not valid JSON.
      }
    }
    return plant;
  } catch (error) {
    console.error(`Error fetching plant with ID ${id}:`, error);
    throw error;
  }
};
