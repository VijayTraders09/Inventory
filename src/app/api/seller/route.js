// app/api/products/route.js

import Category from "@/models/category";
import connect from "../../../lib/db";
import { NextResponse } from "next/server";
import Product from "@/models/product";
import Seller from "@/models/seller";
import { isValidMobileNumber } from "@/utils/validations/mobileNumbervalidation";

export async function GET() {
  try {
    await connect(); // Ensure the connection is established
    const buyers = await Seller.find({});
    return NextResponse.json(
      {
        data: buyers,
        success: true,
        message: "buyers Fetched",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error: "Error retrieving buyers",
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { sellerName, id, mobileNumber } = await req.json();
    await connect(); // Ensure the connection is established

    if (!sellerName) {
      return NextResponse.json({
        message: "Purchaser Name required",
        status: 400,
      });
    }
   
      let isExits = await Seller.findOne({mobileNumber})
      console.log(isExits)
      if(isExits)  return NextResponse.json({
        message: "Mobile Number exits",
        status: 400,
      });

    if (id) {
      await Seller.findByIdAndUpdate(id, { sellerName, mobileNumber });
      return NextResponse.json({ message: "Purchaser Updated" }, { status: 200 });
    }
    const newSeller = new Seller({ sellerName, mobileNumber });
    await newSeller.save();
    return NextResponse.json(
      { data: newSeller, success: true, message: "Purchaser Created" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({
      error: error,
      message: error.message,
      status: 500,
    });
  }
}
