import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Stock from '../../../models/stock';
import Purchase from '../../../models/purchase';
import Sell from '../../../models/sell';
import Product from '../../../models/product';
import Category from '../../../models/category';
import Godown from '../../../models/godown';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const godownId = searchParams.get('godownId');
    
    if (!godownId) {
      return NextResponse.json({ 
        error: 'Godown ID is required' 
      }, { status: 400 });
    }
    
    // Get today's date range (start of day to end of day)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Find all stocks for the given godown and populate product and category details
    const stocks = await Stock.find({ godownId })
      .populate('productId', 'productName')
      .populate('categoryId', 'categoryName')
      .populate('godownId', 'godownName')
      .lean();
    
    if (!stocks || stocks.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No products found in this godown'
      });
    }
    
    // Create a map to store product information
    const productMap = new Map();
    
    // Initialize product map with stock data
    stocks.forEach(stock => {
      const productId = stock.productId._id.toString();
      productMap.set(productId, {
        productId: stock.productId._id,
        productName: stock.productId.productName,
        categoryId: stock.categoryId._id,
        categoryName: stock.categoryId.categoryName,
        godownId: stock.godownId._id,
        godownName: stock.godownId.godownName,
        currentQuantity: stock.quantity,
        test: stock.quantity,
        todayPurchases: 0,
        todaySales: 0
      });
    });
    
    // Get today's purchases for these products in this godown
    const purchases = await Purchase.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      'stockEntries.godownId': godownId
    }).lean();
    
    // Aggregate purchase quantities by product
    purchases.forEach(purchase => {
      purchase.stockEntries.forEach(entry => {
        const productId = entry.productId.toString();
        if (productMap.has(productId)) {
          const product = productMap.get(productId);
          product.todayPurchases += entry.quantity;
          product.test -= entry.quantity;
        }
      });
    });
    
    // Get today's sales for these products in this godown
    const sales = await Sell.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      'stockEntries.godownId': godownId
    }).lean();
    
    // Aggregate sale quantities by product
    sales.forEach(sale => {
      sale.stockEntries.forEach(entry => {
        const productId = entry.productId.toString();
        if (productMap.has(productId)) {
          const product = productMap.get(productId);
          product.todaySales += entry.quantity;
          product.test += entry.quantity;
        }
      });
    });
    
    // Convert the map to an array for the response
    const result = Array.from(productMap.values());
    
    // Return the result
    return NextResponse.json({
      success: true,
      data: result,
      godownId,
      stocks,
      date: today.toISOString().split('T')[0],
      summary: {
        totalProducts: result.length,
        totalQuantity: result.reduce((sum, product) => sum + product.currentQuantity, 0),
        totalPurchases: result.reduce((sum, product) => sum + product.todayPurchases, 0),
        totalSales: result.reduce((sum, product) => sum + product.todaySales, 0)
      }
    });
    
  } catch (error) {
    console.error('Error fetching godown inventory:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch godown inventory' 
    }, { status: 500 });
  }
}