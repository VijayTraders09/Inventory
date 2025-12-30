import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import StockTransfer from "../../../models/stockTransfer";
import Stock from "../../../models/stock";
import Godown from "../../../models/godown";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const fromGodownId = searchParams.get('fromGodownId');
    const toGodownId = searchParams.get('toGodownId');

    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = { 
        $or: [
          { remark: { $regex: search, $options: 'i' } },
        ]
      };
    }
    
    if (fromGodownId) {
      query.fromGodownId = fromGodownId;
    }
    
    if (toGodownId) {
      query.toGodownId = toGodownId;
    }
    
    const transfers = await StockTransfer.find(query)
      .populate('fromGodownId', 'godownName')
      .populate('toGodownId', 'godownName')
      .populate({
        path: 'items',
        populate: [
          { path: 'categoryId', select: 'categoryName' },
          { path: 'productId', select: 'productName' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await StockTransfer.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: transfers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching stock transfers:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch stock transfers' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { 
      fromGodownId, 
      toGodownId, 
      transferredBy,
      remark,
      items 
    } = await request.json();
    
    // Validate required fields
    if (!fromGodownId || !toGodownId || !items || items.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Check if source and destination godowns are different
    if (fromGodownId === toGodownId) {
      return NextResponse.json({ 
        success: false,
        error: 'Source and destination godowns cannot be the same' 
      }, { status: 400 });
    }
    
    // Check if all items have sufficient stock in the source godown
    for (const item of items) {
      const stock = await Stock.findOne({
        productId: item.productId,
        godownId: fromGodownId
      });
      
      if (!stock || stock.quantity < item.quantity) {
        return NextResponse.json({ 
          success: false,
          error: `Insufficient stock for item in source godown` 
        }, { status: 400 });
      }
    }
    
    // Create the stock transfer record
    const transfer = new StockTransfer({
      fromGodownId,
      toGodownId,
      remark,
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0)
    });
    
    await transfer.save();
    
    // Process the stock transfer
    for (const item of items) {
      // Deduct from source godown
      const sourceStock = await Stock.findOne({
        productId: item.productId,
        godownId: fromGodownId
      });
      
      if (sourceStock) {
        sourceStock.quantity -= item.quantity;
        
        // If stock becomes 0, delete the record
        if (sourceStock.quantity <= 0) {
          await Stock.findByIdAndDelete(sourceStock._id);
        } else {
          await sourceStock.save();
        }
      }
      
      // Add to destination godown
      const destStock = await Stock.findOne({
        productId: item.productId,
        godownId: toGodownId
      });
      
      if (destStock) {
        // Update existing stock
        destStock.quantity += item.quantity;
        await destStock.save();
      } else {
        // Create new stock record
        const newStock = new Stock({
          categoryId: item.categoryId,
          productId: item.productId,
          godownId: toGodownId,
          quantity: item.quantity
        });
        await newStock.save();
      }
    }
    
    // Populate the transfer data for the response
    await transfer.populate('fromGodownId', 'godownName');
    await transfer.populate('toGodownId', 'godownName');
    await transfer.populate({
      path: 'items',
      populate: [
        { path: 'categoryId', select: 'categoryName' },
        { path: 'productId', select: 'productName' }
      ]
    });
    
    return NextResponse.json({
      success: true,
      data: transfer,
      message: 'Stock transferred successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating stock transfer:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create stock transfer' 
    }, { status: 500 });
  }
}