import connect from "@/lib/db";
import Goddown from "@/models/goddown";
import Product from "@/models/product";
import ExcelJS from "exceljs";

export async function GET(req, { params }) {
  try {
    await connect();

    const { id } = params;

    const godown = await Goddown.findById(id).lean();
    if (!godown) {
      return new Response("Godown not found", { status: 404 });
    }

    // Build complete product list
    const stockWithProducts = await Promise.all(
      godown.stock.map(async (item) => {
        const product = await Product.findById(item.productId).lean();
        return {
          productName: product?.productName || "Unknown",
          quantity: item.quantity,
        };
      })
    );

    // Create Excel file
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Godown Stock");

    sheet.columns = [
      { header: "Product Name", key: "productName", width: 32 },
      { header: "Quantity", key: "quantity", width: 15 },
    ];

    stockWithProducts.forEach((row) => {
      sheet.addRow(row);
    });

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${godown.goddownName}-stock.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Error generating Excel file", { status: 500 });
  }
}
