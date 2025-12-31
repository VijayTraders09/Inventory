import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import SellReturn from "../../../../models/sellReturn";
import Stock from "../../../../models/stock";
import Product from "../../../../models/product";
import Customer from "../../../../models/customer";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = awaitparams;
    const sellReturn = await SellReturn.findById(id)
      .populate("customerId", "customerName")
      .populate({
        path: "stockEntries",
        populate: [
          { path: "categoryId", select: "categoryName" },
          { path: "productId", select: "productName" },
          { path: "godownId", select: "godownName" },
        ],
      });

    if (!sellReturn) {
      return NextResponse.json(
        {
          success: false,
          error: "SellReturn not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sellReturn,
    });
  } catch (error) {
    console.error("Error fetching sellReturn:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sellReturn",
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

    // Get the original sellReturn to compare stock entries
    const originalPurchase = await SellReturn.findById(id);

    if (!originalPurchase) {
      return NextResponse.json(
        {
          success: false,
          error: "SellReturn not found",
        },
        { status: 404 }
      );
    }

    // Update sellReturn details
    const sellReturn = await SellReturn.findByIdAndUpdate(
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

    // First, revert all stock changes from the original sellReturn
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
          purchaseId: sellReturn._id,
        });

        await stock.save();
      }

      // Add to sellReturn stock entries
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

    // Update sellReturn with stock entries
    sellReturn.stockEntries = purchaseStockEntries;
    await sellReturn.save();

    // Populate the sellReturn data for the response
    const populatedPurchase = await SellReturn.findById(sellReturn._id)
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
      message: "SellReturn updated successfully",
    });
  } catch (error) {
    console.error("Error updating sellReturn:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update sellReturn",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    // First, get the sellReturn to find all associated stock entries
    const sellReturn = await SellReturn.findById(id);
    if (!sellReturn) {
      return NextResponse.json(
        {
          success: false,
          error: "SellReturn not found",
        },
        { status: 404 }
      );
    }

    // Loop through each stock entry in the sellReturn
    for (const entry of sellReturn.stockEntries) {
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

    // Delete the sellReturn
    await SellReturn.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "SellReturn deleted and stock quantities updated successfully",
    });
  } catch (error) {
    console.error("Error deleting sellReturn:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete sellReturn",
      },
      { status: 500 }
    );
  }
}
