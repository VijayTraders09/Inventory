import { NextResponse } from 'next/server';
import Customer from '../../../../models/customer';
import connectDB from '../../../../lib/db';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { customerName } = await request.json();
    const {id} = await params;
    
    // Check if another customer with the same name already exists
    const existingCustomer = await Customer.findOne({ 
      customerName: { $regex: `^${customerName}$`, $options: 'i' },
      _id: { $ne: id }
    });
    
    if (existingCustomer) {
      return NextResponse.json({ 
        success: false,
        error: 'A customer with this name already exists' 
      }, { status: 409 });
    }
    
    const customer = await Customer.findByIdAndUpdate(
      id,
      { customerName },
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return NextResponse.json({ 
        success: false,
        error: 'Customer not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update customer' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const {id} = await params
    const customer = await Customer.findByIdAndDelete(id);
    
    if (!customer) {
      return NextResponse.json({ 
        success: false,
        error: 'Customer not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete customer' 
    }, { status: 500 });
  }
}