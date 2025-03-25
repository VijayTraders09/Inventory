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
        return { ...category.toObject(), products:products };
      })
    );
    return NextResponse.json(
      { data: categoriesWithProducts, success: true, message: "Category Fetched" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return  NextResponse.json({
      error: "Error retrieving categories",
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { categoryName ,id } = await req.json();
    await connect(); // Ensure the connection is established

    if(id){
      await Category.findByIdAndUpdate(id,{categoryName:categoryName})
    return NextResponse.json({message:'Category Updated'}, { status: 200 });
    }
    const newCategory = new Category({ categoryName: categoryName });
    await newCategory.save();
    return NextResponse.json(
      { data: [], success: true, message: "Category Created" },
      { status: 200 }
    );
  } catch (error) {
    return  NextResponse.json({
      error: "Error saving categories",
      status: 500,
    });
  }
}
