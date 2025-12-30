import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Purchase from '../../../models/purchase';
import Stock from '../../../models/stock';
import Product from '../../../models/product';
import Customer from '../../../models/customer';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = { 
        $or: [
          { invoice: { $regex: search, $options: 'i' } },
          { modeOfTransport: { $regex: search, $options: 'i' } },
          { remark: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const purchases = await Purchase.find(query)
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
    
    const total = await Purchase.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: purchases,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch purchases' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { 
      customerId, 
      invoice, 
      modeOfTransport, 
      remark, 
      stockEntries 
    } = await request.json();
    
    // Validate required fields
    if (!customerId || !modeOfTransport || !stockEntries || stockEntries.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Create the purchase record first
    const purchase = new Purchase({
      customerId,
      invoice,
      modeOfTransport,
      remark,
      totalQuantity: stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
    });
    
    await purchase.save();
    
    // Create or update stock entries and update product quantities
    const purchaseStockEntries = [];
    for (const entry of stockEntries) {
      // Check if a stock entry already exists with the same productId and godownId
      const existingStock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (existingStock) {
        // Update existing stock quantity
        existingStock.quantity += entry.quantity;
        await existingStock.save();
      } else {
        // Create new stock entry
        const stock = new Stock({
          categoryId: entry.categoryId,
          productId: entry.productId,
          godownId: entry.godownId,
          quantity: entry.quantity,
          purchaseId: purchase._id
        });
        
        await stock.save();
      }
      
      // Add to purchase stock entries
      purchaseStockEntries.push({
        productId: entry.productId,
        godownId: entry.godownId,
        categoryId: entry.categoryId,
        quantity: entry.quantity
      });
      
      // Update product quantity
      await Product.findByIdAndUpdate(
        entry.productId,
        { $inc: { quantity: entry.quantity } }
      );
    }
    
    // Update purchase with stock entries
    purchase.stockEntries = purchaseStockEntries;
    await purchase.save();
    
    // Populate the purchase data for the response
    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('customerId', 'customerName')
      .populate({
        path: 'stockEntries.productId',
        select: 'productName'
      })
      .populate({
        path: 'stockEntries.godownId',
        select: 'godownName'
      });
    
    return NextResponse.json({
      success: true,
      data: populatedPurchase,
      message: 'Purchase created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create purchase' 
    }, { status: 500 });
  }
}

