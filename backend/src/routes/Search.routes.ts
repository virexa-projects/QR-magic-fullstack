import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { searchQR } from "../controllers/Search.controller";

const router = Router();

router.use(authenticate);

router.get("/qr", searchQR);

export default router;