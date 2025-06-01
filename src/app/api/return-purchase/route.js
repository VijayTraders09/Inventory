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
      .populate({
        path: "items.productId", // Populate product details inside items array
      })
      .populate({
        path: "items.categoryId", // Populate category details inside items array
      })
      .populate({
        path: "items.godownId", // Populate category details inside items array
      })
      .sort({ createdAt: -1 });
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

    const { invoiceNumber, sellerId, items, id, modeOfTransport, remark } =
      await req.json();

    if (!sellerId || !items || items.length === 0 || !modeOfTransport) {
      return NextResponse.json(
        {
          message:
            "Invoice Number, Seller ID, Items, and Mode of Transport are required",
        },
        { status: 400 }
      );
    }

    let purchaseReturn;

    if (id) {
      // -------- Handle Update --------
      purchaseReturn = await PurchaseReturn.findById(id);

      if (!purchaseReturn) {
        return NextResponse.json(
          { message: "Purchase Return not found" },
          { status: 404 }
        );
      }

      // Reverse previous stock changes
      for (let oldItem of purchaseReturn.items) {
        const product = await Product.findById(oldItem.productId);
        const godown = await Goddown.findById(oldItem.godownId);

        if (product) {
          const idx = product.quantity.findIndex(
            (entry) => entry.godownId.toString() === godown._id.toString()
          );
          if (idx !== -1) {
            product.quantity[idx].quantity += oldItem.quantity; // reverse subtraction
          }
          await product.save();
        }

        if (godown) {
          const idx = godown.stock.findIndex(
            (entry) =>
              entry.productId.toString() === oldItem.productId.toString()
          );
          if (idx !== -1) {
            godown.stock[idx].quantity += oldItem.quantity; // reverse subtraction
          }
          await godown.save();
        }
      }

      // Update Purchase Return record
      purchaseReturn.invoiceNumber = invoiceNumber;
      purchaseReturn.sellerId = sellerId;
      purchaseReturn.items = items;
      purchaseReturn.modeOfTransport = modeOfTransport;
      purchaseReturn.remark = remark;
      await purchaseReturn.save();
    } else {
      // -------- Handle Create --------
      purchaseReturn = new PurchaseReturn({
        invoiceNumber,
        sellerId,
        items,
        modeOfTransport,
        remark,
      });
      await purchaseReturn.save();
    }

    // -------- Update Inventory (Apply New) --------
    for (let item of items) {
      const product = await Product.findById(item.productId);
      const godown = await Goddown.findById(item.godownId);

      if (product) {
        const idx = product.quantity.findIndex(
          (entry) => entry.godownId.toString() === godown._id.toString()
        );
        if (idx !== -1) {
          product.quantity[idx].quantity -= item.quantity;
        } else {
          product.quantity.push({
            godownId: godown._id,
            quantity: -item.quantity,
          });
        }
        await product.save();
      }

      if (godown) {
        const idx = godown.stock.findIndex(
          (entry) => entry.productId.toString() === item.productId.toString()
        );
        if (idx !== -1) {
          godown.stock[idx].quantity -= item.quantity;
        } else {
          godown.stock.push({
            productId: item.productId,
            quantity: -item.quantity,
          });
        }
        await godown.save();
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: id ? "Purchase Return Updated" : "Purchase Return Created",
        data: purchaseReturn,
      },
      { status: id ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error handling purchase return:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error handling purchase return",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
