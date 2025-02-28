import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import Property from "../models/Property.js";
import Category from "../models/Category.js";

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

export const featuredPropertyController = async (req, res) => {
  try {
    const featuredProperties = await Property.find({ isActive: true })
      .select("name price location property_type")
      .populate('category', '_id name')
      .populate("images", "_id image")
      .lean();
    res.status(200).json(featuredProperties);
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const propertyWithCategoryController = async (req, res) => {
  try {
    const categories = await Category.find();
    let allProperties = await Property.find({ isActive: true })
      .select("name price location property_type")
      .populate('category', '_id name')
      .populate("images", "_id image")
      .limit(8)
      .lean();
    const categoryProperties = await Promise.all(
      categories.map(async (category) => {
        let properties = await Property.find({ category: category._id, isActive: true })
          .select("name price location property_type")
          .populate("images", "_id image")
          .limit(8)
          .lean();
        return {
          category: {
            _id: category._id,
            name: category.name,
          },
          properties,
        };
      })
    );

    const finalResponse = [
      {
        category: {
          _id: "all",
          name: "All",
        },
        properties: allProperties,
      },
      ...categoryProperties,
    ];
    res.status(200).json(finalResponse);
  } catch (error) {
    console.error("Error fetching properties with categories:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const propertyExploreController = async (req, res) => {
  try {
    const { price, category, bedRooms, bathRooms, square_feet } = req.query;

    console.log("Received Query Params:", req.query);

    // Create filters dynamically based on received parameters
    const filters = { isActive: true };

    if (price !== undefined) filters.price = { $lte: Number(price) };  // If price is provided
    if (category && (category !== "All" || category !== undefined)) filters.category = category;   // If category is not "All"
    if (bedRooms !== undefined) filters.beds = Number(bedRooms);       // If bedrooms filter is set
    if (bathRooms !== undefined) filters.baths = Number(bathRooms);     // If bathrooms filter is set
    if (square_feet !== undefined) filters.square_feet = { $gte: Number(square_feet) }; // If sqft is provided

    console.log("Filters Applied:", filters);

    // Fetch properties based on filters
    const properties = await Property.find(filters)
      .select("name price location property_type beds baths square_feet")
      .populate("category", "_id name")
      .populate("images", "_id image")
      .lean();

    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const propertySearchController = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } }
        ],
      };
    }
    const properties = await Property.find(query).populate('images').populate('category', '_id name');
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};


export const homePropertyViewController = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).populate("images").populate('category', '_id name').populate('owner', '_id fullName email profile_image phoneNumber').populate({
      path: 'reviews',
      match: { isApproved: true },
      select: '_id comment rate createdAt', // Select only _id and name from the property
      populate: [
        {
          path: 'user',
          select: '_id fullName profile_image',
        },
      ],
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



