import User from "../models/User.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

const generateJWT = (user) => {
  const payload = {
    _id: user._id,
    phoneNumber: user?.phoneNumber,
    email: user.email,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  return token;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/user");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

export const registerController = async (req, res) => {
  try {
    upload.single("profile_image")(req, res, async (err) => {
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

        const {
          fullName, phoneNumber, email, password
        } = req.body;

        const existingUser = await User.findOne({
          $or: [{ email }, { phoneNumber }]
        });

        if (existingUser) {
          return res.status(410).json({
            message: "Email or Phone Number already in use",
          });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
          fullName,
          phoneNumber,
          email,
          profile_image: imagePath,
          password: hashPassword,
        });
        // Save new user
        const savedUser = await newUser.save();
        // Generate JWT
        const token = generateJWT(savedUser);
        // Prepare response data
        const responseData = {
          ...savedUser.toObject(),
          password: undefined, // Don't send password in response
        };

        res.status(200).json({
          status: true,
          user: responseData,
          token,
        });
      } catch (error) {
        console.log("Error creating user:", error);
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

export const passwordChangeController = async (req, res) => {
  try {
    const userId = req.userId;
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({
        status: false,
        message: "Old password and new password are required.",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Old password is incorrect.",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(new_password, salt);
    user.password = hashedNewPassword;
    await user.save();
    res.status(200).json({
      status: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email_phone, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: email_phone }, { phoneNumber: email_phone }]
    });

    if (!user) {
      return res.status(410).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(410).json({
        message: "Incorrect Email or password",
      });
    }

    const token = generateJWT(user);

    // Convert user to object and remove the password field
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "Login successful",
      user: userData, // User data without password
      token,
    });
  } catch (error) {
    console.error("Error while logging in:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const userAuthCheckController = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password'); // Exclude password from response
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User authenticated successfully',
      user,
    });
  } catch (error) {
    console.error('Error while fetching user data:', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const userProfileImageUpdateController = async (req, res) => {
  try {
    upload.single("profile_image")(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: err?.message || "Error uploading file",
          error: err.message,
        });
      }

      try {
        const userId = req.userId;
        const file = req.file;
        const newImagePath = file ? file.filename : undefined;

        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        // If a new image is uploaded, delete the old one
        if (newImagePath && user.profile_image) {
          const oldImagePath = path.join("public/images/user", user.profile_image);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }

        if (newImagePath) user.profile_image = newImagePath; // Update image only if new one is uploaded

        await user.save();
        res.status(200).json({ message: "User Profile updated successfully", profile_image: user.profile_image });

      } catch (error) {
        console.error("Error updating user profile:", error);
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

export const userUpdateController = async (req, res) => {
  try {
    upload.single("profile_image")(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: err?.message || "Error uploading file",
          error: err.message,
        });
      }
      try {
        const userId = req.userId;
        const {
          fullName, phoneNumber, email
        } = req.body;
        const file = req.file;
        const newImagePath = file ? file.filename : undefined; // Only update if a new file is uploaded

        // Find the existing category
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const existingEmailOrPhone = await User.findOne({
          _id: { $ne: userId }, // Exclude current user
          $or: [{ phoneNumber }, { email }], // Check if either phone or email exists
        });
        if (existingEmailOrPhone) {
          return res.status(410).json({ message: "Phone or Email already exists" });
        }

        if (newImagePath && user.profile_image) {
          const oldImagePath = path.join("public/images/user", user.profile_image);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }
        user.fullName = fullName || user.fullName;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.email = email || user.email;
        if (newImagePath) user.profile_image = newImagePath;
        await user.save();
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(200).json({ message: "User updated successfully", user: userResponse });
      } catch (error) {
        console.error("Error updating user:", error);
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

