import { Router } from "express";
import auth from "./auth.js";
import templates from "./templates.js";
import reports from "./reports.js";
import billing from "./billing.js";
import admin from "./admin.js";
import health from "./health.js";

const router = Router();

router.use("/health", health);
router.use("/auth", auth);
router.use("/templates", templates);
router.use("/reports", reports);
router.use("/billing", billing);
router.use("/admin", admin);

export default router;
