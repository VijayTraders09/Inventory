import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Stock from "../../../../models/stock";

export async function GET(request) {
  try {
    await connectDB();
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const godownId = searchParams.get("godownId");
    const quantityParam = searchParams.get("quantity");
    
    // Validate required parameters
    if (!productId || !godownId || !quantityParam) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing required parameters: productId, godownId, and quantity are required" 
        },
        { status: 400 }
      );
    }
    
    // Parse and validate quantity
    const requiredQuantity = parseInt(quantityParam, 10);
    if (isNaN(requiredQuantity) || requiredQuantity <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid quantity. Must be a positive number." 
        },
        { status: 400 }
      );
    }
    
    // Find the stock record for the given product and godown
    const stock = await Stock.findOne({
      productId: productId,
      godownId: godownId
    });
    
    let response;
    
    if (stock) {
      // Stock record exists, check if quantity is sufficient
      const availableQuantity = stock.quantity;
      const available = availableQuantity >= requiredQuantity;
      const shortage = available ? 0 : requiredQuantity - availableQuantity;
      
      response = {
        available,
        availableQuantity,
        requiredQuantity,
        shortage
      };
    } else {
      // No stock record exists for this product in this godown
      response = {
        available: false,
        availableQuantity: 0,
        requiredQuantity,
        shortage: requiredQuantity
      };
    }
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error("Error checking stock availability:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to check stock availability" 
      },
      { status: 500 }
    );
  }
}