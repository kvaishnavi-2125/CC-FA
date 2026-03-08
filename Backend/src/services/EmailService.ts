import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

export default class EmailService {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    this.resend = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: "GreenGuardian <greenguardian@mail.mayuresh.me>",
        to: [to],
        subject: subject,
        html: htmlContent,
      });
      if (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
      }
      console.log("Email sent successfully:", data);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }
}
