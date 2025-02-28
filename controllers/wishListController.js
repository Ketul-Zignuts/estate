import dotenv from "dotenv";
import WishList from "../models/WishList.js";

dotenv.config();

export const wishListStoreController = async (req, res) => {
    try {
        const userId = req.userId;
        const { property } = req.body;
        const existingWish = await WishList.findOne({ user: userId, property });
        if (existingWish) {
            await WishList.findByIdAndDelete(existingWish._id);
            return res.status(200).json(property);
        } else {
            const newWish = new WishList({ user: userId, property });
            await newWish.save();
            return res.status(200).json(property);
        }
    } catch (error) {
        console.error("Error updating wishlist:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};