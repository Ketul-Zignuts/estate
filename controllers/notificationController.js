import dotenv from "dotenv";
import Notification from "../models/Notification.js";
import Property from "../models/Property.js";

dotenv.config();

export const notificationGetController = async (req, res) => {
    try {
        const userId = req.userId;
        console.log('userId: ', userId);
        const notifications = await Notification.find({
            $or: [{ user: userId }, { agent: userId }],
            deletedBy: { $ne: userId }
        })
            .populate('user', '_id fullName profile_image')
            .populate('agent', '_id fullName profile_image')
            .populate({
                path: 'messages.sender',
                select: '_id fullName profile_image'
            })
            .populate({
                path: 'property',
                select: '_id name price location.address property_type',
                populate: [
                    {
                        path: 'images',
                        select: '_id image',
                    },
                    {
                        path: 'category',
                        select: '_id name'
                    }
                ]
            });
        const formattedNotifications = notifications.map((notification) => {
            const isRead = notification.readBy.includes(userId);
            return {
                ...notification.toObject(),
                notificationFor: notification?.agent?._id?.toString() === userId ? "agent" : "user",
                isRead
            };
        });
        res.status(200).json(formattedNotifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const notificationMessageController = async (req, res) => {
    try {
        const userId = req.userId;
        const { notificationId, message } = req.body;
        const notification = await Notification.findOne({ _id: notificationId });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        notification.messages.push({ sender: userId, content: message });
        notification.type = 'message';
        notification.readBy = [];
        notification.deletedBy = [];
        await notification.save();
        res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const notificationUpdateController = async (req, res) => {
    try {
        const userId = req.userId;
        const { notificationId, type } = req.body;

        if (type === "mark_as_read") {
            const notification = await Notification.findById(notificationId);
            if (!notification) {
                return res.status(404).json({ message: "Notification not found" });
            }
            const isAlreadyRead = notification.readBy.includes(userId);
            await Notification.findByIdAndUpdate(notificationId, {
                [isAlreadyRead ? "$pull" : "$addToSet"]: { readBy: userId } // ✅ Toggle logic
            });
            return res.status(200).json({
                message: isAlreadyRead ? "Notification marked as unread" : "Notification marked as read"
            });
        }

        if (type === "mark_all_as_read") {
            await Notification.updateMany(
                { readBy: { $ne: userId } },
                { $addToSet: { readBy: userId } }
            );
            return res.status(200).json({ message: "All notifications marked as read" });
        }

        if (type === "remove") {
            // Remove a specific notification for the user
            await Notification.findByIdAndUpdate(notificationId, {
                $addToSet: { deletedBy: userId }
            });
            return res.status(200).json({ message: "Notification removed successfully" });
        }

        if (type === "delete") {
            await Notification.updateMany(
                { $or: [{ user: userId }, { agent: userId }] }, // ✅ Check both user and agent
                { $addToSet: { deletedBy: userId } }
            );
            return res.status(200).json({ message: "All notifications deleted for the user/agent" });
        }

        return res.status(400).json({ message: "Invalid type provided" });

    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const agentMessageController = async (req, res) => {
    try {
        const userId = req.userId;
        const { message, property } = req.body;

        // Check if the property exists
        const existingProperty = await Property.findById(property);
        if (!existingProperty) {
            return res.status(404).json({ message: "Property not found" });
        }

        const agent = existingProperty.owner;

        // Prevent agent from sending a message first
        if (userId.toString() === agent.toString()) {
            return res.status(400).json({ message: "Agents cannot initiate a conversation." });
        }

        // Check if a notification already exists
        let notification = await Notification.findOne({ user: userId, agent: agent, property: property });

        if (notification) {
            // Update existing notification
            notification.messages.push({ sender: userId, content: message });
            notification.type = 'message';
            notification.readBy = [];
            notification.deletedBy = [];
        } else {
            notification = new Notification({
                user: userId, // The user who showed interest
                agent: agent, // The agent (property owner)
                property: property, // The related property
                type: "message",
                messages: [{ sender: userId, content: message }],
            });
        }

        await notification.save();
        res.status(200).json({ message: "Your message has been sent to the agent successfully." });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

