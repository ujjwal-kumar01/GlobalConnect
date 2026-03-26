import {Router} from "express"
import {
   getColleges
} from "../controllers/college.controller.js"
import {verifyJWT} from '../middlewares/auth.middlewares.js'

const router= Router()

router.get("/all" ,verifyJWT, getColleges)

export default router;

