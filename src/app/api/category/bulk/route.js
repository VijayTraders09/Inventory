// app/api/products/bulk-categories/route.js

import Category from "@/models/category";
import connect from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();
    const { records } = await req.json();

    // Validate records field
    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, message: "records must be an array" },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: "No records provided" },
        { status: 400 }
      );
    }

    // Validate and clean records
    const cleaned = records
      .map((item) => item.categoryName?.trim())
      .filter((name) => name && name.length > 0);

    if (cleaned.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid category names provided" },
        { status: 400 }
      );
    }

    // Check for duplicates inside the request
    const uniqueNames = [...new Set(cleaned)];

    // Check duplicates in DB
    const existing = await Category.find({
      categoryName: { $in: uniqueNames }
    });

    const existingNames = existing.map((cat) => cat.categoryName);

    const newNames = uniqueNames.filter(
      (name) => !existingNames.includes(name)
    );

    if (newNames.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "All categories already exist",
        },
        { status: 400 }
      );
    }

    // Prepare insert documents
    const docs = newNames.map((name) => ({
      categoryName: name,
    }));

    // Insert many
    const inserted = await Category.insertMany(docs);

    return NextResponse.json(
      {
        success: true,
        message: `${inserted.length} Categories Uploaded Successfully`,
        data: inserted,
        skipped: existingNames,
      },
      { status: 200 }
    );

  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
