import mongoose from "mongoose";
const Schema = mongoose.Schema;

const propertyReviewModel = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
        comment: { type: String, required: true },
        rate: {
            type: Number,
            required: true,
            min: 0,
            max: 5
        },
        likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        isApproved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const PropertyReview = mongoose.model("PropertyReview", propertyReviewModel);

export default PropertyReview;
