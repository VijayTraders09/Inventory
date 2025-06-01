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
      }).sort({ createdAt: -1 });
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

    // Input validation
    if (!sellerId || !items || items.length === 0 || !modeOfTransport) {
      return NextResponse.json(
        {
          message: "Seller ID, items, and mode of transport are required",
        },
        { status: 400 }
      );
    }

    let purchase;

    if (id) {
      // ----------- 1. Handle Update -----------
      purchase = await Purchases.findById(id);

      if (!purchase) {
        return NextResponse.json(
          { message: "Purchase not found" },
          { status: 404 }
        );
      }

      // Rollback previous stock values
      for (let oldItem of purchase.items) {
        const product = await Product.findById(oldItem.productId);
        const godown = await Goddown.findById(oldItem.godownId);

        if (product) {
          const idx = product.quantity.findIndex(
            (entry) => entry.godownId.toString() === godown._id.toString()
          );
          if (idx !== -1) {
            product.quantity[idx].quantity -= oldItem.quantity;
          }
          await product.save();
        }

        if (godown) {
          const idx = godown.stock.findIndex(
            (entry) => entry.productId.toString() === oldItem.productId.toString()
          );
          if (idx !== -1) {
            godown.stock[idx].quantity -= oldItem.quantity;
          }
          await godown.save();
        }
      }

      // Update Purchase
      purchase.invoiceNumber = invoiceNumber;
      purchase.sellerId = sellerId;
      purchase.items = items;
      purchase.modeOfTransport = modeOfTransport;
      purchase.remark = remark;
      await purchase.save();
    } else {
      // ----------- 2. Handle Create -----------
      purchase = new Purchases({
        invoiceNumber,
        sellerId,
        items,
        modeOfTransport,
        remark,
      });
      await purchase.save();
    }

    // ----------- 3. Update Stock -----------
    for (let item of items) {
      const product = await Product.findById(item.productId);
      const godown = await Goddown.findById(item.godownId);

      if (product) {
        const idx = product.quantity.findIndex(
          (entry) => entry.godownId.toString() === godown._id.toString()
        );
        if (idx !== -1) {
          product.quantity[idx].quantity += item.quantity;
        } else {
          product.quantity.push({
            godownId: godown._id,
            quantity: item.quantity,
          });
        }
        await product.save();
      }

      if (godown) {
        const idx = godown.stock.findIndex(
          (entry) => entry.productId.toString() === item.productId.toString()
        );
        if (idx !== -1) {
          godown.stock[idx].quantity += item.quantity;
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
      {
        success: true,
        message: id ? "Purchase updated" : "Purchase created",
        data: purchase,
      },
      { status: id ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error handling purchase:", error);
    return NextResponse.json(
      { success: false, message: "Error handling purchase", error: error.message },
      { status: 500 }
    );
  }
}
