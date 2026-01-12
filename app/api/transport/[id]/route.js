import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Transport from '../../../../models/transport';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ 
        success: false,
        error: 'Transport name is required' 
      }, { status: 400 });
    }
    
    // Check if transport with this name already exists (excluding current one)
    const existingTransport = await Transport.findOne({ 
      _id: { $ne: id },
      name: { $regex: `^${name}$`, $options: 'i' } 
    });
    
    if (existingTransport) {
      return NextResponse.json({ 
        success: false,
        error: 'A transport with this name already exists' 
      }, { status: 409 });
    }
    
    const updatedTransport = await Transport.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
    
    if (!updatedTransport) {
      return NextResponse.json({ 
        success: false,
        error: 'Transport not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedTransport,
      message: 'Transport updated successfully'
    });
  } catch (error) {
    console.error('Error updating transport:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update transport' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    const deletedTransport = await Transport.findByIdAndDelete(id);
    
    if (!deletedTransport) {
      return NextResponse.json({ 
        success: false,
        error: 'Transport not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: deletedTransport,
      message: 'Transport deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transport:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete transport' 
    }, { status: 500 });
  }
}