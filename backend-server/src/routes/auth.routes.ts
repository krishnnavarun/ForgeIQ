import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { googleCallback, googleStart, login, logout, me, register } from "../controllers/auth.controller.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";

export const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), register);
authRouter.post("/login", validate({ body: loginSchema }), login);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, me);
authRouter.get("/google", googleStart);
authRouter.get("/google/callback", googleCallback);