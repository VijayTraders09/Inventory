import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Sell from "../../../../models/sell";
import Stock from "../../../../models/stock";
import Product from "../../../../models/product";
import Customer from '../../../../models/customer';


export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const sell = await Sell.findById(id)
      .populate("customerId", "customerName")
      .populate({
        path: "stockEntries.productId",
        select: "productName"
      })
      .populate({
        path: "stockEntries.categoryId",
        select: "categoryName"
      })
      .populate({
        path: "stockEntries.godownId",
        select: "godownName"
      });

    if (!sell) {
      return NextResponse.json(
        {
          success: false,
          error: "Sell not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sell,
    });
  } catch (error) {
    console.error("Error fetching sell:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sell",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { 
      customerId, 
      invoice, 
      modeOfTransport, 
      remark,
      stockEntries 
    } = await request.json();
    
    const { id } = await params;
    
    // Get the original sell to compare stock entries
    const originalSell = await Sell.findById(id);
    
    if (!originalSell) {
      return NextResponse.json({ 
        success: false,
        error: 'Sell not found' 
      }, { status: 404 });
    }
    
    // First, restore all original stock quantities (reverse the original sale)
    for (const entry of originalSell.stockEntries) {
      // Find the corresponding stock entry
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (stock) {
        // Add back the quantity to stock
        stock.quantity += entry.quantity;
        await stock.save();
      } else {
        // If no stock record exists, create one with the returned quantity
        const newStock = new Stock({
          categoryId: entry.categoryId,
          productId: entry.productId,
          godownId: entry.godownId,
          quantity: entry.quantity
        });
        await newStock.save();
      }
      
      // Update product quantity (add back the sold quantity)
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
          error: `Insufficient stock for product in godown. Available: ${stock ? stock.quantity : 0}, Required: ${entry.quantity}` 
        }, { status: 400 });
      }
    }
    
    // Update sell details
    const sell = await Sell.findByIdAndUpdate(
      id,
      { 
        customerId, 
        invoice, 
        modeOfTransport, 
        remark,
        stockEntries,
        totalQuantity: stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
      },
      { new: true, runValidators: true }
    );
    
    // Now process the new stock entries (deduct from stock)
    for (const entry of stockEntries) {
      // Find the corresponding stock entry
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (stock) {
        // Deduct the quantity from stock
        stock.quantity -= entry.quantity;
        
        // If stock becomes 0, delete the stock record
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
    
    // First, get the sell to find all associated stock entries
    const sell = await Sell.findById(id);
    if (!sell) {
      return NextResponse.json(
        {
          success: false,
          error: "Sell not found",
        },
        { status: 404 }
      );
    }

    // Restore stock quantities for each item in the sell
    for (const entry of sell.stockEntries) {
      // Find the corresponding stock entry
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId
      });
      
      if (stock) {
        // Add back the quantity to stock
        stock.quantity += entry.quantity;
        await stock.save();
      } else {
        // If no stock record exists, create one with the returned quantity
        const newStock = new Stock({
          categoryId: entry.categoryId,
          productId: entry.productId,
          godownId: entry.godownId,
          quantity: entry.quantity
        });
        await newStock.save();
      }
      
      // Update product quantity (add back the sold quantity)
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
    
    // Delete the sell
    await Sell.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Sell deleted and stock quantities restored successfully",
    });
  } catch (error) {
    console.error("Error deleting sell:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete sell",
      },
      { status: 500 }
    );
  }
}