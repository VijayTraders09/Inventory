// models/Product.js

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: [
      {
        godownId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Goddown",
          required: true,
        },
        quantity: { type: Number, required: true, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
