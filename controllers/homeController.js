import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import Property from "../models/Property.js";
import Category from "../models/Category.js";
import PropertyReview from "../models/PropertyReview.js";

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
    for (let property of featuredProperties) {
      const ratings = await PropertyReview.aggregate([
        { $match: { property: property._id, isApproved: true } }, // Match ratings with approved reviews
        { $group: { _id: "$property", avgRating: { $avg: "$rate" } } }, // ✅ Use "rate" instead of "rating"
      ]);

      console.log(`Property ID: ${property._id}, Ratings: `, ratings);

      property.rating =
        ratings.length > 0 && ratings[0].avgRating !== null
          ? Number(ratings[0].avgRating).toFixed(1)
          : "0.0"; // Default rating if no reviews
    }


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

    allProperties = await Promise.all(
      allProperties.map(async (property) => {
        const ratings = await PropertyReview.aggregate([
          { $match: { property: property._id, isApproved: true } }, // Match ratings with approved reviews
          { $group: { _id: "$property", avgRating: { $avg: "$rate" } } }, // ✅ Use "rate" instead of "rating"
        ]);

        property.rating =
          ratings.length > 0 && ratings[0].avgRating !== null
            ? Number(ratings[0].avgRating).toFixed(1)
            : "0.0"; // Default rating if no reviews

        return property;
      })
    );

    const categoryProperties = await Promise.all(
      categories.map(async (category) => {
        let properties = await Property.find({ category: category._id, isActive: true })
          .select("name price location property_type")
          .populate("images", "_id image")
          .limit(8)
          .lean();
        properties = await Promise.all(
          properties.map(async (property) => {
            const ratings = await PropertyReview.aggregate([
              { $match: { property: property._id, isApproved: true } },
              { $group: { _id: "$property", avgRating: { $avg: "$rate" } } },
            ]);

            property.rating =
              ratings.length > 0 && ratings[0].avgRating !== null
                ? Number(ratings[0].avgRating).toFixed(1)
                : "0.0"; // Default rating

            return property;
          })
        );
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
    const { page = 1, limit = 6, price, category, bedRooms, bathRooms, square_feet, search = "" } = req.query;
    const filters = { isActive: true };
    if (price !== undefined) filters.price = { $lte: Number(price) };
    if (category && category !== "All") filters.category = category;
    if (bedRooms !== undefined) filters.beds = Number(bedRooms);
    if (bathRooms !== undefined) filters.baths = Number(bathRooms);
    if (square_feet !== undefined) filters.square_feet = { $gte: Number(square_feet) };
    if (search.trim()) {
      filters.name = { $regex: search, $options: "i" };
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    let properties = await Property.find(filters)
      .select("name price location property_type beds baths square_feet")
      .populate("category", "_id name")
      .populate("images", "_id image")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    properties = await Promise.all(
      properties.map(async (property) => {
        const ratings = await PropertyReview.aggregate([
          { $match: { property: property._id, isApproved: true } }, // Match ratings with approved reviews
          { $group: { _id: "$property", avgRating: { $avg: "$rate" } } }, // ✅ Use "rate" instead of "rating"
        ]);

        property.rating =
          ratings.length > 0 && ratings[0].avgRating !== null
            ? Number(ratings[0].avgRating).toFixed(1)
            : "0.0"; // Default rating if no reviews

        return property;
      })
    );


    const totalProperties = await Property.countDocuments(filters);
    const hasMore = pageNumber * limitNumber < totalProperties; // Check if more pages exist
    const nextPage = hasMore ? pageNumber + 1 : undefined; // Set next page if available

    res.status(200).json({ properties, hasMore, nextPage });

  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
    const property = await Property.findById(id)
      .populate("images")
      .populate("category", "_id name")
      .populate("owner", "_id fullName email profile_image phoneNumber")
      .populate({
        path: "reviews",
        match: { isApproved: true },
        select: "_id comment rate createdAt",
        populate: {
          path: "user",
          select: "_id fullName profile_image",
        },
      })
      .lean();
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    const ratings = await PropertyReview.aggregate([
      { $match: { property: property._id, isApproved: true } },
      { $group: { _id: "$property", avgRating: { $avg: "$rate" } } },
    ]);
    property.rating =
      ratings.length > 0 && ratings[0].avgRating !== null
        ? Number(ratings[0].avgRating).toFixed(1)
        : "0.0";
    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching property details:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
