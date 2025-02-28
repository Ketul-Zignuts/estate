import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { wishListStoreController } from "../controllers/wishListController.js";

const wishListRoute = Router();

wishListRoute.post("/store", verifyToken, wishListStoreController)

export default wishListRoute;