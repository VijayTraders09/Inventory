import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Sell from '../../../../models/sell';
import Stock from '../../../../models/stock';
import Product from '../../../../models/product';
import Customer from '../../../../models/customer';
import Category from '../../../../models/category';
import Godown from '../../../../models/godown';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId');

    // Validate customerId
    if (!customerId) {
      return NextResponse.json({ 
        success: false,
        error: 'Customer ID is required' 
      }, { status: 400 });
    }

    const skip = (page - 1) * limit;
    
    // Build query for sells by customer
    let query = { customerId };
    
    // Add search conditions if search term is provided
    if (search) {
      query = { 
        customerId,
        $or: [
          { invoice: { $regex: search, $options: 'i' } },
          { modeOfTransport: { $regex: search, $options: 'i' } },
          { remark: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const sells = await Sell.find(query)
      .populate('customerId', 'customerName')
      .populate({
        path: 'stockEntries',
        populate: [
          { path: 'categoryId', select: 'categoryName' },
          { path: 'productId', select: 'productName' },
          { path: 'godownId', select: 'godownName' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Sell.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: sells,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sells by customer:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch sells by customer' 
    }, { status: 500 });
  }
}