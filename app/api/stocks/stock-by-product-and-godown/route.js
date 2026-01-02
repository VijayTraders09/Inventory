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
    const productId = searchParams.get('productId');
    const godownId = searchParams.get('godownId');
    
    if (!productId || !godownId) {
      return NextResponse.json({ 
        success: false,
        error: 'Product ID and Godown ID are required' 
      }, { status: 400 });
    }
    
    const stock = await Stock.findOne({
      productId,
      godownId,
    })
      .populate("productId", "productName")
      .populate("godownId", "godownName")
      .populate("categoryId", "categoryName");
    
    if (!stock) {
      return NextResponse.json({
        success: false,
        error: "Stock not found",
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch stock' 
    }, { status: 500 });
  }
}