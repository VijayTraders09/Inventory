import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ProductExchange from "../../../models/productExchange.";
import Stock from "../../../models/stock";
import product from "../../../models/product";
import godown from "../../../models/godown";
import category from "../../../models/category";

// GET all exchanges
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search
      ? { remark: { $regex: search, $options: "i" } }
      : {};

    const exchanges = await ProductExchange.find(searchQuery)
      .populate("categoryId", "categoryName")
      .populate("fromProductId", "productName")
      .populate("toProductId", "productName")
      .populate("fromGodownId", "godownName")
      .populate("toGodownId", "godownName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProductExchange.countDocuments(searchQuery);

    return NextResponse.json({
      success: true,
      data: exchanges,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching product exchanges:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch product exchanges",
    }, { status: 500 });
  }
}

// POST a new exchange
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      categoryId,
      fromProductId,
      toProductId,
      fromGodownId,
      toGodownId,
      quantity,
      remark,
    } = body;

    // Start a Mongoose transaction for atomicity
    const session = await ProductExchange.startSession();
    session.startTransaction();

    try {
      // 1. Find and decrement source stock
      const sourceStock = await Stock.findOne({
        productId: fromProductId,
        godownId: fromGodownId,
      }).session(session);

      if (!sourceStock || sourceStock.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({
          success: false,
          error: "Insufficient stock in the source godown.",
        }, { status: 400 });
      }

      sourceStock.quantity -= quantity;
      await sourceStock.save({ session });

      // 2. Find and increment target stock (or create it if it doesn't exist)
      let targetStock = await Stock.findOne({
        productId: toProductId,
        godownId: toGodownId,
      }).session(session);

      if (!targetStock) {
        targetStock = new Stock({
          categoryId,
          productId: toProductId,
          godownId: toGodownId,
          quantity: 0,
        });
      }

      targetStock.quantity += quantity;
      await targetStock.save({ session });

      // 3. Create the exchange record
      const newExchange = new ProductExchange({
        categoryId,
        fromProductId,
        toProductId,
        fromGodownId,
        toGodownId,
        quantity,
        remark,
      });

      await newExchange.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Populate the response data
      await newExchange.populate([
        { path: "categoryId", select: "categoryName" },
        { path: "fromProductId", select: "productName" },
        { path: "toProductId", select: "productName" },
        { path: "fromGodownId", select: "godownName" },
        { path: "toGodownId", select: "godownName" },
      ]);

      return NextResponse.json({
        success: true,
        data: newExchange,
        message: "Product exchange completed successfully!",
      }, { status: 201 });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error during product exchange:', error);
    return NextResponse.json({
      success: false,
      error: "An error occurred during the exchange.",
    }, { status: 500 });
  }
}

// DELETE an exchange
export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const exchangeId = searchParams.get('id');
    
    if (!exchangeId) {
      return NextResponse.json({
        success: false,
        error: "Exchange ID is required",
      }, { status: 400 });
    }

    // Find the exchange record first
    const exchange = await ProductExchange.findById(exchangeId);
    
    if (!exchange) {
      return NextResponse.json({
        success: false,
        error: "Exchange not found",
      }, { status: 404 });
    }

    // Start a Mongoose transaction for atomicity
    const session = await ProductExchange.startSession();
    session.startTransaction();

    try {
      // 1. Find and increment source stock (reverse the deduction)
      const sourceStock = await Stock.findOne({
        productId: exchange.fromProductId,
        godownId: exchange.fromGodownId,
      }).session(session);

      if (!sourceStock) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({
          success: false,
          error: "Source stock record not found. Cannot reverse the exchange.",
        }, { status: 400 });
      }

      sourceStock.quantity += exchange.quantity;
      await sourceStock.save({ session });

      // 2. Find and decrement target stock (reverse the addition)
      const targetStock = await Stock.findOne({
        productId: exchange.toProductId,
        godownId: exchange.toGodownId,
      }).session(session);

      if (!targetStock) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({
          success: false,
          error: "Target stock record not found. Cannot reverse the exchange.",
        }, { status: 400 });
      }

      if (targetStock.quantity < exchange.quantity) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({
          success: false,
          error: "Insufficient stock in the target godown to reverse the exchange.",
        }, { status: 400 });
      }

      targetStock.quantity -= exchange.quantity;
      await targetStock.save({ session });

      // 3. Delete the exchange record
      await ProductExchange.findByIdAndDelete(exchangeId).session(session);

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return NextResponse.json({
        success: true,
        message: "Product exchange deleted and stock reversed successfully!",
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting product exchange:', error);
    return NextResponse.json({
      success: false,
      error: "An error occurred while deleting the exchange.",
    }, { status: 500 });
  }
}