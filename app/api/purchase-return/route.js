import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import PurchaseReturn from '../../../models/purchaseReturn';
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
    
    const sells = await PurchaseReturn.find(query)
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
    
    const total = await PurchaseReturn.countDocuments(query);
    
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
    
    // Create the purchaseReturn record
    const purchaseReturn = new PurchaseReturn({
      customerId,
      invoice,
      modeOfTransport,
      remark,
      stockEntries, // Directly store the stock entries as per the schema
      totalQuantity: stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
    });
    
    await purchaseReturn.save();
    
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
    
    // Populate the purchaseReturn data for the response
    await purchaseReturn.populate('customerId', 'customerName');
    await purchaseReturn.populate({
      path: 'stockEntries.productId',
      select: 'productName'
    });
    await purchaseReturn.populate({
      path: 'stockEntries.categoryId',
      select: 'categoryName'
    });
    await purchaseReturn.populate({
      path: 'stockEntries.godownId',
      select: 'godownName'
    });
    
    return NextResponse.json({
      success: true,
      data: purchaseReturn,
      message: 'PurchaseReturn created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchaseReturn:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create purchaseReturn' 
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
    
    // Find the original purchaseReturn record
    const originalSell = await PurchaseReturn.findById(id);
    if (!originalSell) {
      return NextResponse.json({ 
        success: false,
        error: 'PurchaseReturn not found' 
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
    
    // Update the purchaseReturn record
    const updatedSell = await PurchaseReturn.findByIdAndUpdate(
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
    
    // Populate the purchaseReturn data for the response
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
      message: 'PurchaseReturn updated successfully'
    });
  } catch (error) {
    console.error('Error updating purchaseReturn:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update purchaseReturn' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Find the purchaseReturn record
    const purchaseReturn = await PurchaseReturn.findById(id);
    if (!purchaseReturn) {
      return NextResponse.json({ 
        success: false,
        error: 'PurchaseReturn not found' 
      }, { status: 404 });
    }
    
    // Restore the stock quantities
    for (const entry of purchaseReturn.stockEntries) {
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
    
    // Delete the purchaseReturn record
    await PurchaseReturn.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'PurchaseReturn deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchaseReturn:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete purchaseReturn' 
    }, { status: 500 });
  }
}