import mongoose from "mongoose";

const purchaseReturnSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    items: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        godownId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Goddown",
          required: true,
        },
      },
    ],
    
    modeOfTransport: {
      type: String,
      required: true,
    },
    remark: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PurchaseReturn || mongoose.model("PurchaseReturn", purchaseReturnSchema);
