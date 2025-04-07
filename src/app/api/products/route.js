// app/api/products/route.js

import Product from "@/models/product";
import connect from "../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connect(); // Ensure the connection is established
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const products = await Product.find({ categoryId }).populate("categoryId").populate('quantity.godownId')
    return NextResponse.json(
      { data: products, success: true, message: "Products Fetched" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ error: "Error retrieving products" }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { productName, id, categoryId, quantity } = await req.json();
    await connect(); // Ensure the connection is established
    // console.log(product,id,categoryId)
    if (id) {
      await Product.findByIdAndUpdate(id, { productName: productName });
      return NextResponse.json(
        { data: [], success: true, message: "Product Updated" },
        { status: 200 }
      );
    }
    console.log(quantity);
    const newProduct = new Product({
      productName: productName,
      categoryId: categoryId,
      quantity: quantity,
    });
    await newProduct.save();
    return NextResponse.json(
      { data: newProduct, success: true, message: "Product Created" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
