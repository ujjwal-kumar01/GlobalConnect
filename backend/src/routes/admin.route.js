import { Router } from "express";
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { upload } from "../middlewares/multer.middlewares.js"; // 🔥 Import multer for images
import {
    getCollegeMembers,
    verifyMember,
    removeMember,
    createCollegePost, // 🔥 New Controller
    getAdminStats,
    deleteCollegePost
} from '../controllers/admin.controller.js';

const router = Router();

// --- Member Management ---
router.get("/members", verifyJWT, getCollegeMembers);
router.put("/memberships/:userId/verify", verifyJWT, verifyMember);
router.delete("/memberships/:userId", verifyJWT, removeMember);

// --- Official Campus Posts & Events ---
// 🔥 This matches your axios call: /api/admin/create-post
router.post(
    "/create-post", 
    verifyJWT, 
    upload.single("image"), // Handles the 'image' field from your FormData
    createCollegePost
);

// Helpful for the admin to see/manage their own posts specifically
router.get("/stats/overview", verifyJWT, getAdminStats);
router.delete("/posts/:postId", verifyJWT, deleteCollegePost);

export default router;