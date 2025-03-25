// models/Seller.js

import mongoose from "mongoose";

const SellerSchema = new mongoose.Schema(
  {
    sellerName: { type: String, required: true },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true, // Ensures uniqueness in the database
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'], // Regex for Indian numbers
        validate: {
          validator: function (value) {
            return /^[0-9]{10}$/.test(value); // Ensures exactly 10 digits
          },
          message: 'Mobile number must be exactly 10 digits'
        }
      }
  },
 
  { timestamps: true }
);

export default mongoose.models.Seller || mongoose.model("Seller", SellerSchema);
