import mongoose from "mongoose";

const productExchangeSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    fromProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    toProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    fromGodownId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Godown",
      required: true,
    },
    toGodownId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Godown",
      required: true,
    },
    remark: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.ProductExchange ||
  mongoose.model("ProductExchange", productExchangeSchema);
