import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Godown from '../../../../models/godown';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { godownName } = await request.json();
    const {id} = await params;
    
    // Check if another godown with the same name already exists
    const existingGodown = await Godown.findOne({ 
      godownName: { $regex: `^${godownName}$`, $options: 'i' },
      _id: { $ne: id }
    });
    
    if (existingGodown) {
      return NextResponse.json({ 
        success: false,
        error: 'A godown with this name already exists' 
      }, { status: 409 });
    }
    
    const godown = await Godown.findByIdAndUpdate(
      id,
      { godownName },
      { new: true, runValidators: true }
    );
    
    if (!godown) {
      return NextResponse.json({ 
        success: false,
        error: 'Godown not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: godown,
      message: 'Godown updated successfully'
    });
  } catch (error) {
    console.error('Error updating godown:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update godown' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const {id}=await params
    const godown = await Godown.findByIdAndDelete(id);
    
    if (!godown) {
      return NextResponse.json({ 
        success: false,
        error: 'Godown not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Godown deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting godown:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete godown' 
    }, { status: 500 });
  }
}