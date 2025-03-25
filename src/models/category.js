// models/Category.js

import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
},{ timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
