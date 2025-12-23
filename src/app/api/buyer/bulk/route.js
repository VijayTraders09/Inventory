// app/api/products/bulk-buyers/route.js

import Buyer from "@/models/buyer";
import connect from "../../../../lib/db";
import { NextResponse } from "next/server";
import { isValidMobileNumber } from "@/utils/validations/mobileNumbervalidation";

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
    for (let r of records) {
      if (!r.buyerName) {
        return NextResponse.json(
          { success: false, message: "Each record must have buyerName" },
          { status: 400 }
        );
      }

      if (r.mobileNumber && !isValidMobileNumber(r.mobileNumber)) {
        return NextResponse.json(
          { success: false, message: `Invalid mobile number: ${r.mobileNumber}` },
          { status: 400 }
        );
      }

      // Check duplicate numbers only if provided
      if (r.mobileNumber) {
        const exists = await Buyer.findOne({ mobileNumber: r.mobileNumber });
        if (exists) {
          return NextResponse.json(
            { success: false, message: `Mobile Number already exists: ${r.mobileNumber}` },
            { status: 400 }
          );
        }
      }
    }

    // Insert all buyers
    const saved = await Buyer.insertMany(records);

    return NextResponse.json(
      {
        success: true,
        message: `${saved.length} Buyers uploaded successfully`,
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
