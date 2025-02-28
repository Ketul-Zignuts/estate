import mongoose from "mongoose";
const Schema = mongoose.Schema;

const wishListSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    },
    { timestamps: true }
);

const WishList = mongoose.model("WishList", wishListSchema);

export default WishList;
