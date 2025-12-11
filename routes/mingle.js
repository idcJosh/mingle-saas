const router = require('express').Router();
const MinglePost = require('../models/MinglePost');
const User = require('../models/User');
const verifyToken = require('../verifyToken');

const ALLOWED_TOPICS = ['Politics', 'Health', 'Sport', 'Tech'];

// --- HELPER: CHECK EXPIRATION ---
// Checks if a post has passed its time limit and updates status automatically
const checkExpiration = async (post) => {
    if (new Date() > new Date(post.expiresAt)) {
        post.status = 'Expired';
        await post.save();
        return true; // It IS expired
    }
    return false; // It is NOT expired
};

// --- ACTION 2: POST A MESSAGE ---
router.post('/:topic', verifyToken, async (req, res) => {
    if (!ALLOWED_TOPICS.includes(req.params.topic)) {
        return res.status(400).send("Invalid Topic Request");
    }

    try {
        const user = await User.findOne({ _id: req.user._id });
        
        // Expiration: Default 24h, or use custom minutes (for testing)
        const expirationTime = new Date();
        const minutes = req.body.expirationMinutes || 1440; 
        expirationTime.setMinutes(expirationTime.getMinutes() + minutes);

        const post = new MinglePost({
            title: req.body.title,
            message: req.body.description,
            topic: req.params.topic,
            status: 'Live',
            likes: 0, 
            dislikes: 0,
            ownerId: req.user._id,
            ownerName: user.username,
            expiresAt: expirationTime,
            comments: [] // Initialize empty comments array
        });

        const savedPost = await post.save();
        res.send({ post: savedPost._id, message: "Post created successfully!" });

    } catch (err) {
        res.status(400).send(err);
    }
});

// --- ACTION 3: BROWSE ALL ACTIVE POSTS ---
router.get('/:topic/active', verifyToken, async (req, res) => {
    if (!ALLOWED_TOPICS.includes(req.params.topic)) {
        return res.status(400).send("Invalid Topic Request");
    }

    try {
        let posts = await MinglePost.find({ topic: req.params.topic, status: 'Live' });
        
        // Lazy Check: Update expiration status before showing
        const livePosts = [];
        for (let post of posts) {
            const isExpired = await checkExpiration(post);
            if (!isExpired) {
                livePosts.push(post);
            }
        }

        if (livePosts.length === 0) return res.status(404).json({ message: "No active posts in this topic" });
        
        res.json(livePosts); 

    } catch (err) {
        res.status(500).json({ message: err });
    }
});

// --- ACTION 5: HIGHEST INTEREST (BEST POST) ---
router.get('/:topic/best', verifyToken, async (req, res) => {
    try {
        let posts = await MinglePost.find({ topic: req.params.topic, status: 'Live' });
        
        // Sort by Interest (Likes + Dislikes)
        posts.sort((a, b) => (b.likes + b.dislikes) - (a.likes + a.dislikes));
        
        if (posts.length > 0 && !(await checkExpiration(posts[0]))) {
            res.json(posts[0]);
        } else {
            res.status(404).json({ message: "No active posts" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

// --- ACTION 6: BROWSE EXPIRED HISTORY ---
router.get('/:topic/expired', verifyToken, async (req, res) => {
    try {
        const allPosts = await MinglePost.find({ topic: req.params.topic });
        for (let post of allPosts) { await checkExpiration(post); }

        const expiredPosts = await MinglePost.find({ topic: req.params.topic, status: 'Expired' });
        
        if (expiredPosts.length === 0) return res.status(404).json({ message: "No expired history for this topic" });
        res.json(expiredPosts);

    } catch (err) {
        res.status(500).json({ message: err });
    }
});

// --- ACTION 4: LIKE or DISLIKE ---
router.patch('/:postId/:action', verifyToken, async (req, res) => {
    try {
        const post = await MinglePost.findById(req.params.postId);
        if (!post) return res.status(404).send("Post not found");

        if (await checkExpiration(post)) return res.status(400).send("Post is expired!");
        if (post.ownerId === req.user._id) return res.status(400).send("Cannot like your own post!");

        if (req.params.action === 'like') {
            post.likes += 1;
        } else if (req.params.action === 'dislike') {
            post.dislikes += 1;
        } else {
            return res.status(400).send("Invalid action");
        }

        const updatedPost = await post.save();
        
        res.json({ 
            message: "Success", 
            currentLikes: updatedPost.likes,
            currentDislikes: updatedPost.dislikes 
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- EXTRA: ADD COMMENT ---
router.post('/:postId/comment', verifyToken, async (req, res) => {
    try {
        const post = await MinglePost.findById(req.params.postId);
        const user = await User.findOne({ _id: req.user._id });

        if (await checkExpiration(post)) return res.status(400).send("Post is expired!");

        post.comments.push({ 
            text: req.body.text, 
            ownerName: user.username 
        });
        
        await post.save();
        res.json({ message: "Comment added!" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;