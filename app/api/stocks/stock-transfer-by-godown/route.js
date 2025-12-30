import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stock from "../../../../models/stock";
import Category from "../../../../models/category";
import Product from "../../../../models/product";
import Godown from "../../../../models/godown";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const godownId = searchParams.get('godownId');
    
    if (!godownId) {
      return NextResponse.json({ 
        success: false,
        error: 'Godown ID is required' 
      }, { status: 400 });
    }
    
    const stocks = await Stock.find({ godownId })
      .populate('productId', 'productName')
      .populate('categoryId', 'categoryName')
      .populate('godownId', 'godownName')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch stocks' 
    }, { status: 500 });
  }
}