import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Category from '../../../models/category';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = { categoryName: { $regex: search, $options: 'i' } };
    }
    
    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Category.countDocuments(query);
    
     
    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { categoryName } = await request.json();
    
    // Check if category with the same name already exists
    const existingCategory = await Category.findOne({ 
      categoryName: { $regex: `^${categoryName}$`, $options: 'i' } 
    });
    
    if (existingCategory) {
      return NextResponse.json({ 
        error: 'A category with this name already exists' 
      }, { status: 409 }); // 409 Conflict
    }
    
    const category = new Category({ categoryName });
    await category.save();
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}