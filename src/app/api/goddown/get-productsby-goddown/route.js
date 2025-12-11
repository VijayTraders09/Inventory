import { NextResponse } from "next/server";
import connect from "@/lib/db";
import product from "@/models/product";

export async function POST(req) {
  try {
    await connect();
    const { godownId } = await req.json();
    console.log(godownId);
    if (!godownId) {
      return NextResponse.json(
        { success: false, message: "godownId is required" },
        { status: 400 }
      );
    }

    const products = await product.find({
      quantity: {
        $elemMatch: {
          godownId,
          quantity: { $gt: 0 },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: products },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
