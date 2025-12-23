// app/api/products/bulk-products/route.js

import connect from "@/lib/db";
import Product from "@/models/product";
import Goddown from "@/models/goddown";
import Category from "@/models/category";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();

    const { categoryId, products } = await req.json();

    // ------------------ VALIDATION ------------------
    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "categoryId is required" },
        { status: 400 }
      );
    }

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, message: "products must be an array" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Invalid categoryId" },
        { status: 400 }
      );
    }

    let createdProducts = [];

    // ------------------ PROCESS EACH PRODUCT ------------------
    for (const item of products) {
      const { productName, stock } = item;

      if (!productName || !stock) continue;

      // Create product → quantity = stock array
      const product = new Product({
        productName,
        categoryId,
        quantity: stock.map((s) => ({
          godownId: s.godownId,
          quantity: s.qty || 0,
        })),
      });

      await product.save();

      // ------------------ UPDATE GODOWN STOCK ------------------
      for (const s of stock) {
        const { godownId, qty } = s;

        const godown = await Goddown.findById(godownId);
        if (!godown) continue;

        const existingStock = godown.stock.find(
          (st) => st.productId?.toString() === product._id.toString()
        );

        if (existingStock) {
          existingStock.quantity += qty;
        } else {
          godown.stock.push({
            productId: product._id,
            quantity: qty,
          });
        }

        await godown.save();
      }

      createdProducts.push(product);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Bulk products created successfully",
        data: createdProducts,
      },
      { status: 200 }
    );

  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
