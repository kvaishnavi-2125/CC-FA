import axios from "axios";

const BASE_URL = import.meta.env.VITE_APP_BACKEND_BASE_URL;

interface ChatMessage {
  text: string;
  isUser: boolean;
}

export const sendMessageToChatBot = async (message: string, history: ChatMessage[] = []) => {
  try {
    const response = await axios.post(`${BASE_URL}/chat`, { message, history });
    return response.data.response;
  } catch (error) {
    console.error("Error sending message to chatbot:", error);
    throw error;
  }
};
