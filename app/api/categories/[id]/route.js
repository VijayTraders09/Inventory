import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Category from '../../../../models/category';
import Stock from "../../../../models/stock";


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
    let { id } = await params;
    
    // Check if the category exists
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ 
        success: false,
        error: 'Category not found' 
      }, { status: 404 });
    }
    
    // Check if the category is being used in any stock records
    const stockCount = await Stock.countDocuments({ categoryId: id });
    
    if (stockCount > 0) {
      return NextResponse.json({ 
        success: false,
        error: `Cannot delete category. It is being used in ${stockCount} stock record(s). Please remove or update these records first.` 
      }, { status: 400 });
    }
    
    // If not in use, proceed with deletion
    await Category.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete category' 
    }, { status: 500 });
  }
}