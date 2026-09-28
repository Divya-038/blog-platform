const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public / optional auth endpoints
router.get('/', optionalAuth, postController.getAllPosts);
router.get('/categories', postController.getCategories);
router.get('/:identifier', optionalAuth, postController.getPostByIdOrSlug);

// Protected endpoints
router.post('/', authenticateToken, postController.createPost);
router.put('/:id', authenticateToken, postController.updatePost);
router.delete('/:id', authenticateToken, postController.deletePost);
router.post('/:id/like', authenticateToken, postController.toggleLike);

module.exports = router;
