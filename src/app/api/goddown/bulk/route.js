// app/api/products/bulk/route.js

import Goddown from "@/models/goddown";
import { NextResponse } from "next/server";
import connect from "../../../../lib/db";

export async function POST(req) {
  try {
    await connect();
    const { records } = await req.json();

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, message: "Records array is required" },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: "No records found" },
        { status: 400 }
      );
    }

    // Validate each record
    const invalid = records.filter(item => !item.goddownName);
    if (invalid.length > 0) {
      return NextResponse.json(
        { success: false, message: "Some records missing goddownName" },
        { status: 400 }
      );
    }

    // Insert Many
    const saved = await Goddown.insertMany(records);

    return NextResponse.json(
      {
        success: true,
        message: `${saved.length} Goddowns uploaded successfully`,
        data: saved,
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
