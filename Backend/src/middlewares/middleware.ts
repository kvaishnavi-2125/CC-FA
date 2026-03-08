import { Request, Response, NextFunction } from "express";
import UserService, { Data } from "../services/users.js";

// Express authentication middleware (optional)
// Usage: app.use("/plants/*", authMiddleware);
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Middleware: before request");
    
    let uid: string | null = null;

    if (req.method === "POST") {
        const data: Data = req.body;
        if (!data.user_id) {
            return res.status(400).json({ error: "Missing user_id" });
        }
        uid = data.user_id;
    } else if (req.method === "GET") {
        uid = req.query.uid as string;
    }

    try {
        // Validate user_id exists
        const userService = new UserService();
        const userObj = await userService.getUser(uid as string);
        
        if (!userObj) {
            return res.status(400).json({ error: "Invalid user_id" });
        }
        
        console.log("userObj:", userObj);
        
        // Attach user to request for later use
        (req as any).user = userObj;
    } catch (error) {
        return res.status(400).json({ error: "Invalid user_id" });
    }

    next();
    console.log("Middleware: after request");
};

export default authMiddleware;