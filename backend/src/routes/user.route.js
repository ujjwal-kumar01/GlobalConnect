import {Router} from "express"
import {
    loginUser,
    registerUser
} from "../controllers/user.controller.js"
const router= Router()

router.post("/login", loginUser)
router.post("/registerUser", registerUser)

export default router;

