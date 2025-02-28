import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { myPropertyBookingsCancelController, myPropertyBookingsController, myPropertyListController, myPropertyManageController, myPropertyStatusUpdateController, propertyBuyController, propertyDeleteController, propertyStoreController, propertyUpdateController, propertyViewController } from "../controllers/propertyController.js";

const propertyRoute = Router();

propertyRoute.post("/store", verifyToken, propertyStoreController)
propertyRoute.put("/update/:id", verifyToken, propertyUpdateController)
propertyRoute.post("/buy-now", verifyToken, propertyBuyController)
propertyRoute.get("/my/list", verifyToken, myPropertyListController)
propertyRoute.get("/my/bookings", verifyToken, myPropertyBookingsController)
propertyRoute.get("/my/property/manage", verifyToken, myPropertyManageController)
propertyRoute.post("/my/property/manage/status", verifyToken, myPropertyStatusUpdateController)
propertyRoute.post("/my/bookings/cancel", verifyToken, myPropertyBookingsCancelController)
propertyRoute.get("/:id", verifyToken, propertyViewController)
propertyRoute.delete("/:id", verifyToken, propertyDeleteController)

export default propertyRoute;