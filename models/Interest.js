import mongoose from "mongoose";
const Schema = mongoose.Schema;

const interestSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        agent: { type: Schema.Types.ObjectId, ref: "User", required: true },
        property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
        status: {
            type: String, enum: [
                "pending", // Initial state when a user shows interest
                "under_review", // Agent is evaluating
                "negotiating", // Negotiation ongoing (e.g., price discussions)
                "approved", // Agent has approved this user
                "rejected", // Rejected (e.g., low offer, legal issues)
                "withdrawn", // User withdrew interest
                "finalized" // Final choice for property
            ], default: "pending"
        },
        isCancelled: { type: Boolean, default: false },
        withdraw_reason: { type: String, default: null },
    },
    { timestamps: true }
);

const Interest = mongoose.model("Interest", interestSchema);
export default Interest;
