import connect from "@/lib/db";
import Goddown from "@/models/goddown";
import Product from "@/models/product";
import SaleReturn from "@/models/saleReturn";
import Buyer from "@/models/buyer";
import Category from "@/models/category";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect(); // Ensure the connection is established
    const sales = await SaleReturn.find({})
      .populate("buyerId") // Populate seller details
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
      buyerId,
      items,
      id,
      modeOfTransport,
      remark,
      saleInvoice,
    } = await req.json();

    if (!buyerId || !items || items.length === 0 || !modeOfTransport) {
      return NextResponse.json(
        {
          message:
            "Invoice Number, Buyer ID, Items, and Mode of Transport are required",
        },
        { status: 400 }
      );
    }

    let saleReturn;

    if (id) {
      // ---------- UPDATE ----------
      saleReturn = await SaleReturn.findById(id);
      if (!saleReturn) {
        return NextResponse.json(
          { message: "Sale Return not found" },
          { status: 404 }
        );
      }

      // Reverse previous stock changes
      for (let oldItem of saleReturn.items) {
        const product = await Product.findById(oldItem.productId);
        const godown = await Goddown.findById(oldItem.godownId);

        if (product) {
          const idx = product.quantity.findIndex(
            (entry) => entry.godownId.toString() === godown._id.toString()
          );
          if (idx !== -1) {
            product.quantity[idx].quantity += oldItem.quantity;
          }
          await product.save();
        }

        if (godown) {
          const idx = godown.stock.findIndex(
            (entry) =>
              entry.productId.toString() === oldItem.productId.toString()
          );
          if (idx !== -1) {
            godown.stock[idx].quantity += oldItem.quantity;
          }
          await godown.save();
        }
      }

      // Update sale return record
      saleReturn.invoiceNumber = invoiceNumber;
      saleReturn.buyerId = buyerId;
      saleReturn.items = items;
      saleReturn.modeOfTransport = modeOfTransport;
      saleReturn.remark = remark;
      saleReturn.saleInvoice = saleInvoice;
      await saleReturn.save();
    } else {
      // ---------- CREATE ----------
      saleReturn = new SaleReturn({
        invoiceNumber,
        buyerId,
        items,
        modeOfTransport,
        remark,
        saleInvoice,
      });
      await saleReturn.save();
    }

    // ---------- APPLY NEW STOCK CHANGES ----------
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
        message: id ? "Sale Return Updated" : "Sale Return Created",
        data: saleReturn,
      },
      { status: id ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error handling sale return:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error handling sale return",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
