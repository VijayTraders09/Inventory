import { NextResponse } from "next/server";
import Goddown from "@/models/goddown";
import GodownTransfer from "@/models/godownTransfer";
import connect from "@/lib/db";
import Product from "@/models/product";

export async function POST(req) {
  try {
    await connect();
    const { fromGodown, toGodown, productId, quantity, remarks } =
      await req.json();

    if (!fromGodown || !toGodown || !productId || !quantity) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    if (fromGodown === toGodown) {
      return NextResponse.json(
        { success: false, message: "Both godowns cannot be same" },
        { status: 400 }
      );
    }

    const source = await Goddown.findById(fromGodown);
    const destination = await Goddown.findById(toGodown);

    if (!source || !destination) {
      return NextResponse.json(
        { success: false, message: "Goddown not found" },
        { status: 404 }
      );
    }

    // finding prodcut
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // srcQty prodcut
    const srcQty = product.quantity.find(
      (q) => q.godownId.toString() === fromGodown
    );

    // Deduct from source product quantity
    srcQty.quantity -= quantity;
    if (srcQty.quantity === 0) {
      product.quantity = product.quantity.filter(
        (q) => q.godownId.toString() !== fromGodown
      );
    }

    // Add to destination product quantity
    const destQty = product.quantity.find(
      (q) => q.godownId.toString() === toGodown
    );

    if (destQty) {
      destQty.quantity += quantity;
    } else {
      product.quantity.push({
        godownId: toGodown,
        quantity,
      });
    }

    // Find product in source godown
    const sourceItem = source.stock.find(
      (item) => item.productId.toString() === productId
    );

    if (!sourceItem || sourceItem.quantity < quantity) {
      return NextResponse.json(
        { success: false, message: "Not enough stock in source godown" },
        { status: 400 }
      );
    }

    // Deduct stock from source
    const srcItem = source.stock.find(
      (item) => item.productId.toString() === productId
    );
    if (srcItem.quantity === 0) {
      source.stock = source.stock.filter(
        (item) => item.productId.toString() !== productId
      );
    }

    // Add stock to destination
    const destItem = destination.stock.find(
      (item) => item.productId.toString() === productId
    );

    if (destItem) {
      destItem.quantity += quantity;
    } else {
      destination.stock.push({
        productId,
        quantity,
      });
    }

    await source.save();
    await destination.save();
    await product.save();

    // Save transfer log
    await GodownTransfer.create({
      fromGodown,
      toGodown,
      productId,
      quantity,
      remarks,
    });

    return NextResponse.json(
      { success: true, message: "Stock transferred successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connect();
    const records = await GodownTransfer.find()
      .populate("fromGodown", "goddownName")
      .populate("toGodown", "goddownName")
      .populate("productId", "productName")
      .sort({ createdAt: -1 }); // newest first

    return NextResponse.json(
      { success: true, data: records },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
