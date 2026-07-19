// routes/upload.routes.ts
import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { uploadAny } from "@middlewares/upload.middleware";
import * as uploadController from "@controllers/upload.controller";

const router = Router();

router.post("/", authenticate, uploadAny.single("file"), uploadController.uploadToCloudinary);

export default router;