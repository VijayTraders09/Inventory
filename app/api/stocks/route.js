import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Product from "../../../models/product";
import Stock from "../../../models/stock";
import Category from "../../../models/category";

export async function GET(request) {
  try {
    await connectDB();

    // Find all stocks
    const stocks = await Stock.find()
      .populate({
        path: "productId",
        select: "productName",
      })
      .populate({
        path: "categoryId",
        select: "categoryName",
      });

    // Find stocks with null categoryId
    const stocksWithNullCategory = stocks.filter(
      (stock) => !stock.categoryId?._id,
    );

    // Use Promise.all to wait for all async operations to complete
    const res = await Promise.all(
      stocksWithNullCategory.map(async (stock) => {
        // Use findById instead of find for a single product
        const product = await Product.findById(stock?.productId?._id);

        // Create a copy of the stock object and add the categoryName
        return {
          ...stock.toObject(), // Convert Mongoose document to plain object
          categoryName: product?.categoryId ? product.categoryId : null,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: res,
    });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stocks",
      },
      { status: 500 },
    );
  }
}
