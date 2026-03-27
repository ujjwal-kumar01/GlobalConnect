import {Router} from "express"
import {
    loginUser,
    registerUser,
    verifyEmail,
    googlelogin,
    resendVerificationCode,
    logout
} from "../controllers/user.controller.js"
import {onboardingAcademic} from '../controllers/student.controller.js'
import {onboardingAdmin} from '../controllers/admin.controller.js'
import {onboardingRecruiter} from '../controllers/recruiter.controller.js'
import {verifyJWT} from '../middlewares/auth.middlewares.js'

const router= Router()

router.post("/login", loginUser)
router.post("/registerUser", registerUser)
router.post("/verify",verifyJWT ,verifyEmail)
router.post("/logout",verifyJWT ,logout)
router.post("/google-login" ,googlelogin)
router.post("/resendVerificationCode" ,verifyJWT, resendVerificationCode)
router.post("/onboarding/academic" ,verifyJWT, onboardingAcademic)
router.post("/onboarding/admin" ,verifyJWT, onboardingAdmin)
router.post("/onboarding/recruiter" ,verifyJWT, onboardingRecruiter)

export default router;

