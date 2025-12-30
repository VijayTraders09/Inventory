import mongoose from "mongoose";

const sellSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    invoice: {
      type: String,
    },
    modeOfTransport: {
      type: String,
      required: true,
    },
    remark: {
      type: String,
    },
    stockEntries: [{
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
      godownId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Godown",
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 0
      }
    }],
    totalQuantity: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.models.Sell || mongoose.model("Sell", sellSchema);