import mongoose from 'mongoose';

/**
 * Establishes a robust, production-ready connection to MongoDB Atlas.
 * Includes connection pooling and event listeners for cloud environments.
 */
const connectDB = async () => {
  try {
    // Check if URI exists to prevent cryptic errors during deployment
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined.");
    }

    // Connect with optimized options for cloud deployments
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`✓ MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
    
    // Listen for transient cloud connection issues AFTER initial connection
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`✗ MongoDB Connection Error: ${err.message}`);
    });

    return conn;
  } catch (error) {
    console.error(`✗ Fatal MongoDB Connection Error: ${error.message}`);
    // Exit with failure immediately so the deployment container knows it failed to boot
    process.exit(1); 
  }
};

export default connectDB;