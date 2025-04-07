import connect from "@/lib/db";
import Goddown from "@/models/goddown";
import Product from "@/models/product";
import Purchases from "@/models/purchases";
import Seller from "@/models/seller";
import Category from "@/models/category";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect(); // Ensure the connection is established
    const sales = await Purchases.find({})
      .populate("sellerId") // Populate seller details
      .populate({
        path: "items.productId", // Populate product details inside items array
      })
      .populate({
        path: "items.categoryId", // Populate category details inside items array
      })
      .populate({
        path: "items.godownId", // Populate godown details inside items array
      });
    return NextResponse.json(
      {
        data: sales,
        success: true,
        message: "purchased  Fetched",
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


export async function POST(req) {
  try {
    await connect();
    const {
      invoiceNumber,
      sellerId,
      items,
      id,
      modeOfTransport,
      remark,
    } = await req.json();
console.log(items)
    // Validate the input
    if (
      ( !sellerId || !items || items.length === 0,
      !modeOfTransport)
    ) {
      return NextResponse.json({
        message: " Seller ID, and Items are required",
        status: 400,
      });
    }

    // Handle Create: Create a new sale
    const newSale = new Purchases({ invoiceNumber, sellerId, items,modeOfTransport,remark });
    await newSale.save();

    // Loop through the items to update the products and godown
    for (let item of items) {
      const product = await Product.findById(item.productId);
      const godown = await Goddown.findById(item?.godownId);
      
      // Update the quantity in the product
      if (product) {
        const quantityIndex = product.quantity.findIndex(
          (entry) => entry.godownId.toString() === godown._id.toString()
        );
        if (quantityIndex !== -1) {
          product.quantity[quantityIndex].quantity += item.quantity;
        } else {
          product.quantity.push({
            godownId: godown._id,
            quantity: item.quantity,
          });
        }
        await product.save();
      }

      // Update godown stock
      if (godown) {
        const godownStock = godown.stock.findIndex(
          (entry) => entry.productId.toString() === item.productId.toString()
        );
        if (godownStock !== -1) {
          godown.stock[godownStock].quantity += item.quantity;
        } else {
          godown.stock.push({
            productId: item.productId,
            quantity: item.quantity,
          });
        }
        await godown.save();
      }
    }

    return NextResponse.json(
      { success: true, message: "Purchase Created", data: newSale },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error handling sale:", error);
    return NextResponse.json(
      { success: false, message: "Error handling sale", error: error.message },
      { status: 500 }
    );
  }
}
