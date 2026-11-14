const mongoose = require('mongoose');

const ProductRequestSchema = new mongoose.Schema({
    requestCode: {
        type: String,
        unique: true,
        required: true,
        default: () => 'DE-' + Math.floor(100000 + Math.random() * 900000)
    },
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    specifications: {
        type: String,
        required: [true, 'Specifications or details are required'],
        trim: true
    },
    referenceUrl: {
        type: String,
        trim: true,
        default: ''
    },
    targetBudget: {
        type: Number,
        min: 0,
        default: null
    },
    customerName: {
        type: String,
        required: [true, 'Your name is required'],
        trim: true
    },
    customerPhone: {
        type: String,
        required: [true, 'Phone/WhatsApp number is required'],
        trim: true
    },
    customerEmail: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'In Review', 'Quoted', 'Sourced in Germany', 'Shipped to Egypt', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    quotedPrice: {
        type: Number,
        default: null
    },
    adminNotes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const ProductRequest = mongoose.models.ProductRequest || mongoose.model('ProductRequest', ProductRequestSchema);

module.exports = ProductRequest;
