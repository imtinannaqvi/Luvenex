import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('Database Connected');
    } catch (error) {
        console.error("DB Connection Error", error.message);
        process.exit(1);
    }

    // ✅ Handle connection drops gracefully instead of letting them crash the process
    mongoose.connection.on('disconnected', () => {
        console.log('[DB] Disconnected — Mongoose will attempt to reconnect automatically...');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('[DB] Reconnected successfully');
    });

    mongoose.connection.on('error', (err) => {
        console.error('[DB] Connection error:', err.message);
    });
};