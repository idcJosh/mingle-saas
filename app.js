const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv/config'); // Loads my .env file

// Built-in Middleware (already installed in termial but just to make sure)
app.use(express.json()); 

// Import Routes
const authRoute = require('./routes/auth');
const mingleRoute = require('./routes/mingle');

// Use Routes
app.use('/api/user', authRoute);
app.use('/api/mingle', mingleRoute);

// Default Route 
app.get('/', (req, res) => {
    res.send('Mingle SaaS API is running!');
});

// Connect to Database 
mongoose.connect(process.env.DB_CONNECTOR)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch((err) => {
        console.error('Error connecting to DB:', err);
    });

// Start the Server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});