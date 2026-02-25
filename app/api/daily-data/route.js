import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Stock from '../../../models/stock';
import Purchase from '../../../models/purchase';
import Sell from '../../../models/sell';
import Product from '../../../models/product';
import Category from '../../../models/category';
import PurchaseReturns from '../../../models/purchaseReturn';
import SellReturns from '../../../models/sellReturn';
import Godown from '../../../models/godown';
import StockTransfer from '../../../models/stockTransfer';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const godownId = searchParams.get('godownId');
    
    // Get today's date range (start of day to end of day)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // If godownId is provided, return data for that specific godown
    if (godownId) {
      return await getGodownData(godownId, startOfDay, endOfDay, today);
    }
    
    // Otherwise, return data for all godowns
    // First, get all godowns
    const godowns = await Godown.find({}).lean();
    
    if (!godowns || godowns.length === 0) {
      return NextResponse.json({
        success: true,
        data: {},
        message: 'No godowns found'
      });
    }
    
    // Create an object to store data for all godowns
    const allGodownsData = {};
    
    // Get data for each godown
    for (const godown of godowns) {
      const godownData = await getGodownInventoryData(
        godown._id.toString(),
        startOfDay,
        endOfDay
      );
      
      if (godownData && godownData.length > 0) {
        allGodownsData[godown._id.toString()] = {
          godownName: godown.godownName,
          data: godownData,
          date: today.toISOString().split('T')[0],
          summary: {
            totalProducts: godownData.length,
            totalQuantity: godownData.reduce((sum, product) => sum + product.currentQuantity, 0),
            totalPurchases: godownData.reduce((sum, product) => sum + product.todayPurchases, 0),
            totalSales: godownData.reduce((sum, product) => sum + product.todaySales, 0),
            totalTransfersOut: godownData.reduce((sum, product) => sum + product.todayTransfersOut, 0),
          }
        };
      }
    }
    
    // Return the result for all godowns
    return NextResponse.json({
      success: true,
      data: allGodownsData,
      date: today.toISOString().split('T')[0],
      totalGodowns: Object.keys(allGodownsData).length
    });
    
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch inventory' 
    }, { status: 500 });
  }
}

// Helper function to get data for a specific godown
async function getGodownData(godownId, startOfDay, endOfDay, today) {
  const godownData = await getGodownInventoryData(godownId, startOfDay, endOfDay);
  
  if (!godownData || godownData.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      message: 'No products found in this godown'
    });
  }
  
  const totalTransfersOut = godownData.reduce((sum, product) => sum + product.todayTransfersOut, 0);
  
  return NextResponse.json({
    success: true,
    data: godownData,
    godownId,
    date: today.toISOString().split('T')[0],
    summary: {
      totalProducts: godownData.length,
      totalQuantity: godownData.reduce((sum, product) => sum + product.currentQuantity, 0),
      totalPurchases: godownData.reduce((sum, product) => sum + product.todayPurchases, 0),
      totalSales: godownData.reduce((sum, product) => sum + product.todaySales, 0),
      totalTransfersOut,
    }
  });
}

// Helper function to get inventory data for a godown
async function getGodownInventoryData(godownId, startOfDay, endOfDay) {
  // Find all stocks for the given godown and populate product and category details
  const stocks = await Stock.find({ godownId })
    .populate('productId', 'productName')
    .populate('categoryId', 'categoryName')
    .populate('godownId', 'godownName')
    .lean();
  
  if (!stocks || stocks.length === 0) {
    return [];
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
      todaySales: 0,
      todayTransfersOut: 0,
      todayTransfersIn: 0
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

  // Get today's purchaseReturns for these products in this godown
  const purchaseReturns = await PurchaseReturns.find({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
    'stockEntries.godownId': godownId
  }).lean();
  
  // Aggregate purchase return quantities by product
  purchaseReturns.forEach(purchase => {
    purchase.stockEntries.forEach(entry => {
      const productId = entry.productId.toString();
      if (productMap.has(productId)) {
        const product = productMap.get(productId);
        product.todayPurchases -= entry.quantity;
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

  // Get today's sell returns for these products in this godown
  const sellReturns = await SellReturns.find({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
    'stockEntries.godownId': godownId
  }).lean();
  
  // Aggregate sell return quantities by product
  sellReturns.forEach(sale => {
    sale.stockEntries.forEach(entry => {
      const productId = entry.productId.toString();
      if (productMap.has(productId)) {
        const product = productMap.get(productId);
        product.todaySales -= entry.quantity;
        product.test += entry.quantity;
      }
    });
  });

  // Get today's stock transfers OUT from this godown
  const transfersOut = await StockTransfer.find({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
    fromGodownId: godownId
  }).lean();
  
  // Aggregate transfer out quantities by product
  transfersOut.forEach(transfer => {
    transfer.items.forEach(item => {
      const productId = item.productId.toString();
      if (productMap.has(productId)) {
        const product = productMap.get(productId);
        product.todayTransfersOut += item.quantity;
        product.test -= item.quantity;
      }
    });
  });
  
  // Get today's stock transfers IN to this godown
  const transfersIn = await StockTransfer.find({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
    toGodownId: godownId
  }).lean();
  
  // Aggregate transfer in quantities by product
  transfersIn.forEach(transfer => {
    transfer.items.forEach(item => {
      const productId = item.productId.toString();
      if (productMap.has(productId)) {
        const product = productMap.get(productId);
        product.todayTransfersIn += item.quantity;
        product.test += item.quantity;
      }
    });
  });
  
  // Convert the map to an array for the response
  return Array.from(productMap.values());
}