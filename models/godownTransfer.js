import mongoose from "mongoose";

const GodownTransferSchema = new mongoose.Schema(
  {
    fromGodown: { type: mongoose.Schema.Types.ObjectId, ref: "Goddown", required: true },
    toGodown: { type: mongoose.Schema.Types.ObjectId, ref: "Goddown", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },

    remarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.GodownTransfer ||
  mongoose.model("GodownTransfer", GodownTransferSchema);
