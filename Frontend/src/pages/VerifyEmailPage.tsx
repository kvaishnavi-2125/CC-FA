import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading");
  const [message, setMessage] = useState("");

  const resolveBackendBaseUrl = () => {
    const configured = (import.meta.env.VITE_APP_BACKEND_BASE_URL || "").trim();
    const local = (import.meta.env.VITE_LOCAL_BACKEND_BASE_URL || "http://localhost:8787").trim();
    const runtimeHost = window.location.hostname;
    const isLocalRuntime = runtimeHost === "localhost" || runtimeHost === "127.0.0.1";

    if (isLocalRuntime && (!configured || configured.includes("3.110.33.69"))) {
      return local;
    }

    return configured || local;
  };

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const emailParam = searchParams.get("email");

      if (!token || !emailParam) {
        setStatus("error");
        setMessage("Invalid verification link. Missing token or email.");
        return;
      }

      try {
        const backendUrl = resolveBackendBaseUrl();
        
        await axios.post(`${backendUrl}/verify-email`, {
          token,
          email: emailParam,
        });

        setStatus("verified");
        setMessage("Email verified successfully.");
        toast.success("Email verified successfully.");

        // Standard flow: user must verify first. After verify, auto-login if pending credentials exist.
        const pending = localStorage.getItem("pendingSignupCredentials");
        if (pending) {
          const { email, password } = JSON.parse(pending) as { email: string; password: string };
          if (email === emailParam) {
            const success = await login(email, password);
            localStorage.removeItem("pendingSignupCredentials");
            if (success) {
              toast.success("Verification completed. Redirecting to home.");
              setTimeout(() => navigate("/home"), 900);
              return;
            }
          }
        }

        // Do not auto-send user to login. Keep this page with clear state.
        setMessage("Email verified. Please continue from this browser session.");
      } catch (error: any) {
        setStatus("error");
        const errorMessage = error.response?.data?.error || "Verification failed. Please try again.";
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, login]);

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-plantcare-beige p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {status === "loading" && (
              <div className="text-center">
                <Loader className="w-12 h-12 mx-auto text-plantcare-green animate-spin mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
                <p className="text-gray-500">Please wait while we verify your email address.</p>
              </div>
            )}

            {status === "verified" && (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-plantcare-green mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified</h1>
                <p className="text-gray-500">{message}</p>
              </div>
            )}

            {status === "error" && (
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                <p className="text-gray-500 mb-6">{message}</p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-plantcare-green text-white py-3 rounded-lg font-medium transition-all duration-200 hover:bg-plantcare-green-dark"
                >
                  Go to Login
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerifyEmailPage;
