// app/api/products/route.js

import Category from "@/models/category";
import connect from "../../../lib/db";
import { NextResponse } from "next/server";
import Product from "@/models/product";

export async function GET() {
  try {
    await connect(); // Ensure the connection is established
    const categories = await Category.find({});
    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({ categoryId: category._id });
        return { ...category.toObject(), products: products };
      })
    );
    return NextResponse.json(
      { data: categoriesWithProducts, success: true, message: "Category Fetched" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error: "Error retrieving categories",
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { categoryName, id } = await req.json();
    await connect(); // Ensure the connection is established

    // Check if category name is provided
    if (!categoryName || categoryName.trim() === '') {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate category name
    const existingCategory = await Category.findOne({ 
      categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') } // Case-insensitive search
    });

    if (id) {
      // Update operation
      // Check if the existing category is not the same as the one being updated
      if (existingCategory && existingCategory._id.toString() !== id) {
        return NextResponse.json(
          { success: false, message: "Category with this name already exists" },
          { status: 409 } // 409 Conflict status code
        );
      }
      
      await Category.findByIdAndUpdate(id, { categoryName: categoryName });
      return NextResponse.json(
        { success: true, message: "Category Updated" },
        { status: 200 }
      );
    } else {
      // Create operation
      if (existingCategory) {
        return NextResponse.json(
          { success: false, message: "Category with this name already exists" },
          { status: 409 } // 409 Conflict status code
        );
      }
      
      const newCategory = new Category({ categoryName: categoryName });
      await newCategory.save();
      return NextResponse.json(
        { data: newCategory, success: true, message: "Category Created" },
        { status: 201 } // 201 Created status code for new resources
      );
    }
  } catch (error) {
    console.error("Error in category POST:", error);
    return NextResponse.json({
      success: false,
      error: "Error saving category",
      message: error.message,
      status: 500,
    });
  }
}

export async function DELETE(req) {
  try {
    await connect();
    
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("id");
    
    if (!categoryId) {
      return NextResponse.json(
        { message: "Category ID is required", success: false },
        { status: 400 }
      );
    }
    
    // Find the category to be deleted
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return NextResponse.json(
        { message: "Category not found", success: false },
        { status: 404 }
      );
    }
    
    // Check if any products are using this category
    const productsWithCategory = await Product.find({ categoryId: categoryId });
    
    if (productsWithCategory.length > 0) {
      return NextResponse.json(
        { 
          message: "Cannot delete category. It is being used by products.", 
          success: false,
          productCount: productsWithCategory.length
        },
        { status: 409 } // 409 Conflict status code
      );
    }
    
    // Delete the category
    await Category.findByIdAndDelete(categoryId);
    
    return NextResponse.json(
      { success: true, message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting category", error: error.message },
      { status: 500 }
    );
  }
}