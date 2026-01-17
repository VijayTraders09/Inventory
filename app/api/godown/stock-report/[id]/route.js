import { NextResponse } from 'next/server';
import Godown from '../../../../../models/godown';
import Stock from '../../../../../models/stock';
import Product from '../../../../../models/product';
import Category from '../../../../../models/category';
import * as XLSX from 'xlsx';
import connectDB from '../../../../../lib/db';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // Get the specific godown
    const godown = await Godown.findById(id);
    
    if (!godown) {
      return NextResponse.json({ 
        success: false,
        error: 'Godown not found' 
      }, { status: 404 });
    }
    
    // Get all stocks for this specific godown with populated references
    const stocks = await Stock.find({ godownId: id })
      .populate({
        path: 'productId',
        select: 'productName'
      })
      .populate({
        path: 'categoryId',
        select: 'categoryName'
      });
    
    // Create a workbook
    const wb = XLSX.utils.book_new();
    
    // Create sheet data
    const sheetData = [];
    
    // Add headers
    sheetData.push({
      'S.No': 'S.No',
      'Product Name': 'Product Name',
      'Category': 'Category',
      'Quantity': 'Quantity'
    });
    
    // Add products
    if (stocks.length === 0) {
      sheetData.push({
        'S.No': 1,
        'Product Name': 'No products found',
        'Category': '-',
        'Quantity': 0
      });
    } else {
      stocks.forEach((stock, index) => {
        sheetData.push({
          'S.No': index + 1,
          'Product Name': stock.productId.productName,
          'Category': stock.categoryId.categoryName,
          'Quantity': stock.quantity
        });
      });
    }
    
    // Create worksheet for this godown
    // Sanitize sheet name to avoid Excel limitations (max 31 chars, no special chars)
    const sheetName = godown.godownName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31);
    const godownWs = XLSX.utils.json_to_sheet(sheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, godownWs, sheetName);
    
    // Generate buffer
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    
    // Create response with the Excel file
    const fileName = `${sheetName}_stock_report_${new Date().toISOString().split("T")[0]}.xlsx`;
    
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