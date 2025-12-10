const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcryptjs = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');

// Import validation logic from other file
const { registerValidation, loginValidation } = require('../validation');

// REGISTER ROUTE
router.post('/register', async (req, res) => {
    // Validate the data before making a user
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    // Check if user already exists
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).send({ message: 'Email already exists' });

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(req.body.password, salt);

    // Create a new user
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword
    });

    // Saves user to MongoDB Database
    try {
        const savedUser = await user.save();
        res.send({ user: user._id, username: user.username });
    } catch (err) {
        res.status(400).send({ message: err });
    }
});


router.post('/login', async (req, res) => {
    // Validate the data
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    // Check if email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send({ message: 'Email is not found' });

    // Check Password
    const validPass = await bcryptjs.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send({ message: 'Invalid password' });

    // Create and assign a token
     const token = jsonwebtoken.sign(
        { _id: user._id, username: user.username }, 
        process.env.TOKEN_SECRET
    );
    
    // Return token in header and body
    res.header('auth-token', token).send({ 'token': token });
});

module.exports = router;