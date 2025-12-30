import mongoose from "mongoose";

const stockTransferSchema = new mongoose.Schema(
  {
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
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }],
    totalItems: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.models.StockTransfer || mongoose.model("StockTransfer", stockTransferSchema);