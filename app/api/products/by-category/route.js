import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Product from '../../../../models/product';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    if (!categoryId) {
      return NextResponse.json({ 
        success: false,
        error: 'Category ID is required' 
      }, { status: 400 });
    }
    
    const products = await Product.find({ 
      categoryId,
    })
    
    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch products' 
    }, { status: 500 });
  }
}