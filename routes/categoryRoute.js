import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { categoryDeleteController, categoryDropDownController, categoryListController, categoryStoreController, categoryUpdateController, categoryViewController } from "../controllers/categoryController.js";

const categoryRoute = Router();

categoryRoute.post("/store", verifyToken, categoryStoreController)
categoryRoute.put("/update/:id", verifyToken, categoryUpdateController)
categoryRoute.get("/list", verifyToken, categoryListController)
categoryRoute.get("/option", verifyToken, categoryDropDownController)
categoryRoute.get("/:id", verifyToken, categoryViewController)
categoryRoute.delete("/:id", verifyToken, categoryDeleteController)

export default categoryRoute;