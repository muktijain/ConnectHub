import { Router } from "express";
import { login, register, getUserHistory, addToHistory } from "../controllers/users.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_history").post(addToHistory);
router.route("/get_all_history").get (getUserHistory);

export default router;