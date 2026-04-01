import { Router } from "express";
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import {
    getCollegeMembers,
    verifyMember,
    removeMember
} from '../controllers/admin.controller.js';

const router = Router();

router.get("/members",verifyJWT, getCollegeMembers);

router.put("/memberships/:userId/verify",verifyJWT, verifyMember);

router.delete("/memberships/:userId",verifyJWT, removeMember);

export default router;