// app/api/products/route.js

import Product from "@/models/product";
import Goddown from "@/models/goddown";
import Category from "@/models/category";
import connect from "../../../lib/db";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Purchases from "@/models/purchases";

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
    
    // Check if product name is provided
    if (!productName || productName.trim() === '') {
      return NextResponse.json(
        { success: false, message: "Product name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate product name
    const existingProduct = await Product.findOne({ 
      productName: { $regex: new RegExp(`^${productName}$`, 'i') } // Case-insensitive search
    });

    if (id) {
      // Update operation
      // Check if the existing product is not the same as the one being updated
      if (existingProduct && existingProduct._id.toString() !== id) {
        return NextResponse.json(
          { success: false, message: "Product with this name already exists" },
          { status: 200 } // 409 Conflict status code
        );
      }
      
      await Product.findByIdAndUpdate(id, { productName: productName });
      return NextResponse.json(
        { data: [], success: true, message: "Product Updated" },
        { status: 200 }
      );
    } else {
      // Create operation
      if (existingProduct) {
        return NextResponse.json(
          { success: false, message: "Product with this name already exists" },
          { status: 409 } // 409 Conflict status code
        );
      }
      
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
    }
  } catch (error) {
    console.error("Error in product POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function DELETE(req) {
  try {
    await connect();
    
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");
    
    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required", success: false },
        { status: 400 }
      );
    }
    
    // Find the product to be deleted
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json(
        { message: "Product not found", success: false },
        { status: 404 }
      );
    }
    
    // Check if the product is referenced in any sales or purchases
    const Sales = mongoose.model("Sale");
    const Purchase = mongoose.model("Purchase");
    
    const salesWithProduct = await Sales.findOne({ "items.productId": productId });
    const purchasesWithProduct = await Purchase.findOne({ "items.productId": productId });
    
    if (salesWithProduct || purchasesWithProduct) {
      return NextResponse.json(
        { 
          message: "Cannot delete product. It is referenced in sales or purchases.", 
          success: false,
          referencedInSales: !!salesWithProduct,
          referencedInPurchases: !!purchasesWithProduct
        },
        { status: 409 }
      );
    }
    
    // Remove product from all godowns
    const Godown = mongoose.model("Goddown");
    await Godown.updateMany(
      { "stock.productId": productId },
      { $pull: { stock: { productId: productId } } }
    );
    
    // Delete the product
    await Product.findByIdAndDelete(productId);
    
    return NextResponse.json(
      { success: true, message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting product", error: error.message },
      { status: 500 }
    );
  }
}