import connect from "@/lib/db";
import Goddown from "@/models/goddown";
import Product from "@/models/product";
import Sales from "@/models/sales";
import Buyer from "@/models/buyer";
import Category from "@/models/category";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connect(); // Ensure the connection is established
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId");
    let sales = {};
    if (buyerId) {
      sales = await Sales.find({ buyerId })
        .populate("buyerId") // Populate buyer details
        .populate({
          path: "items.productId", // Populate product details inside items array
        })
        .populate({
          path: "items.categoryId", // Populate category details inside items array
        })
        .populate({
          path: "items.godownId", // Populate godownId details inside items array
        }).sort({ createdAt: -1 });
    } else {
      sales = await Sales.find({})
        .populate("buyerId") // Populate buyer details
        .populate({
          path: "items.productId", // Populate product details inside items array
        })
        .populate({
          path: "items.categoryId", // Populate category details inside items array
        })
        .populate({
          path: "items.godownId", // Populate godownId details inside items array
        }).sort({ createdAt: -1 });
    }
    return NextResponse.json(
      {
        data: sales,
        success: true,
        message: "sales  Fetched",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error: "Error retrieving sales ",
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    await connect();

    const { invoiceNumber, buyerId, items, id, modeOfTransport, remark } = await req.json();

    if (!buyerId || !items || items.length === 0 || !modeOfTransport) {
      return NextResponse.json(
        { message: "Buyer ID, items, and mode of transport are required", status: 400 },
        { status: 400 }
      );
    }

    let sale;

    if (id) {
      // ----------- 1. Handle Update -----------
      sale = await Sales.findById(id)

      if (!sale) {
        return NextResponse.json({ message: "Sale not found", status: 404 }, { status: 404 });
      }

      // Roll back previous item stock and sold count
      for (let oldItem of sale.items) {
        const product = await Product.findById(oldItem.productId);
        const godown = await Goddown.findById(oldItem.godownId);

        if (product) {
          // Roll back stock quantity
          const idx = product.quantity.findIndex(
            (entry) => entry.godownId.toString() === godown._id.toString()
          );
          if (idx !== -1) {
            product.quantity[idx].quantity += oldItem.quantity; // Roll back
          }
          
          // Roll back sold count
          if (product.sold) {
            product.sold -= oldItem.quantity;
          } else {
            product.sold = -oldItem.quantity; // In case sold field doesn't exist
          }
          
          await product.save();
        }

        if (godown) {
          const idx = godown.stock.findIndex(
            (entry) => entry.productId.toString() === oldItem.productId.toString()
          );
          if (idx !== -1) {
            godown.stock[idx].quantity += oldItem.quantity;
          }
          await godown.save();
        }
      }

      // Update Sale
      sale.invoiceNumber = invoiceNumber;
      sale.buyerId = buyerId;
      sale.items = items;
      sale.modeOfTransport = modeOfTransport;
      sale.remark = remark;
      await sale.save();
    } else {
      // ----------- 2. Handle Create -----------
      sale = new Sales({
        invoiceNumber,
        buyerId,
        items,
        modeOfTransport,
        remark,
      });
      await sale.save();
    }

    // ----------- 3. Update Inventory and Sold Count -----------
    for (let item of items) {
      const product = await Product.findById(item.productId);
      const godown = await Goddown.findById(item.godownId);

      if (product) {
        // Update stock quantity
        const idx = product.quantity.findIndex(
          (entry) => entry.godownId.toString() === godown._id.toString()
        );
        if (idx !== -1) {
          product.quantity[idx].quantity -= item.quantity;
        } else {
          product.quantity.push({ godownId: godown._id, quantity: -item.quantity });
        }
        
        // Update sold count
        if (product.sold) {
          product.sold += item.quantity;
        } else {
          product.sold = item.quantity; // Initialize if sold field doesn't exist
        }
        
        await product.save();
      }

      if (godown) {
        const idx = godown.stock.findIndex(
          (entry) => entry.productId.toString() === item.productId.toString()
        );
        if (idx !== -1) {
          godown.stock[idx].quantity -= item.quantity;
        } else {
          godown.stock.push({ productId: item.productId, quantity: -item.quantity });
        }
        await godown.save();
      }
    }

    return NextResponse.json(
      { success: true, message: id ? "Sale updated" : "Sale created", data: sale },
      { status: id ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error handling sale:", error);
    return NextResponse.json(
      { success: false, message: "Error handling sale", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await connect();
    
    const { searchParams } = new URL(req.url);
    const saleId = searchParams.get("id");
    
    if (!saleId) {
      return NextResponse.json(
        { message: "Sale ID is required", success: false },
        { status: 400 }
      );
    }
    
    // Find the sale to be deleted
    const sale = await Sales.findById(saleId);
    
    if (!sale) {
      return NextResponse.json(
        { message: "Sale not found", success: false },
        { status: 404 }
      );
    }
    
    // Restore stock and sold count for each item in the sale
    for (let item of sale.items) {
      const product = await Product.findById(item.productId);
      const godown = await Goddown.findById(item.godownId);
      
      // Update product quantity
      if (product) {
        const idx = product.quantity.findIndex(
          (entry) => entry.godownId.toString() === godown._id.toString()
        );
        if (idx !== -1) {
          product.quantity[idx].quantity += item.quantity;
        } else {
          product.quantity.push({ godownId: godown._id, quantity: item.quantity });
        }
        
        // Restore sold count (decrement it)
        if (product.sold) {
          product.sold -= item.quantity;
          // Ensure sold doesn't go negative
          if (product.sold < 0) {
            product.sold = 0;
          }
        } else {
          // If sold field doesn't exist, no need to do anything
          // as this means no sales were recorded for this product yet
        }
        
        await product.save();
      }
      
      // Update godown stock
      if (godown) {
        const idx = godown.stock.findIndex(
          (entry) => entry.productId.toString() === item.productId.toString()
        );
        if (idx !== -1) {
          godown.stock[idx].quantity += item.quantity;
        } else {
          godown.stock.push({ productId: item.productId, quantity: item.quantity });
        }
        await godown.save();
      }
    }
    
    // Delete the sale
    await Sales.findByIdAndDelete(saleId);
    
    return NextResponse.json(
      { success: true, message: "Sale deleted, stock and sold count restored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting sale", error: error.message },
      { status: 500 }
    );
  }
}