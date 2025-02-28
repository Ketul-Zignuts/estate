import mongoose from "mongoose";
const Schema = mongoose.Schema;

const propertyModel = new Schema(
    {
        name: { type: String, required: true },
        category: { type: Schema.Types.ObjectId, ref: "Category", required: true }, // Reference to Category model
        beds: { type: Number, required: true }, // Number of bedrooms
        baths: { type: Number, required: true }, // Number of bathrooms
        square_feet: { type: Number, required: true }, // Area size
        owner: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model (Property owner)
        description: { type: String, required: true }, // Property description
        facilities: [
            {
                name: { type: String, required: true }, // Facility name (e.g., Parking, Pool)
                icon: { type: String, required: false }, // Facility icon URL or name
            },
        ],
        property_type: { type: String, enum: ["rent", "sale"], required: true }, // Rent or Sale
        price: { type: Number, required: true }, // Property price
        location: {
            address: { type: String, required: true }, // Full address
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            coordinates: {
                lat: { type: Number, required: false }, // Latitude
                lng: { type: Number, required: false }, // Longitude
            },
        },
        images: [{ type: Schema.Types.ObjectId, ref: "PropertyImage" }],
        reviews: [{ type: Schema.Types.ObjectId, ref: "PropertyReview" }],
        interestedParties: [{ type: Schema.Types.ObjectId, ref: "Interest" }],
        status: { type: String, enum: ["pending", "available", "sold"], default: "pending" },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Property = mongoose.model("Property", propertyModel);

export default Property;
