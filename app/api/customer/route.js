import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Customer from '../../../models/customer';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = { 
        customerName: { $regex: search, $options: 'i' }
      };
    }
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Customer.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch customers' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { customerName } = await request.json();
    
    // Check if customer with the same name already exists
    const existingCustomer = await Customer.findOne({ 
      customerName: { $regex: `^${customerName}$`, $options: 'i' } 
    });
    
    if (existingCustomer) {
      return NextResponse.json({ 
        success: false,
        error: 'A customer with this name already exists' 
      }, { status: 409 });
    }
    
    const customer = new Customer({ customerName });
    await customer.save();
    
    return NextResponse.json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create customer' 
    }, { status: 500 });
  }
}