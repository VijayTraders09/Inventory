import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Category from '../../../../models/category';


export async function PUT(request, { params }) {
  try {
    await connectDB();
    let {id} = await params
    const { categoryName } = await request.json();
    // Check if another category with the same name already exists
    const existingCategory = await Category.findOne({ 
      categoryName: { $regex: `^${categoryName}$`, $options: 'i' },
      _id: { $ne: id } // Exclude the current category being edited
    });
    
    if (existingCategory) {
      return NextResponse.json({ 
        error: 'A category with this name already exists' 
      }, { status: 409 }); // 409 Conflict
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { categoryName },
      { new: true }
    );
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    let {id} = await params
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}