import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
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

export default mongoose.models.Sale || mongoose.model("Sale", saleSchema);
