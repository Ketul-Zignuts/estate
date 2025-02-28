import { Router } from "express";
import { featuredPropertyController, homePropertyViewController, propertyExploreController, propertySearchController, propertyWithCategoryController } from "../controllers/homeController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const homeRoute = Router();

homeRoute.get("/featured", verifyToken, featuredPropertyController)
homeRoute.get("/section", verifyToken, propertyWithCategoryController)
homeRoute.get("/explore", verifyToken, propertyExploreController)
homeRoute.get("/search", verifyToken, propertySearchController)
homeRoute.get("/property/:id", verifyToken, homePropertyViewController)

export default homeRoute;