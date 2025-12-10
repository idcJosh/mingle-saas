const mongoose = require('mongoose');

const MinglePostSchema = mongoose.Schema({
    // Basic Post Data
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true,
        enum: ['Politics', 'Health', 'Sport', 'Tech'] // Restricts input to only these 4
    },
    
    // Owner Information
    ownerId: {
        type: String, 
        required: true
    },
    ownerName: {
        type: String, 
        required: true
    },

    // Status & Expiration
    status: {
        type: String,
        default: 'Live',
        enum: ['Live', 'Expired']
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

    // Interactions
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    comments: [{
        userId: String,
        userName: String,
        text: String,
        date: { type: Date, default: Date.now }
    }]
}, {
    collection: 'posts' 
});

module.exports = mongoose.model('MinglePost', MinglePostSchema);