const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    topic: {
        type: String,
        trim: true,
        default: 'General Inquiry'
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'replied'],
        default: 'unread'
    },
    adminReply: {
        type: String,
        default: '',
        trim: true
    },
    repliedAt: {
        type: Date
    }
}, {
    timestamps: true
});

messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ email: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = Message;

