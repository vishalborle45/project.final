import { Router } from "express";
import {
  register,
  login,
  getProfile
} from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";

const authrouter = Router();

authrouter.post("/register", register);
authrouter.post("/login", login);
authrouter.get("/profile", authenticate, getProfile);

export default authrouter;
