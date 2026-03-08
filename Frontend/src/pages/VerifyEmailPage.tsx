import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Loader, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "verified" | "login" | "error">("loading");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const email = searchParams.get("email");

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
        const backendUrl = import.meta.env.VITE_APP_BACKEND_BASE_URL;
        
        await axios.post(`${backendUrl}/verify-email`, {
          token,
          email: emailParam,
        });

        setStatus("verified");
        setMessage("Email verified successfully! 🎉");
        toast.success("✅ Email verified! Please enter your password to login.");
      } catch (error: any) {
        setStatus("error");
        const errorMessage = error.response?.data?.error || "Verification failed. Please try again.";
        setMessage(errorMessage);
        toast.error("❌ " + errorMessage);
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoggingIn(true);
    try {
      const success = await login(email || "", password);
      if (success) {
        toast.success("✅ Logged in successfully!");
        navigate("/home");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    } catch (error) {
      toast.error("An error occurred during login.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
      >
        {status === "loading" && (
          <div className="text-center">
            <Loader className="w-16 h-16 mx-auto text-green-600 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        )}

        {status === "verified" && (
          <div>
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600">{message}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                {isLoggingIn ? "Logging in..." : "Continue to Home"}
              </button>
            </form>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Return to Home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
