import connect from "@/lib/db";
import Goddown from "@/models/goddown";
import Product from "@/models/product";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    await connect();

    // Fetch all godowns
    const godowns = await Goddown.find({}).lean();
    if (!godowns.length) {
      return new Response("No godowns found", { status: 404 });
    }

    // Fetch all products once (avoid multiple DB calls)
    const products = await Product.find({}).lean();
    const productMap = new Map(
      products.map((p) => [p._id.toString(), p.productName])
    );

    const workbook = new ExcelJS.Workbook();

    // Create one sheet per godown
    godowns.forEach((godown) => {
      const sheet = workbook.addWorksheet(
        godown.goddownName.substring(0, 31) // Excel sheet name limit
      );

      sheet.columns = [
        { header: "Product Name", key: "productName", width: 32 },
        { header: "Quantity", key: "quantity", width: 15 },
      ];

      godown.stock.forEach((item) => {
        sheet.addRow({
          productName:
            productMap.get(item.productId.toString()) || "Unknown",
          quantity: item.quantity,
        });
      });
    });

    // Write Excel to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition":
          'attachment; filename="All_Godowns_Stock.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Error generating Excel file", { status: 500 });
  }
}
