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
    
    // 1. Fetch all godowns from the database
    const allGodowns = await Godown.find({}).sort({ godownName: 1 });

    // 2. Find all stocks for this product
    const stocks = await Stock.find({ productId })
      .populate({
        path: 'godownId',
        select: 'godownName'
      });
    
    // 3. Create a map to quickly find total stock quantity for each godown
    const stockQuantitiesByGodown = {};
    stocks.forEach(stock => {
      const godownId = stock.godownId._id.toString();
      stockQuantitiesByGodown[godownId] = (stockQuantitiesByGodown[godownId] || 0) + stock.quantity;
    });
    
    // 4. Build the final array by iterating through ALL godowns
    const godownsArray = allGodowns.map(godown => {
      const godownIdStr = godown._id.toString();
      return {
        godownId: godown._id,
        godownName: godown.godownName,
        totalQuantity: stockQuantitiesByGodown[godownIdStr] || 0,
        stocks: [] 
      };
    });
    
    // 5. *** NEW: Sort the array by stock count in descending order ***
    godownsArray.sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    // 6. Calculate the overall total from the sorted array
    const overallTotal = godownsArray.reduce((sum, godown) => sum + godown.totalQuantity, 0);
    
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