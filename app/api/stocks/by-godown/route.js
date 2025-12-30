import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Stock from "../../../../models/stock";

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
      .populate({
        path: 'productId',
        select: 'productName'
      })
      .populate({
        path: 'categoryId',
        select: 'categoryName'
      })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    console.error('Error fetching stocks by godown:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch stocks' 
    }, { status: 500 });
  }
}