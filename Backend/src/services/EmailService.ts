import { Resend } from "resend";
import dotenv from "dotenv";
import crypto from "crypto";

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
        from: "GreenGuardian<greengaurdian@vaishnavikadam.me>",
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

  async sendVerificationEmail(to: string, username: string, verificationLink: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2d5016; margin: 0;">Welcome to GreenGuardian🌿</h2>
        </div>
        
        <p>Hi <strong>${username}</strong>,</p>
        
        <p>Thank you for signing up! To complete your registration and start your plant care journey, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #2d5016; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
        <p style="background-color: #e8e8e8; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${verificationLink}</p>
        
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        
        <p style="color: #666; font-size: 12px;">
          If you didn't sign up for GreenGuardian, you can safely ignore this email.
        </p>
        
        <p style="color: #666; font-size: 12px;">
          Questions? Contact us at <strong>greengaurdian@vaishnavikadam.me</strong>
        </p>
        
        <p style="color: #2d5016; font-weight: bold;">The GreenGuardian Team🌿</p>
      </div>
    `;
    
    await this.sendEmail(to, "Verify Your Email - GreenGuardian🌿", htmlContent);
  }

  async sendSignupConfirmationEmail(to: string, username: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Welcome to GreenGuardian🌿</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>Thank you for signing up! We're excited to have you join our plant care community.</p>
        <p>Your account has been successfully created. You can now:</p>
        <ul>
          <li>Track your plants and their care schedules</li>
          <li>Get personalized watering and care reminders</li>
          <li>Chat with our AI plant expert</li>
          <li>Discover new plants and care tips</li>
        </ul>
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          If you have any questions, feel free to reach out to us at greengaurdian@vaishnavikadam.me
        </p>
        <p style="color: #2d5016;">Happy gardening!</p>
        <p><strong>The GreenGuardian Team🌿</strong></p>
      </div>
    `;
    
    await this.sendEmail(to, "Welcome to GreenGuardian🌿", htmlContent);
  }

  // Generate a verification token
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}
