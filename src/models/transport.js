// models/Transport .js

import mongoose from "mongoose";

const transportSchema  = new mongoose.Schema(
  {
    transport: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Transport  || mongoose.model("Transport", transportSchema );
