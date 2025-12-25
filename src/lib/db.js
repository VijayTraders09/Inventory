import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://vijaytraders474:inventory@cluster0.zappi.mongodb.net/inventory_production';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/** 
 * Cached connection for MongoDB.
 */
let connection ={} ;

async function connect() {
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

export default connect;
