import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { ratingApprovalController, ratingApprovalListController, ratingDeleteController, ratingLikeController, ratingStoreController } from "../controllers/ratingController.js";

const ratingRoute = Router();

ratingRoute.post("/store", verifyToken, ratingStoreController)
ratingRoute.post("/approve", verifyToken, ratingApprovalController)
ratingRoute.post("/like", verifyToken, ratingLikeController)
ratingRoute.get("/admin/list", verifyToken, ratingApprovalListController)
ratingRoute.delete("/admin/:id", verifyToken, ratingDeleteController)

export default ratingRoute;