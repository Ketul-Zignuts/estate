import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import categoryRoute from "./routes/categoryRoute.js";
import propertyRoute from "./routes/propertyRoute.js";
import homeRoute from "./routes/homeRoute.js";
import ratingRoute from "./routes/ratingRoute.js";
import wishListRoute from "./routes/wishListRoute.js";
import notificationRoute from "./routes/notificationRoute.js";

const app = express();

const corsOption = {
  origin: true,
}

dotenv.config();
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors(corsOption));

//Frontend Apis
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/home", homeRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/property", propertyRoute);
app.use("/api/v1/rating", ratingRoute);
app.use("/api/v1/wishlist", wishListRoute);
app.use("/api/v1/notification", notificationRoute);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
