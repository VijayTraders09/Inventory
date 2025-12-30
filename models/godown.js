import mongoose from "mongoose";

const godownSchema = new mongoose.Schema(
  {
    godownName: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Godown || mongoose.model("Godown", godownSchema);