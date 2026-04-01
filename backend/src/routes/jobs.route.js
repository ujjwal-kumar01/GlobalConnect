import {Router} from "express"
import {verifyJWT} from '../middlewares/auth.middlewares.js'
import { 
    createJob,
    getMyPostedJobs, 
    getJobApplications, 
    updateApplicationStatus ,
    getCampusJobs,
    applyForJob,
    getMyApplications
} from "../controllers/jobs.controller.js";
import {upload} from '../middlewares/multer.middlewares.js'

const router= Router()

router.post("/post" ,verifyJWT, createJob)
router.get("/me",verifyJWT, getMyPostedJobs);
router.get("/:jobId/applications",verifyJWT, getJobApplications);
router.put("/applications/:applicationId/status",verifyJWT, updateApplicationStatus); 

// --- STUDENT ROUTES ---
router.get("/campus", verifyJWT, getCampusJobs);
router.post("/:jobId/apply",verifyJWT,upload.single("resume"), applyForJob);
router.get("/my-applications",verifyJWT, getMyApplications);

export default router;