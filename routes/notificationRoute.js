import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { agentMessageController, notificationGetController, notificationMessageController, notificationUpdateController } from "../controllers/notificationController.js";

const notificationRoute = Router();

notificationRoute.get("/list", verifyToken, notificationGetController)
notificationRoute.post("/message", verifyToken, notificationMessageController)
notificationRoute.post("/chat", verifyToken, agentMessageController)
notificationRoute.post("/update", verifyToken, notificationUpdateController)

export default notificationRoute;