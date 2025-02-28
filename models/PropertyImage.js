import mongoose from "mongoose";
const Schema = mongoose.Schema;

const propertyImageModel = new Schema(
    {
        image: { type: String, required: true },
        sorting: { type: Number, required: true, default: 0 },
        label: { type: String, required: false },
        is_featured: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const PropertyImage = mongoose.model("PropertyImage", propertyImageModel);

export default PropertyImage;
