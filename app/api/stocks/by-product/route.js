import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Purchase from "../../../../models/purchase";
import Stock from "../../../../models/stock";
import Godown from "../../../../models/godown";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ 
        success: false,
        error: 'Product ID is required' 
      }, { status: 400 });
    }
    
    // Find all stocks for this product
    const stocks = await Stock.find({ productId })
      .populate({
        path: 'purchaseId',
        select: 'invoice createdAt'
      })
      .populate({
        path: 'godownId',
        select: 'godownName'
      })
      .sort({ createdAt: -1 });
    
    // Group stocks by godown
    const godownsMap = {};
    stocks.forEach(stock => {
      const godownId = stock.godownId._id.toString();
      if (!godownsMap[godownId]) {
        godownsMap[godownId] = {
          godownId: stock.godownId,
          godownName: stock.godownId.godownName,
          totalQuantity: 0,
          stocks: []
        };
      }
      godownsMap[godownId].totalQuantity += stock.quantity;
    });
    
    // Convert to array and calculate overall total
    const godownsArray = Object.values(godownsMap);
    const overallTotal = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
    
    return NextResponse.json({
      success: true,
      data: {
        productId,
        godowns: godownsArray,
        overallTotal
      }
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch stocks' 
    }, { status: 500 });
  }
}