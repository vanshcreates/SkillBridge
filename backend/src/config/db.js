
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    if (
      uri.includes("<username>") ||
      uri.includes("<password>") ||
      uri.includes("cluster0.example.mongodb.net")
    ) {
      throw new Error(
        "MONGODB_URI still contains the example MongoDB host. Set it to your actual MongoDB connection string.",
      );
    }

    const conn = await mongoose.connect(uri, {
      dbName: "skillbridge",
    });

    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};
