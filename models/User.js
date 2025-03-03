import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userModel = new Schema({
  fullName: { type: String, required: true },
  profile_image: { type: String },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pushToken: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', userModel);

export default User;
