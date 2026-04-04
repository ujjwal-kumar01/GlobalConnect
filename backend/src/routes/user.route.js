import { Router } from "express"
import {
    loginUser,
    registerUser,
    verifyEmail,
    googlelogin,
    resendVerificationCode,
    logout,
    getCurrentUser,
    requestCollegeAccess,
    removeMyMembership,
    updateProfile,
    getUserProfileById,
    getCollegePosts,   // 🔥 NEW IMPORT
    getUserStats,
    switchActiveMembership
} from "../controllers/user.controller.js"
import { onboardingAcademic } from '../controllers/student.controller.js'
import { onboardingAdmin } from '../controllers/admin.controller.js'
import { onboardingRecruiter } from '../controllers/recruiter.controller.js'
import { verifyJWT } from '../middlewares/auth.middlewares.js'
import { upload } from '../middlewares/multer.middlewares.js'

const router = Router()

// Auth & Setup Routes
router.post("/login", loginUser)
router.post("/registerUser", registerUser)
router.post("/google-login", googlelogin)
router.post("/verify", verifyJWT, verifyEmail)
router.post("/resendVerificationCode", verifyJWT, resendVerificationCode)
router.post("/logout", verifyJWT, logout)

// Onboarding Routes
router.post("/onboarding/academic", verifyJWT, onboardingAcademic)
router.post("/onboarding/admin", verifyJWT, onboardingAdmin)
router.post("/onboarding/recruiter", verifyJWT, onboardingRecruiter)

// Membership Routes
router.post("/memberships/request", verifyJWT, requestCollegeAccess)
router.put("/memberships/active", verifyJWT, switchActiveMembership)
router.delete("/memberships/:collegeId", verifyJWT, removeMyMembership)

// User Profile Routes
router.get("/me", verifyJWT, getCurrentUser) // Keep this ABOVE /:userId
router.put('/profile', verifyJWT, upload.single("avatar"), updateProfile)
router.get("/college-posts", verifyJWT, getCollegePosts);
router.get("/stats/user-overview", verifyJWT, getUserStats);

// 🔥 NEW ROUTE: Fetch specific user profile
router.get("/:userId", verifyJWT, getUserProfileById)

export default router;