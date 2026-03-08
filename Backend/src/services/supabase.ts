import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

class Supabase {
  client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
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