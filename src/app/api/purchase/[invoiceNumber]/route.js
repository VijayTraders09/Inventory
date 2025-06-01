import connect from "@/lib/db";
import Goddown from "@/models/goddown";
import Product from "@/models/product";
import Purchases from "@/models/purchases";
import Seller from "@/models/seller";
import Category from "@/models/category";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connect(); // Ensure the connection is established
    const { invoiceNumber } = params;
    const purchase = await Purchases.find({ invoiceNumber })
      .populate("sellerId") // Populate seller details
      .populate("godownId") // Populate godown details
      .populate({
        path: "items.productId", // Populate product details inside items array
      })
      .populate({
        path: "items.categoryId", // Populate category details inside items array
      }).sort({ createdAt: -1 });
    if (purchase?.length)
      return NextResponse.json(
        {
          data: purchase,
          success: true,
          message: "purchased  Fetched",
        },
        { status: 200 }
      );
    return NextResponse.json(
      {
        data: [],
        success: true,
        message: "purchased not found",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error: "Error retrieving purchased ",
      status: 500,
    });
  }
}
