import mongoose from 'mongoose';

const MONGODB_URI =  process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/** 
 * Cached connection for MongoDB.
 */
let connection ={} ;

async function connectDB() {
  if (connection?.isConnected) {
    console.log('Already Connected')
    return 
  }

  try {
    const db = await mongoose.connect(MONGODB_URI)
    connection.isConnected = db.connections[0].readyState
    console.log('DB Connected')
  } catch (error) {
    console.log(error)
  }

}

export default connectDB;
