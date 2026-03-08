import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid verification link. Missing token or email.");
        return;
      }

      try {
        const backendUrl = import.meta.env.VITE_APP_BACKEND_BASE_URL;
        
        const response = await axios.post(`${backendUrl}/verify-email`, {
          token,
          email,
        });

        setStatus("success");
        setMessage("Email verified successfully! 🎉");
        toast.success("Email verified! You can now continue using GreenGuardian.");
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } catch (error: any) {
        setStatus("error");
        const errorMessage = error.response?.data?.error || "Verification failed. Please try again.";
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center"
      >
        {status === "loading" && (
          <>
            <Loader className="w-16 h-16 mx-auto text-green-600 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to home page...</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Return to Home
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
