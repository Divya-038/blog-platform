const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get comments for a post
router.get('/post/:postId', optionalAuth, commentController.getPostComments);

// Add comment to post
router.post('/post/:postId', authenticateToken, commentController.addComment);

// Update comment
router.put('/:id', authenticateToken, commentController.updateComment);

// Delete comment
router.delete('/:id', authenticateToken, commentController.deleteComment);

module.exports = router;
