import { createClient, Session } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_BACKEND_BASE_URL = import.meta.env.VITE_APP_BACKEND_BASE_URL;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

class SupabaseService {
  private static async isRegisteredUser(uid: string): Promise<boolean> {
    const response = await axios.get(`${APP_BACKEND_BASE_URL}/user`, {
      params: { uid },
    });

    return Boolean(response.data);
  }

  static async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (!data.user?.id) {
      throw new Error("Login failed. Please try again.");
    }

    const isRegistered = await this.isRegisteredUser(data.user.id);
    if (!isRegistered) {
      await supabase.auth.signOut();
      throw new Error("User not registered. Please register first.");
    }

    return data;
  }

  static async signup(email: string, password: string, metadata: { [key: string]: any }) {
    // Get frontend URL for redirect
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    
    const { data, error } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${frontendUrl}/verify-email`,
        }
      }
    );
    if (error) throw error;

    // Send user data to the "/user" endpoint (this will trigger our custom verification email)
    try {
      await axios.post(`${APP_BACKEND_BASE_URL}/user`, {
        user_id: data.user?.id,
        email: email,
        username: metadata.username || metadata.name,
        profile_pic_url: null,
        notification_preferences: null,
        ...metadata,
      });
    } catch (postError) {
      console.error("Error creating user in database:", postError);
      throw postError;
    }

    // Sign out immediately - user must verify email first
    await supabase.auth.signOut();

    return data;
  }

  static async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error fetching session:", error);
      return null;
    }

    if (!data.session) {
      return null;
    }

    const uid = data.session.user?.id;
    if (!uid) {
      await supabase.auth.signOut();
      return null;
    }

    try {
      const isRegistered = await this.isRegisteredUser(uid);
      if (!isRegistered) {
        await supabase.auth.signOut();
        return null;
      }
    } catch (sessionValidationError) {
      console.error("Session validation error:", sessionValidationError);
      await supabase.auth.signOut();
      return null;
    }

    return data.session;
  }

  static async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }
}

export default SupabaseService;
