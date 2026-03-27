import {Router} from "express"
import {
   allAlumni
} from "../controllers/student.controller.js"
import {verifyJWT} from '../middlewares/auth.middlewares.js'

const router= Router()

router.get("/allAlumni" ,verifyJWT, allAlumni)

export default router;

