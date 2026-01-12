import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Transport from '../../../models/transport';

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
        name: { $regex: search, $options: 'i' }
      };
    }
    
    const transports = await Transport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transport.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: transports,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transports:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch transports' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ 
        success: false,
        error: 'Transport name is required' 
      }, { status: 400 });
    }
    
    // Check if transport with the same name already exists (case insensitive)
    const existingTransport = await Transport.findOne({ 
      name: { $regex: `^${name}$`, $options: 'i' } 
    });
    
    if (existingTransport) {
      return NextResponse.json({ 
        success: false,
        error: 'A transport with this name already exists' 
      }, { status: 409 });
    }
    
    const transport = new Transport({ name: name.trim() });
    await transport.save();
    
    return NextResponse.json({
      success: true,
      data: transport,
      message: 'Transport created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating transport:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create transport' 
    }, { status: 500 });
  }
}