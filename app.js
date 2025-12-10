const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv/config'); // Loads your .env file


app.use(bodyParser.json()); 

// Import Routes
const authRoute = require('./routes/auth');
const mingleRoute = require('./routes/mingle');

// Use Routes
app.use('/api/user', authRoute);
app.use('/api/mingle', mingleRoute);

// Check if server is up
app.get('/', (req, res) => {
    res.send('Mingle SaaS API is running!');
});

// Connect to Database using .env
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