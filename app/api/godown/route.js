import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Godown from '../../../models/godown';

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
        godownName: { $regex: search, $options: 'i' }
      };
    }
    
    const godowns = await Godown.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Godown.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: godowns,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching godowns:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch godowns' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { godownName } = await request.json();
    
    // Check if godown with the same name already exists
    const existingGodown = await Godown.findOne({ 
      godownName: { $regex: `^${godownName}$`, $options: 'i' } 
    });
    
    if (existingGodown) {
      return NextResponse.json({ 
        success: false,
        error: 'A godown with this name already exists' 
      }, { status: 409 });
    }
    
    const godown = new Godown({ godownName });
    await godown.save();
    
    return NextResponse.json({
      success: true,
      data: godown,
      message: 'Godown created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating godown:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create godown' 
    }, { status: 500 });
  }
}