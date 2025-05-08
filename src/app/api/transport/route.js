// app/api/products/route.js

import Transport from "@/models/transport";
import { NextResponse } from "next/server";
import connect from "../../../lib/db";

export async function GET() {
  try {
    await connect(); // Ensure the connection is established
    const transports = await Transport.find({});
    return NextResponse.json(
      {
        data: transports,
        success: true,
        message: "Transport Fetched",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error: "Error retrieving transports",
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { transport, id} = await req.json();
    await connect(); // Ensure the connection is established

    if (!transport) {
      return NextResponse.json({
        message: "transport Name required",
        status: 400,
      });
    }

    let isExits = await Transport.findOne({transport})
      if(isExits)  return NextResponse.json({
        message: "Transport exits",
        status: 400,
      });
   
    if (id) {
      await Transport.findByIdAndUpdate(id, { transport });
      return NextResponse.json({ message: "Transport Updated" }, { status: 200 });
    }
    const newtransport = new Transport({ transport });
    await newtransport.save();
    return NextResponse.json(
      { data: newtransport, success: true, message: "Transport Created" },
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
