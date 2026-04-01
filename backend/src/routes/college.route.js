import {Router} from "express"
import {
   getColleges,
   getByCollegeName
} from "../controllers/college.controller.js"
import {verifyJWT} from '../middlewares/auth.middlewares.js'

const router= Router()

router.get("/all" ,verifyJWT, getColleges)
router.get("/",verifyJWT, getByCollegeName);

export default router;

