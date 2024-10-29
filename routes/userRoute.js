import { Router } from "express";

import {
  login,
  logout,
  register,
  users,
  deleteUser,
  initials,
} from "../controller/userController.js";
import { ifAdmin, verifyToken } from "../middleware/verifyUser.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/", verifyToken, users);
router.delete("/:id", verifyToken, deleteUser);
router.get("/initials", verifyToken, initials);
export default router;