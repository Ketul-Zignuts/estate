import { Router } from "express";
import { loginController, passwordChangeController, registerController, userAuthCheckController, userProfileImageUpdateController, userUpdateController } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const authRoute = Router();

authRoute.post("/register", registerController)
authRoute.post("/login", loginController)
authRoute.put("/update", verifyToken, userUpdateController)
authRoute.put("/password", verifyToken, passwordChangeController)
authRoute.put("/profile/image", verifyToken, userProfileImageUpdateController)
authRoute.get("/me", verifyToken, userAuthCheckController)

export default authRoute;