import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js"; 
import { 
    getMessages, 
    sendMessage, 
    getConversations,
    getUnreadMessages,   // 🔥 Import this
    markMessagesAsRead   // 🔥 Import this
} from "../controllers/message.controller.js";

const router = Router();

// Apply authentication to all message routes
router.use(verifyJWT);

// Get the sidebar conversation list
router.get("/conversations", getConversations);

// 🔥 CRITICAL: These specific routes MUST go before the /:id route
router.get("/unread", getUnreadMessages);
router.put("/mark-read", markMessagesAsRead);

// Fetch chat history with a specific user
router.get("/:id", getMessages);

// Send a message (with Multer catching the "attachment" file)
router.post("/send/:id", upload.single("attachment"), sendMessage);

export default router;