import { NextResponse } from 'next/server';
import Product from '../../../../models/product';
import Category from '../../../../models/category';
import connectDB from '../../../../lib/db';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const product = await Product.findById(params.id).populate('categoryId', 'categoryName');
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { productName, categoryId, quantity } = await request.json();
    const {id} = await params
    // Check if the category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Check if another product with the same name already exists in the same category
    const existingProduct = await Product.findOne({ 
      productName: { $regex: `^${productName}$`, $options: 'i' },
      categoryId,
      _id: { $ne: id }
    });
    
    if (existingProduct) {
      return NextResponse.json({ 
        error: 'A product with this name already exists in this category' 
      }, { status: 409 });
    }
    
    const product = await Product.findByIdAndUpdate(
      id,
      { productName, categoryId, quantity },
      { new: true }
    ).populate('categoryId', 'categoryName');
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: "Product updated successfully" },
      { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const {id} = await params
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: "Product deleted successfully" },
      { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}