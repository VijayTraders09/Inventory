// models/Goddown .js

import mongoose from "mongoose";

const goddownSchema  = new mongoose.Schema(
  {
    goddownName: { type: String, required: true },
    stock: [
          {
            productId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
              required: true,
            },
            quantity: { type: Number, required: true, default: 0 },
          },
        ],
  },
  { timestamps: true }
);

export default mongoose.models.Goddown  || mongoose.model("Goddown", goddownSchema );
