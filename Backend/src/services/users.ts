import Supabase from "./supabase.js";

export interface Data {
  user_id: string;
}

export interface User {
  user_id?: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_pic_url?: string | null;
  location?: string;
  climate_zone?: string;
  notification_preferences?: {
    watering: boolean;
    fertilizing: boolean;
    disease_alerts: boolean;
  } | null;
}

class UserService {
  private supabase: Supabase;

  constructor() {
    this.supabase = new Supabase();
  }

  async getUser(uid: string) {
    try {
      const { data, error } = await this.supabase.client
        .from("users")
        .select("*")
        .eq("user_id", uid)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  async createUser(userData: User) {
    try {
      const { data, error } = await this.supabase.client
        .from("users")
        .insert([userData])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return data && data.length > 0 ? data[0] : userData;
    } catch (error: any) {
      console.error("Supabase insert error:", error);
      throw error;
    }
  }

  async verifyUserEmail(email: string) {
    try {
      const candidateUpdates: Array<Record<string, any>> = [
        { email_verified: true, updated_at: new Date().toISOString() },
        { email_verified: true },
        { verified: true, updated_at: new Date().toISOString() },
        { verified: true },
        { verified_at: new Date().toISOString() },
      ];

      for (const updatePayload of candidateUpdates) {
        const { data, error } = await this.supabase.client
          .from("users")
          .update(updatePayload)
          .eq("email", email)
          .select();

        if (!error) {
          return data;
        }

        const message = String(error.message || "");
        const isMissingColumn = message.includes("Could not find the") || message.includes("column");
        if (!isMissingColumn) {
          throw new Error(error.message);
        }
      }

      throw new Error("Unable to update verification status: no supported verification column found");
    } catch (error: any) {
      console.error("Error verifying user email:", error);
      throw error;
    }
  }
}

export default UserService;