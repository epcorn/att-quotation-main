import { Router } from "express";

import {
  create,
  quotes,
  singleQuote,
  docData,
  update,
  getArchive,
  similarProjects,
  approving,
} from "../controller/quoteController.js";
import { verifyToken } from "../middleware/verifyUser.js";

const router = Router();

router.post("/create", verifyToken, create);
router.get("/getQuotes", verifyToken, quotes);
router.post("/similarPorjects", similarProjects);
router.get("/:id", verifyToken, singleQuote);
router.post("/:id", verifyToken, update);
router.get("/docx/:id", verifyToken, docData);
router.get("/approve/:id", verifyToken, approving);
router.get("/archive/:id", verifyToken, getArchive);
export default router;