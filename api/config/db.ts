import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.mongo || '';
    if (!mongoURI) {
      throw new Error('Mongo URI not found in .env');
    }
    
    // Use connect options to increase timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000, // 15 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    // Exit process on DB failure to let Docker restart it
    process.exit(1); 
  }
};

export default connectDB;
