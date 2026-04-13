import mongoose from 'mongoose';

/**
 * Establishes connection to MongoDB database
 * Uses connection string from environment variables
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8+ handles these options automatically
    });

    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
