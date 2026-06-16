import { Router } from "express";
import * as controller from "@/modules/webhooks/sepay.controller";

const router = Router();

router.post("/", controller.handle);

export default router;

