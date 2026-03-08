import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

class Supabase {
  client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const anonKey = process.env.SUPABASE_ANON_KEY || "";
    const supabaseKey = serviceRoleKey || anonKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL and/or Supabase key environment variables");
    }

    if (!serviceRoleKey) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not set. Backend is using anon key and may hit RLS policies.");
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(bucket: string, path: string, file: File | Blob) {
    try {
      const { data, error } = await this.client.storage.from(bucket).upload(path, file);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }
}

export default Supabase;