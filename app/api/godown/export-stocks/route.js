import { NextResponse } from 'next/server';
import Godown from '../../../../models/godown';
import Stock from '../../../../models/stock';
import Product from '../../../../models/product';
import Category from '../../../../models/category';
import * as XLSX from 'xlsx';
import connectDB from '../../../../lib/db';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get all godowns
    const godowns = await Godown.find({}).sort({ godownName: 1 });
    
    // Get all stocks with populated references
    const stocks = await Stock.find({})
      .populate({
        path: 'productId',
        select: 'productName'
      })
      .populate({
        path: 'categoryId',
        select: 'categoryName'
      })
      .populate({
        path: 'godownId',
        select: 'godownName'
      });
    
    // Create a map to organize products by godown
    const godownProductsMap = {};
    
    // Initialize the map with all godowns
    godowns.forEach(godown => {
      godownProductsMap[godown._id.toString()] = {
        godownName: godown.godownName,
        products: []
      };
    });
    
    // Group products by godown
    stocks.forEach(stock => {
      const godownId = stock.godownId._id.toString();
      
      if (godownProductsMap[godownId]) {
        godownProductsMap[godownId].products.push({
          productName: stock.productId.productName,
          categoryName: stock.categoryId.categoryName,
          quantity: stock.quantity
        });
      }
    });
    
    // Create a workbook
    const wb = XLSX.utils.book_new();
    
    // Create a separate sheet for each godown
    Object.values(godownProductsMap).forEach(godown => {
      const sheetData = [];
      
      // Add products
      if (godown.products.length === 0) {
        sheetData.push({
          'S.No': 1,
          'Product Name': 'No products found',
          'Category': '-',
          'Quantity': 0
        });
      } else {
        godown.products.forEach((product, index) => {
          sheetData.push({
            'S.No': index + 1,
            'Product Name': product.productName,
            'Category': product.categoryName,
            'Quantity': product.quantity
          });
        });
      }
      
      // Create worksheet for this godown
      // Sanitize sheet name to avoid Excel limitations (max 31 chars, no special chars)
      const sheetName = godown.godownName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31);
      const godownWs = XLSX.utils.json_to_sheet(sheetData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, godownWs, sheetName);
    });
    
    // Generate buffer
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    
    // Create response with the Excel file
    const fileName = `godown_stock_report_${new Date().toISOString().split("T")[0]}.xlsx`;
    
    return new NextResponse(wbout, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Error generating godown stock report:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to generate godown stock report' 
    }, { status: 500 });
  }
}