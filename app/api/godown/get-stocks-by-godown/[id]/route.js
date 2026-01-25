import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Stock from "../../../../../models/stock";
import Product from "../../../../../models/product";
import Category from "../../../../../models/category";
import Godown from "../../../../../models/godown";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    // Fix 1: Get godownId from params, not searchParams
    // Fix 2: Remove parseInt() as ObjectId is a string
    const {id } = await params;

    // Fix 3: Validate that the godown exists
    const godown = await Godown.findById(id);
    if (!godown) {
      return NextResponse.json({ 
        success: false,
        error: 'Godown not found' 
      }, { status: 404 });
    }

    const skip = (page - 1) * limit;
    
    let query = { godownId:id };
    
    if (search) {
      // First find product IDs that match the search
      const products = await Product.find({
        productName: { $regex: search, $options: 'i' }
      }).select('_id');
      
      const productIds = products.map(p => p._id);
      query.productId = { $in: productIds };
    }
    
    const stocks = await Stock.find(query)
      .populate({
        path: 'productId',
        select: 'productName'
      })
      .populate({
        path: 'categoryId',
        select: 'categoryName'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Transform the data for the grid
    const transformedStocks = stocks.map(stock => ({
      _id: stock._id,
      productName: stock.productId?.productName || 'Unknown Product',
      categoryName: stock.categoryId?.categoryName || 'Unknown Category',
      quantity: stock.quantity
    }));
    
    const total = await Stock.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: transformedStocks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching stocks for godown:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch stocks for godown' 
    }, { status: 500 });
  }
}