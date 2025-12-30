import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Product from '../../../models/product';
import Category from '../../../models/category';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    const products = await Product.find(query)
      .populate('categoryId', 'categoryName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    
    return NextResponse.json({
      data: products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { productName, categoryId, quantity } = await request.json();
    
    // Check if the category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Check if a product with the same name already exists in the same category
    const existingProduct = await Product.findOne({ 
      productName: { $regex: `^${productName}$`, $options: 'i' },
      categoryId
    });
    
    if (existingProduct) {
      return NextResponse.json({ 
        error: 'A product with this name already exists in this category' 
      }, { status: 409 });
    }
    
    const product = new Product({ productName, categoryId, quantity });
    await product.save();
    
    // Populate the category information before returning
    await product.populate('categoryId', 'categoryName');
    
    return NextResponse.json({ success: true, message: "Product added successfully" },
      { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}