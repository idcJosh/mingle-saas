const express = require('express'); //imports express.js framework
const router = express.Router(); //creates route object for route paths
const MinglePost = require('../models/MinglePost');  //imports MinglePost database model
const verifyToken = require('../verifyToken'); //imports the security measure

router.get('/:topic/active', verifyToken, async (req, res) => { 
    try {
        // Define allowed topics
        const ALLOWED_TOPICS = ['Politics', 'Health', 'Sport', 'Tech'];

        // Checks if the topic requested by the user
        if (!ALLOWED_TOPICS.includes(req.params.topic)) { 
            return res.status(400).json({ message: "Invalid Topic" });
        }

        //Asks the database to find posts
        const posts = await MinglePost.find({ 
            topic: req.params.topic, 
            status: 'Live' 
        });

        // If no posts display error
        if (posts.length === 0) {
            return res.status(404).json({ message: "No active posts in this topic" });
        }

        // Sorting posts 
        const highestInterestPost = posts.sort((a, b) => {
            const interestA = a.likes + a.dislikes;
            const interestB = b.likes + b.dislikes;
            return interestB - interestA; // Descending order
        })[0]; 
        res.json(highestInterestPost);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;