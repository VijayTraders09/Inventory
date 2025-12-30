// models/Category.js

import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
},{ timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
