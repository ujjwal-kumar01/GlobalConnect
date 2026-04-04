import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { getDashboardRecommendations } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/recommendations", verifyJWT, getDashboardRecommendations);

export default router;