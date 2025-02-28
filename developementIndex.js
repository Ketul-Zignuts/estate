import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import homeRoute from "./routes/homeRoute.js";
import bookingRoute from "./routes/bookingRoute.js";
import ratingRoute from "./routes/ratingRoute.js";

const app = express();
const corsOption = {
    origin: true,
}
app.get("/",(req,res)=>{
    res.send("Api is in working conditions")
})
dotenv.config();
connectDB();
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors(corsOption));

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/home", homeRoute);
app.use("/api/v1/booking", bookingRoute);
app.use("/api/v1/rating", ratingRoute);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
