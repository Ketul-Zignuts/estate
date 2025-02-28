import dotenv from "dotenv";
import Property from "../models/Property.js";
import PropertyReview from "../models/PropertyReview.js";

dotenv.config();

export const ratingStoreController = async (req, res) => {
  try {
    const user = req.userId;
    const { property, rate, comment } = req.body;

    // Check if the user has already reviewed this property
    const alreadyExist = await PropertyReview.findOne({ user, property });

    if (alreadyExist) {
      return res.status(400).json({ message: 'You have already reviewed this property.' });
    }

    const review = await new PropertyReview({
      user,
      property,
      comment,
      rate,
      isApproved: false
    });

    await review.save();

    const propertyToUpdate = await Property.findById(property);
    if (propertyToUpdate) {
      propertyToUpdate.reviews.push(review._id);
      await propertyToUpdate.save();
    }

    res.status(200).json({ message: 'Thank you for rating this property' });
  } catch (error) {
    console.log('error: ', error);
    res.status(500).json({ message: error.message });
  }
};

export const ratingLikeController = async (req, res) => {
  try {
    const user = req.userId;
    const { reviewId } = req.body;
    const review = await PropertyReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    const userIndex = review.likes.indexOf(user);
    if (userIndex === -1) {
      review.likes.push(user);
    } else {
      review.likes.splice(userIndex, 1);
    }
    await review.save();
    res.status(200).json({ message: 'Like toggled successfully', review });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const ratingApprovalController = async (req, res) => {
  try {
    const { reviewId, isApproved } = req.body;
    const review = await PropertyReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    review.isApproved = isApproved == true ? true : false;
    await review.save();
    res.status(200).json({ message: 'Rating Approval saved successfully' });
  } catch (error) {
    console.error('Error Approving Rate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const ratingApprovalListController = async (req, res) => {
  try {
    let { page = 1, limit = 5, search = "", sortBy = "createdAt", order = "desc" } = req.query;

    page = parseInt(page) || 1; // Ensure page is at least 1
    limit = parseInt(limit) || 5; // Ensure limit is a valid number
    order = order === "desc" ? -1 : 1;

    if (page < 1) page = 1; // Prevent negative/zero page values

    const query = {
      ...(search ? { name: { $regex: search, $options: "i" } } : {}),
    };

    const ratings = await PropertyReview.find(query)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit) // Now always >= 0
      .limit(limit)
      .populate('user', '_id fullName profile_image email phoneNumber')
      .populate({
        path: 'property',
        select: '_id name price', // Select only _id and name from the property
        populate: [
          {
            path: 'images',
            select: '_id image',
            options: { limit: 1 }, // Populate only 1 image from the images array
          },
          {
            path: 'category',
            select: '_id name',
          },
        ],
      });

    const total = await PropertyReview.countDocuments(query);

    res.status(200).json({
      ratings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const ratingDeleteController = async (req, res) => {
  try {
    const { id } = req.params;
    const rating = await PropertyReview.findById(id);
    if (!rating) {
      return res.status(404).json({ message: "Review not found" });
    }
    await PropertyReview.findByIdAndDelete(id);
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};





