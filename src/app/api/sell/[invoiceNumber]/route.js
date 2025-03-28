import connect from "@/lib/db";
import Goddown from "@/models/goddown";
import Product from "@/models/product";
import Sales from "@/models/sales";
import Buyer from "@/models/buyer";
import Category from "@/models/category";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connect(); // Ensure the connection is established
    const { invoiceNumber } = params;
    const sale = await Sales.find({ invoiceNumber })
      .populate("buyerId") // Populate seller details
      .populate("godownId") // Populate godown details
      .populate({
        path: "items.productId", // Populate product details inside items array
      })
      .populate({
        path: "items.categoryId", // Populate category details inside items array
      });
    if (sale?.length)
      return NextResponse.json(
        {
          data: sale,
          success: true,
          message: "Sales Fetched",
        },
        { status: 200 }
      );
    return NextResponse.json(
      {
        data: [],
        success: true,
        message: "Sales not found",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error: "Error retrieving Sales ",
      status: 500,
    });
  }
}
