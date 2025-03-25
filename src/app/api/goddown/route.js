// app/api/products/route.js

import Goddown from "@/models/goddown";
import { NextResponse } from "next/server";
import connect from "../../../lib/db";

export async function GET() {
  try {
    await connect(); // Ensure the connection is established
    const goddowns  = await Goddown.find({});
    return NextResponse.json(
      {
        data: goddowns ,
        success: true,
        message: "goddowns  Fetched",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error: "Error retrieving goddowns ",
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { goddownName, id } = await req.json();
    await connect(); // Ensure the connection is established

    if (!goddownName) {
      return NextResponse.json({
        message: "Customer Name required",
        status: 400,
      });
    }
    if (id) {
      await Goddown.findByIdAndUpdate(id, { goddownName });
      return NextResponse.json({ message: "Goddown Updated",success: true }, { status: 200 });
    }
    const newBuyer = new Goddown({ goddownName });
    await newBuyer.save();
    return NextResponse.json(
      { newBuyer, success: true, message: "Goddown Created" },
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
