// app/api/products/route.js

import Category from "@/models/category";
import connect from "../../../lib/db";
import { NextResponse } from "next/server";
import Product from "@/models/product";
import Buyer from "@/models/buyer";
import { isValidMobileNumber } from "@/utils/validations/mobileNumbervalidation";

export async function GET() {
  try {
    await connect(); // Ensure the connection is established
    const buyers = await Buyer.find({});
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
    const { buyerName, id, mobileNumber } = await req.json();
    await connect(); // Ensure the connection is established

    if (!buyerName) {
      return NextResponse.json({
        message: "Customer Name required",
        status: 400,
      });
    }
    
    if (id) {
      await Buyer.findByIdAndUpdate(id, { buyerName, mobileNumber });
      return NextResponse.json(
        {
          data: {},
          success: true,
          message: "Buyer Updated",
        },
        { status: 200 }
      );
    }
    let isExits = await Buyer.findOne({ mobileNumber });
    // if (isExits)
    //   return NextResponse.json({
    //     message: "Mobile Number exits",
    //     status: 400,
    //   });

    const newBuyer = new Buyer({ buyerName, mobileNumber });
    await newBuyer.save();
    return NextResponse.json(
      { data: newBuyer, success: true, message: "Buyer Created" },
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
