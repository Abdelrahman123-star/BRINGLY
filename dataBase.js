const mongoose = require('mongoose');

const db = process.env.MONGODB_URI;

let isConnected = false;

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (!db) {
        console.warn("⚠️ Warning: MONGODB_URI is not set in environment variables.");
        return;
    }
    try {
        await mongoose.connect(db);
        isConnected = true;
        console.log("Connected to MongoDB Users Database");
    } catch (err) {
        console.error("MongoDB Connection Failed:", err);
    }
};

// Initiate connection if URI is available
if (db) {
    connectDB();
}

const LoginSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' },
    phone: { type: String },
    street: { type: String },
    city: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.Users || mongoose.model("Users", LoginSchema);
const Product = require('./models/Product');

module.exports = { User, Product, connectDB };
