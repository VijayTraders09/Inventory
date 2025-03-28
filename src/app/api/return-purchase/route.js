import connect from "@/lib/db";
import Goddown from "@/models/goddown";
import Product from "@/models/product";
import PurchaseReturn from "@/models/purchaseReturn";
import Seller from "@/models/seller";
import Category from "@/models/category";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect(); // Ensure the connection is established
    const purchasereturn = await PurchaseReturn.find({})
      .populate("sellerId") // Populate seller details
      .populate("godownId") // Populate godown details
      .populate({
        path: "items.productId", // Populate product details inside items array
      })
      .populate({
        path: "items.categoryId", // Populate category details inside items array
      });
    return NextResponse.json(
      {
        data: purchasereturn,
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
      purchaseInvoice,
      godownId,
    } = await req.json();

    // Validate the input
    if (
      (!invoiceNumber || !sellerId || !items || items.length === 0,
      !modeOfTransport,
      !godownId)
    ) {
      return NextResponse.json({
        message: "Invoice Number, Seller ID, and Items are required",
        status: 400,
      });
    }

    if (id) {
      // Handle Update: Update the sale
      await PurchaseReturn.findByIdAndUpdate(id, { invoiceNumber, sellerId, items });

      // Loop through the items to update the products and godown
      for (let item of items) {
        const product = await Product.findById(item.productId);
        const godown = await Goddown.findById(item.godownId);

        // Update the quantity in the product
        if (product) {
          const quantityIndex = product.quantity.findIndex(
            (entry) => entry.godownId.toString() === godown._id.toString()
          );
          if (quantityIndex !== -1) {
            product.quantity[quantityIndex].quantity -= item.quantity;
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
            godown.stock[godownStock].quantity -= item.quantity;
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
        { message: "Purchase Return Updated", success: true },
        { status: 200 }
      );
    }

    // Handle Create: Create a new sale
    const newReturnPurchases = new PurchaseReturn({ invoiceNumber, sellerId, items,godownId,modeOfTransport ,purchaseInvoice,remark});
    await newReturnPurchases.save();

    // Loop through the items to update the products and godown
    for (let item of items) {
      const product = await Product.findById(item.productId);
      const godown = await Goddown.findById(godownId);
      
      // Update the quantity in the product
      if (product) {
        const quantityIndex = product.quantity.findIndex(
          (entry) => entry.godownId.toString() === godown._id.toString()
        );
        if (quantityIndex !== -1) {
          product.quantity[quantityIndex].quantity -= item.quantity;
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
          godown.stock[godownStock].quantity -= item.quantity;
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
      { success: true, message: "Purchase Return Created", data: newReturnPurchases },
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
