import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Sell from '../../../models/sell';
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
    
    const sells = await Sell.find(query)
      .populate('customerId', 'customerName')
      .populate({
        path: 'stockEntries.productId',
        select: 'productName'
      })
      .populate({
        path: 'stockEntries.categoryId',
        select: 'categoryName'
      })
      .populate({
        path: 'stockEntries.godownId',
        select: 'godownName'
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
    console.error('Error fetching sells:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch sells' 
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
    
    // Check if all stock entries have sufficient stock
    for (const entry of stockEntries) {
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (!stock || stock.quantity < entry.quantity) {
        return NextResponse.json({ 
          success: false,
          error: `Insufficient stock for product in godown` 
        }, { status: 400 });
      }
    }
    
    // Create the sell record
    const sell = new Sell({
      customerId,
      invoice,
      modeOfTransport,
      remark,
      stockEntries, // Directly store the stock entries as per the schema
      totalQuantity: stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
    });
    
    await sell.save();
    
    // Update stock entries and product quantities
    for (const entry of stockEntries) {
      // Find and update the stock entry
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (stock) {
        // Deduct the quantity from stock
        stock.quantity -= entry.quantity;
        
        // If stock becomes 0, we can choose to delete it or keep it with 0 quantity
        if (stock.quantity <= 0) {
          await Stock.findByIdAndDelete(stock._id);
        } else {
          await stock.save();
        }
      }
      
      // Update product quantity (decrease it)
      await Product.findByIdAndUpdate(
        entry.productId,
        { 
          $inc: { 
            quantity: -entry.quantity,
            sold: entry.quantity // Increment the sold count
          } 
        }
      );
    }
    
    // Populate the sell data for the response
    await sell.populate('customerId', 'customerName');
    await sell.populate({
      path: 'stockEntries.productId',
      select: 'productName'
    });
    await sell.populate({
      path: 'stockEntries.categoryId',
      select: 'categoryName'
    });
    await sell.populate({
      path: 'stockEntries.godownId',
      select: 'godownName'
    });
    
    return NextResponse.json({
      success: true,
      data: sell,
      message: 'Sell created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sell:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create sell' 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { 
      customerId, 
      invoice, 
      modeOfTransport, 
      remark, 
      stockEntries 
    } = await request.json();
    
    // Find the original sell record
    const originalSell = await Sell.findById(id);
    if (!originalSell) {
      return NextResponse.json({ 
        success: false,
        error: 'Sell not found' 
      }, { status: 404 });
    }
    
    // Validate required fields
    if (!customerId || !modeOfTransport || !stockEntries || stockEntries.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Restore the original stock quantities
    for (const entry of originalSell.stockEntries) {
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (stock) {
        stock.quantity += entry.quantity;
        await stock.save();
      } else {
        // If stock was deleted, recreate it
        const newStock = new Stock({
          productId: entry.productId,
          godownId: entry.godownId,
          quantity: entry.quantity
        });
        await newStock.save();
      }
      
      // Update product quantity (restore it)
      await Product.findByIdAndUpdate(
        entry.productId,
        { 
          $inc: { 
            quantity: entry.quantity,
            sold: -entry.quantity // Decrement the sold count
          } 
        }
      );
    }
    
    // Check if all new stock entries have sufficient stock
    for (const entry of stockEntries) {
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (!stock || stock.quantity < entry.quantity) {
        return NextResponse.json({ 
          success: false,
          error: `Insufficient stock for product in godown` 
        }, { status: 400 });
      }
    }
    
    // Update the sell record
    const updatedSell = await Sell.findByIdAndUpdate(
      id,
      {
        customerId,
        invoice,
        modeOfTransport,
        remark,
        stockEntries,
        totalQuantity: stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
      },
      { new: true }
    );
    
    // Update stock entries and product quantities for the new data
    for (const entry of stockEntries) {
      // Find and update the stock entry
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (stock) {
        // Deduct the quantity from stock
        stock.quantity -= entry.quantity;
        
        // If stock becomes 0, we can choose to delete it or keep it with 0 quantity
        if (stock.quantity <= 0) {
          await Stock.findByIdAndDelete(stock._id);
        } else {
          await stock.save();
        }
      }
      
      // Update product quantity (decrease it)
      await Product.findByIdAndUpdate(
        entry.productId,
        { 
          $inc: { 
            quantity: -entry.quantity,
            sold: entry.quantity // Increment the sold count
          } 
        }
      );
    }
    
    // Populate the sell data for the response
    await updatedSell.populate('customerId', 'customerName');
    await updatedSell.populate({
      path: 'stockEntries.productId',
      select: 'productName'
    });
    await updatedSell.populate({
      path: 'stockEntries.categoryId',
      select: 'categoryName'
    });
    await updatedSell.populate({
      path: 'stockEntries.godownId',
      select: 'godownName'
    });
    
    return NextResponse.json({
      success: true,
      data: updatedSell,
      message: 'Sell updated successfully'
    });
  } catch (error) {
    console.error('Error updating sell:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update sell' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Find the sell record
    const sell = await Sell.findById(id);
    if (!sell) {
      return NextResponse.json({ 
        success: false,
        error: 'Sell not found' 
      }, { status: 404 });
    }
    
    // Restore the stock quantities
    for (const entry of sell.stockEntries) {
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (stock) {
        stock.quantity += entry.quantity;
        await stock.save();
      } else {
        // If stock was deleted, recreate it
        const newStock = new Stock({
          productId: entry.productId,
          godownId: entry.godownId,
          quantity: entry.quantity
        });
        await newStock.save();
      }
      
      // Update product quantity (restore it)
      await Product.findByIdAndUpdate(
        entry.productId,
        { 
          $inc: { 
            quantity: entry.quantity,
            sold: -entry.quantity // Decrement the sold count
          } 
        }
      );
    }
    
    // Delete the sell record
    await Sell.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Sell deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sell:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete sell' 
    }, { status: 500 });
  }
}