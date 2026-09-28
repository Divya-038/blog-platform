const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Update current user's profile (placed before :identifier to avoid route collisions)
router.put('/profile', authenticateToken, userController.updateProfile);

// Get user profile
router.get('/:identifier', optionalAuth, userController.getUserProfile);

// Get posts authored by user
router.get('/:identifier/posts', userController.getUserPosts);

module.exports = router;
