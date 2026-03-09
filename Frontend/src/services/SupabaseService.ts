import { createClient, Session } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_BACKEND_BASE_URL = import.meta.env.VITE_APP_BACKEND_BASE_URL;
const LOCAL_BACKEND_BASE_URL = import.meta.env.VITE_LOCAL_BACKEND_BASE_URL || "http://localhost:8787";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const buildFrontendRedirectUrl = (): string => {
  const runtimeOrigin = window.location.origin;
  const configured = (import.meta.env.VITE_FRONTEND_URL || "").trim();

  // Guard against accidentally shipping localhost as redirect URL to production.
  if (configured && !(configured.includes("localhost") && !runtimeOrigin.includes("localhost"))) {
    return `${configured.replace(/\/$/, "")}/verify-email`;
  }

  return `${runtimeOrigin}/verify-email`;
};

const isInvalidRefreshTokenError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("invalid refresh token") || message.includes("refresh token not found");
};

const resolveBackendBaseUrl = (): string => {
  const runtimeHost = window.location.hostname;
  const isLocalRuntime = runtimeHost === "localhost" || runtimeHost === "127.0.0.1";
  const configured = (APP_BACKEND_BASE_URL || "").trim();

  // Prefer local backend while developing locally unless explicitly overridden.
  if (isLocalRuntime) {
    const pointsToEc2 = configured.includes("3.110.33.69");
    if (!configured || pointsToEc2) {
      return LOCAL_BACKEND_BASE_URL;
    }
  }

  return configured || LOCAL_BACKEND_BASE_URL;
};

const BACKEND_BASE_URL = resolveBackendBaseUrl();

const api = axios.create({
  baseURL: BACKEND_BASE_URL,
  timeout: 10000,
});

const isBackendNetworkError = (error: unknown) => {
  return axios.isAxiosError(error) && !error.response;
};

class SupabaseService {
  static async checkBackendHealth(): Promise<boolean> {
    try {
      await api.get("/healthz");
      console.info(`Backend reachable: ${BACKEND_BASE_URL}`);
      return true;
    } catch (error) {
      // Backward compatibility for deployments that expose only `/`.
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        try {
          await api.get("/");
          console.info(`Backend reachable (legacy health route): ${BACKEND_BASE_URL}`);
          return true;
        } catch (fallbackError) {
          if (isBackendNetworkError(fallbackError)) {
            console.warn(`Backend unreachable: ${BACKEND_BASE_URL}. App will run in degraded mode until backend is reachable.`);
            return false;
          }

          console.warn("Backend fallback health check returned unexpected response.", fallbackError);
          return false;
        }
      }

      if (isBackendNetworkError(error)) {
        console.warn(`Backend unreachable: ${BACKEND_BASE_URL}. App will run in degraded mode until backend is reachable.`);
        return false;
      }

      console.warn("Backend health check returned unexpected response.", error);
      return false;
    }
  }

  private static async isRegisteredUser(uid: string): Promise<boolean> {
    const response = await api.get(`/user`, {
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

    try {
      const isRegistered = await this.isRegisteredUser(data.user.id);
      if (!isRegistered) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("User not registered. Please register first.");
      }
    } catch (error) {
      if (isBackendNetworkError(error)) {
        console.warn(`Backend ${BACKEND_BASE_URL} is unreachable during login validation. Allowing login.`);
      } else {
        throw error;
      }
    }

    return data;
  }

  static async signup(email: string, password: string, metadata: { [key: string]: any }) {
    const redirectUrl = buildFrontendRedirectUrl();

    let signupResult = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: redirectUrl,
        }
      }
    );

    // If redirect URL isn't whitelisted in Supabase, retry without redirect_to.
    if (signupResult.error && signupResult.error.status === 422) {
      signupResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
    }

    if (signupResult.error) throw signupResult.error;

    const { data } = signupResult;

    // Send user data to the "/user" endpoint (this will trigger our custom verification email)
    try {
      await api.post(`/user`, {
        user_id: data.user?.id,
        email: email,
        username: metadata.username || metadata.name,
        profile_pic_url: null,
        notification_preferences: null,
        ...metadata,
      });
    } catch (postError) {
      if (!isBackendNetworkError(postError)) {
        console.error("Error creating user in database:", postError);
        throw postError;
      }

      // Backend sync is best-effort during unstable connectivity.
      console.warn("Backend user sync timed out/unreachable during signup. Continuing.", postError);
    }

    // Sign out immediately - user must verify email first
    await supabase.auth.signOut({ scope: "local" });

    return data;
  }

  static async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        // Local sign-out clears stale tokens without requiring server connectivity.
        await supabase.auth.signOut({ scope: "local" });
      }
      console.error("Error fetching session:", error);
      return null;
    }

    if (!data.session) {
      return null;
    }

    const uid = data.session.user?.id;
    if (!uid) {
      await supabase.auth.signOut({ scope: "local" });
      return null;
    }

    try {
      const isRegistered = await this.isRegisteredUser(uid);
      if (!isRegistered) {
        await supabase.auth.signOut({ scope: "local" });
        return null;
      }
    } catch (sessionValidationError) {
      if (!isBackendNetworkError(sessionValidationError)) {
        console.error("Session validation error:", sessionValidationError);
        await supabase.auth.signOut({ scope: "local" });
        return null;
      }

      console.warn(`Backend ${BACKEND_BASE_URL} is unreachable during session validation. Continuing with local session.`);
      return data.session;
    }

    return data.session;
  }

  static async logout() {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }
}

export default SupabaseService;
