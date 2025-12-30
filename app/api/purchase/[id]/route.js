import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Purchase from "../../../../models/purchase";
import Stock from "../../../../models/stock";
import Product from "../../../../models/product";
import Customer from "../../../../models/customer";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = awaitparams;
    const purchase = await Purchase.findById(id)
      .populate("customerId", "customerName")
      .populate({
        path: "stockEntries",
        populate: [
          { path: "categoryId", select: "categoryName" },
          { path: "productId", select: "productName" },
          { path: "godownId", select: "godownName" },
        ],
      });

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          error: "Purchase not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch purchase",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { customerId, invoice, modeOfTransport, remark, stockEntries } =
      await request.json();

    const { id } = await params;

    // Get the original purchase to compare stock entries
    const originalPurchase = await Purchase.findById(id);

    if (!originalPurchase) {
      return NextResponse.json(
        {
          success: false,
          error: "Purchase not found",
        },
        { status: 404 }
      );
    }

    // Update purchase details
    const purchase = await Purchase.findByIdAndUpdate(
      id,
      {
        customerId,
        invoice,
        modeOfTransport,
        remark,
        totalQuantity: stockEntries.reduce(
          (sum, entry) => sum + entry.quantity,
          0
        ),
      },
      { new: true, runValidators: true }
    );

    // First, revert all stock changes from the original purchase
    for (const entry of originalPurchase.stockEntries) {
      // Find the corresponding stock entry
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId,
      });

      if (stock) {
        // Decrease the stock quantity
        stock.quantity -= entry.quantity;
        await stock.save();

        // Decrease the product quantity
        await Product.findByIdAndUpdate(entry.productId, {
          $inc: { quantity: -entry.quantity },
        });
      }
    }

    // Now process the new stock entries
    const purchaseStockEntries = [];
    for (const entry of stockEntries) {
      // Check if a stock entry already exists with the same productId and godownId
      const existingStock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId,
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
          purchaseId: purchase._id,
        });

        await stock.save();
      }

      // Add to purchase stock entries
      purchaseStockEntries.push({
        productId: entry.productId,
        godownId: entry.godownId,
        categoryId: entry.categoryId,
        quantity: entry.quantity,
      });

      // Update product quantity
      await Product.findByIdAndUpdate(entry.productId, {
        $inc: { quantity: entry.quantity },
      });
    }

    // Update purchase with stock entries
    purchase.stockEntries = purchaseStockEntries;
    await purchase.save();

    // Populate the purchase data for the response
    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate("customerId", "customerName")
      .populate({
        path: "stockEntries.productId",
        select: "productName",
      })
      .populate({
        path: "stockEntries.godownId",
        select: "godownName",
      });

    return NextResponse.json({
      success: true,
      data: populatedPurchase,
      message: "Purchase updated successfully",
    });
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update purchase",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    // First, get the purchase to find all associated stock entries
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          error: "Purchase not found",
        },
        { status: 404 }
      );
    }

    // Loop through each stock entry in the purchase
    for (const entry of purchase.stockEntries) {
      // Find the corresponding stock record with the same productId and godownId
      const stock = await Stock.findOne({
        productId: entry.productId,
        godownId: entry.godownId,
      });

      if (stock) {
        // Deduct the quantity from the stock record
        stock.quantity -= entry.quantity;

        // If quantity becomes 0 or less, delete the stock record
        if (stock.quantity <= 0) {
          await Stock.findByIdAndDelete(stock._id);
        } else {
          await stock.save();
        }
      }

      // Also update the product quantity
      await Product.findByIdAndUpdate(entry.productId, {
        $inc: { quantity: -entry.quantity },
      });
    }

    // Delete the purchase
    await Purchase.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Purchase deleted and stock quantities updated successfully",
    });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete purchase",
      },
      { status: 500 }
    );
  }
}
