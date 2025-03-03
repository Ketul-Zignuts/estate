import { Router } from "express";
import { loginController, passwordChangeController, registerController, userAuthCheckController, userProfileImageUpdateController, userPushTokenStoreController, userUpdateController } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const authRoute = Router();

authRoute.post("/register", registerController)
authRoute.post("/login", loginController)
authRoute.put("/update", verifyToken, userUpdateController)
authRoute.put("/password", verifyToken, passwordChangeController)
authRoute.put("/profile/image", verifyToken, userProfileImageUpdateController)
authRoute.post("/save-push-token", verifyToken, userPushTokenStoreController)
authRoute.get("/me", verifyToken, userAuthCheckController)

export default authRoute;