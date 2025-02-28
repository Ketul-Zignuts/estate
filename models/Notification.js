import mongoose from "mongoose";
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // The user involved
        agent: { type: Schema.Types.ObjectId, ref: "User", required: false }, // Optional, for agent-related notifications
        property: { type: Schema.Types.ObjectId, ref: "Property", required: false }, // Optional, related property
        type: {
            type: String,
            enum: ["status", "interest", "message", "booking_cancel"],
            required: true
        },
        messages: [
            {
                sender: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Who sent the message
                content: { type: String, required: true }, // The message text
                timestamp: { type: Date, default: Date.now }, // When the message was sent
            }
        ],
        readBy: [{ type: Schema.Types.ObjectId, ref: "User" }], // Users who have read the notification
        deletedBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
