import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import Category from "../models/Category.js";
import fs from "fs";

dotenv.config();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/category");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

export const categoryStoreController = async (req, res) => {
  try {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: err?.message || "Error uploading file",
          error: err.message,
        });
      }
      try {
        const file = req.file;
        const imagePath = file ? file.filename : null;
        const { name, description, isActive } = req.body;

        const existingName = await Category.findOne({ name });
        if (existingName) {
          return res.status(410).json({
            message: "Category name already exists",
          });
        }

        await new Category({
          name,
          description,
          isActive,
          image: imagePath,
        }).save();

        res.status(200).json({ message: 'Category created successfully' });
      } catch (error) {
        console.log("Error creating category:", error);
        res.status(500).json({
          message: "Internal server error",
          error: error.message,
        });
      }
    });
  } catch (error) {
    console.log('error: ', error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }

};

export const categoryUpdateController = async (req, res) => {
  try {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: err?.message || "Error uploading file",
          error: err.message,
        });
      }

      try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const file = req.file;
        const newImagePath = file ? file.filename : undefined; // Only update if a new file is uploaded

        // Find the existing category
        const category = await Category.findById(id);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }

        // Check if name already exists (excluding current category)
        const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
        if (existingCategory) {
          return res.status(410).json({ message: "Category name already exists" });
        }

        // If a new image is uploaded, delete the old one
        if (newImagePath && category.image) {
          const oldImagePath = path.join("public/images/category", category.image);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }

        // Update category details
        category.name = name ?? category.name;
        category.description = description ?? category.description;
        category.isActive = isActive ?? category.isActive;
        if (newImagePath) category.image = newImagePath; // Update image only if new one is uploaded

        await category.save();
        res.status(200).json({ message: "Category updated successfully" });

      } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({
          message: "Internal server error",
          error: error.message,
        });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const categoryListController = async (req, res) => {
  try {
    let { page = 1, limit = 5, search = "", sortBy = "createdAt", order = "desc" } = req.query;

    page = parseInt(page) || 1; // Ensure page is at least 1
    limit = parseInt(limit) || 5; // Ensure limit is a valid number
    order = order === "desc" ? -1 : 1;

    if (page < 1) page = 1; // Prevent negative/zero page values

    const query = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

    const categories = await Category.find(query)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit) // Now always >= 0
      .limit(limit);

    const total = await Category.countDocuments(query);

    res.status(200).json({
      categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const categoryViewController = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const categoryDeleteController = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete the old image if it exists
    if (category.image) {
      const oldImagePath = path.join("public/images/category", category.image);

      fs.access(oldImagePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(oldImagePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting old image:", unlinkErr);
          });
        } else {
          console.warn("Old image file not found, skipping deletion.");
        }
      });
    }

    // Delete the category from DB
    await Category.findByIdAndDelete(id);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const categoryDropDownController = async (req, res) => {
  try {
    const categories = await Category.find({});
    const mapCategories = categories.map((item) => ({
      value: item._id,
      label: item.name,
    }));
    res.status(200).json(mapCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


