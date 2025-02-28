import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import Property from "../models/Property.js";
import PropertyImage from "../models/PropertyImage.js";
import fs from "fs";
import Interest from "../models/Interest.js";
import Notification from "../models/Notification.js";

dotenv.config();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/property");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

export const propertyUpdateController = async (req, res) => {
  try {
    upload.array("images", 10)(req, res, async (err) => {
      if (err && req.files) {
        return res.status(500).json({
          status: false,
          message: err?.message || "Error uploading files",
          error: err.message,
        });
      }

      try {
        const { id } = req.params; // Property ID
        const {
          name, category, beds, baths, square_feet, description,
          property_type, price, address, city, state, country, facilities, old_images, isActive
        } = req.body;

        const property = await Property.findById(id);
        if (!property) {
          return res.status(404).json({ status: false, message: "Property not found" });
        }

        let parsedFacilities = [];
        if (Array.isArray(facilities)) {
          parsedFacilities = facilities.map(item => JSON.parse(item)).flat();
        } else if (typeof facilities === "string") {
          parsedFacilities = JSON.parse(facilities);
        } else {
          parsedFacilities = [];
        }
        const parsedOldImages = old_images ? JSON.parse(old_images) : [];

        // Find images to delete (those in DB but not in old_images)
        const storedImages = await PropertyImage.find({ _id: { $in: property.images } });
        const imagesToDelete = storedImages.filter((img) =>
          !parsedOldImages.some(oldImg => oldImg._id === img._id.toString())
        );

        // Delete images that were removed by the user
        for (const img of imagesToDelete) {
          const imagePath = path.join("public/images/property", img.image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath); // Delete from storage
          }
          await PropertyImage.findByIdAndDelete(img._id); // Delete from DB
        }

        // Handle new image uploads
        const uploadedFiles = req.files;
        const newImageDocs = [];

        if (uploadedFiles && uploadedFiles.length > 0) {
          for (let index = 0; index < uploadedFiles.length; index++) {
            const file = uploadedFiles[index];
            const newImage = new PropertyImage({
              image: file.filename,
              sorting: index, // Sorting order
            });
            await newImage.save();
            newImageDocs.push(newImage._id);
          }
        }

        // Update Property with new images and other data
        property.name = name;
        property.category = category;
        property.beds = beds;
        property.baths = baths;
        property.square_feet = square_feet;
        property.description = description;
        property.property_type = property_type;
        property.price = price;
        property.address = address;
        property.city = city;
        property.state = state;
        property.country = country;
        property.facilities = parsedFacilities;
        property.isActive = isActive;

        // Combine existing images and new images
        property.images = [
          ...parsedOldImages.filter(img => img._id), // Retain images with an _id
          ...newImageDocs, // Add new uploaded images
        ];

        await property.save();

        res.status(200).json({
          status: true,
          message: "Property updated successfully",
          data: property,
        });
      } catch (error) {
        res.status(500).json({ status: false, message: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

export const propertyStoreController = async (req, res) => {
  try {
    upload.array("images", 10)(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: err?.message || "Error uploading files",
          error: err.message,
        });
      }

      try {
        const owner = req.userId;
        const {
          name, category, beds, baths, square_feet, description,
          property_type, price, address, city, state, country, facilities, isActive
        } = req.body;

        const parsedFacilities = facilities ? JSON.parse(facilities) : [];

        // Handle file uploads
        const files = req.files;
        const imageDocs = [];

        if (files && files.length > 0) {
          for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const newImage = new PropertyImage({
              image: file.filename,
              sorting: index, // Sorting order
            });
            await newImage.save();
            imageDocs.push(newImage._id);
          }
        }

        // Save Property
        const newProperty = new Property({
          name,
          category,
          beds,
          baths,
          square_feet,
          owner,
          description,
          property_type,
          price,
          facilities: parsedFacilities,
          location: { address, city, state, country },
          images: imageDocs, // Attach uploaded images
          isActive: isActive ?? true,
        });

        await newProperty.save();

        res.status(200).json({
          message: "Property created successfully"
        });

      } catch (error) {
        console.error("❌ Error saving property:", error);
        res.status(500).json({
          message: "Internal server error",
          error: error.message,
        });
      }
    });
  } catch (error) {
    console.error("❌ Error processing request:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const myPropertyListController = async (req, res) => {
  try {
    const userId = req.userId;
    let { page = 1, limit = 5, search = "", sortBy = "createdAt", order = "desc" } = req.query;

    page = parseInt(page) || 1; // Ensure page is at least 1
    limit = parseInt(limit) || 5; // Ensure limit is a valid number
    order = order === "desc" ? -1 : 1;

    if (page < 1) page = 1; // Prevent negative/zero page values

    const query = {
      owner: userId, // Ensure only properties of logged-in user
      ...(search ? { name: { $regex: search, $options: "i" } } : {}),
    };

    const properties = await Property.find(query)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit) // Now always >= 0
      .limit(limit)
      .populate("images");

    const total = await Property.countDocuments(query);

    res.status(200).json({
      properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const propertyViewController = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).populate("images");
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const propertyDeleteController = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the property by ID
    const property = await Property.findById(id).populate("images"); // Populating the images field to access image details
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Delete images from storage
    if (property.images && property.images.length > 0) {
      property.images.forEach((image) => {
        const imagePath = path.join("public/images/property", image.image); // Assuming image field is stored as image name/path

        // Check if the image exists and delete it
        fs.access(imagePath, fs.constants.F_OK, (err) => {
          if (!err) {
            fs.unlink(imagePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error("Error deleting image:", unlinkErr);
              } else {
                console.log(`Deleted image: ${imagePath}`);
              }
            });
          } else {
            console.warn(`Image not found: ${imagePath}`);
          }
        });
      });
    }

    // Delete the property document from DB
    await Property.findByIdAndDelete(id);

    res.status(200).json({ message: "Property and associated images deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const propertyBuyController = async (req, res) => {
  try {
    const userId = req.userId;
    const { property } = req.body;

    // Check if user is trying to buy their own property
    const ownsProperty = await Property.findOne({ owner: userId, _id: property });
    if (ownsProperty) {
      return res.status(400).json({ message: "You cannot buy your own property." });
    }

    // Fetch the property to get the agent (owner)
    const propertyData = await Property.findById(property).select("owner");
    if (!propertyData) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Check if user has already shown interest
    const existingInterest = await Interest.findOne({ user: userId, property });
    if (existingInterest) {
      return res.status(400).json({ message: "You have already shown interest in this property." });
    }

    // Create new interest record
    const newInterest = new Interest({
      user: userId,
      agent: propertyData.owner, // ✅ Correctly setting agent
      property,
      status: "pending",
    });
    await newInterest.save();

    // Update property interestedParties
    await Property.findByIdAndUpdate(property, {
      $push: { interestedParties: newInterest._id },
    });

    // Create a new notification for the agent
    const newNotification = new Notification({
      user: userId,
      agent: propertyData.owner, // ✅ Correctly setting agent
      property,
      type: "interest",
      messages: [],
    });

    await newNotification.save();

    res.status(200).json({ message: "Thank you for showing interest! An agent will contact you soon." });
  } catch (error) {
    console.error("Error in propertyBuyController:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const myPropertyBookingsController = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 5, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { user: userId };

    if (search) {
      const property = await Property.findOne({ name: new RegExp(search, "i") }).select("_id");
      if (property) {
        query.property = property._id;
      }
    }

    const listings = await Interest.find(query)
      .populate([
        {
          path: "property",
          select: "_id name price property_type location.address status",
          populate: [
            {
              path: "images",
              select: "_id image"
            },
            {
              path: "category",
              select: "_id name"
            }
          ]
        },
        {
          path: "agent",
          select: "_id fullName email profile_image phoneNumber"
        }
      ])
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Interest.countDocuments(query);
    const hasMore = skip + listings.length < totalCount;

    res.status(200).json({
      status: true,
      listings,
      hasMore,
      nextPage: hasMore ? Number(page) + 1 : null, // Ensure nextPage exists
    });

  } catch (error) {
    console.error("Error fetching property bookings:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const myPropertyManageController = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 5, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { owner: userId }; // Ensure filtering by owner

    if (search) {
      query.name = new RegExp(search, "i"); // Search by property name (case-insensitive)
    }

    // Fetch properties owned by the user
    const listings = await Property.find(query)
      .select('_id name price property_type location.address status')
      .populate([
        {
          path: "images",
          select: "_id image"
        },
        {
          path: "category",
          select: "_id name"
        },
        {
          path: 'interestedParties',
          select: 'status isCancelled withdraw_reason',
          populate: {
            path: 'user',
            select: '_id fullName email profile_image phoneNumber'
          }
        }
      ])
      .skip(skip)
      .limit(parseInt(limit));

    // Count total properties for pagination
    const totalCount = await Property.countDocuments(query);
    const hasMore = skip + listings.length < totalCount;

    res.status(200).json({
      status: true,
      listings,
      hasMore,
      nextPage: hasMore ? Number(page) + 1 : null, // Ensure nextPage is properly assigned
    });

  } catch (error) {
    console.error("Error fetching managed properties:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const myPropertyStatusUpdateController = async (req, res) => {
  try {
    const agent = req.userId;
    const { status, property, user, interestId } = req.body;
    const interest = await Interest.findOne({ _id: interestId, user, property, agent });
    if (!interest) {
      return res.status(404).json({ message: "Interest record not found or unauthorized." });
    }
    if (status === "finalized") {
      const existingFinalized = await Interest.findOne({ property, status: "finalized" });
      if (existingFinalized) {
        return res.status(400).json({ message: "Only one interest can be finalized for this property.", interestId: interestId });
      }
    }
    interest.status = status;
    await interest.save();

    let notification = await Notification.findOne({ user: user, agent: agent, property: property });
    if (notification) {
      notification.type = 'status';
      notification.readBy = [];
      notification.deletedBy = [];
    } else {
      notification = new Notification({
        user: user,
        agent: agent,
        property: property,
        type: "status"
      });
    }
    await notification.save();

    if (status === "finalized") {
      const propertyData = await Property.findById(property);
      if (propertyData) {
        propertyData.status = "sold";
        await propertyData.save();
      }
    }

    return res.status(200).json({ message: "Status updated successfully." });
  } catch (error) {
    console.error("Error updating property status:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



export const myPropertyBookingsCancelController = async (req, res) => {
  try {
    const userId = req.userId;
    const { property, agent, message } = req.body;

    // Find the booking interest
    const interest = await Interest.findOne({ user: userId, agent, property });

    if (!interest) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update interest details
    interest.withdraw_reason = message;
    interest.status = "withdrawn";
    interest.isCancelled = true;
    await interest.save();

    // Check if a notification already exists
    let notification = await Notification.findOne({ user: userId, agent, property });

    if (notification) {
      // Update existing notification
      notification.messages.push({ sender: userId, content: message });
      notification.type = "booking_cancel";
      notification.readBy = [];
      notification.deletedBy = [];
    } else {
      // Create new notification
      notification = new Notification({
        user: userId,
        agent,
        property,
        type: "booking_cancel",
        messages: [{ sender: userId, content: message }],
      });
    }

    await notification.save();

    res.status(200).json({ message: "Your booking has been cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling property booking:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
