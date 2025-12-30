import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model("Customer", customerSchema);