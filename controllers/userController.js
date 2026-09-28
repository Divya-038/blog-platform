const bcrypt = require('bcryptjs');
const { query } = require('../database/db');

// Get public profile of a user by username or ID
async function getUserProfile(req, res) {
  try {
    const { identifier } = req.params;

    const user = await query.get(
      `SELECT id, username, email, name, bio, avatar_url, role, created_at 
       FROM users 
       WHERE username = ? OR id = ?`,
      [identifier, identifier]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    // Get statistics
    const stats = await query.get(
      `SELECT 
        (SELECT COUNT(*) FROM posts WHERE author_id = ?) as total_posts,
        (SELECT COALESCE(SUM(likes_count), 0) FROM posts WHERE author_id = ?) as total_likes,
        (SELECT COUNT(*) FROM comments WHERE user_id = ?) as total_comments`,
      [user.id, user.id, user.id]
    );

    // Hide email if viewing someone else's public profile and not authenticated as them
    const isOwner = req.user && req.user.id === user.id;
    if (!isOwner) {
      delete user.email;
    }

    return res.json({
      success: true,
      data: {
        ...user,
        stats: {
          total_posts: stats.total_posts || 0,
          total_likes: stats.total_likes || 0,
          total_comments: stats.total_comments || 0
        },
        is_owner: isOwner
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.'
    });
  }
}

// Update current user's profile
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, bio, avatar_url, currentPassword, newPassword } = req.body;

    const user = await query.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const updatedName = name !== undefined && name.trim() !== '' ? name.trim() : user.name;
    const updatedBio = bio !== undefined ? bio.trim() : user.bio;
    const updatedAvatar = avatar_url !== undefined && avatar_url.trim() !== '' 
      ? avatar_url.trim() 
      : user.avatar_url;

    // If password change is requested
    let updatedPassword = user.password;
    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.'
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password entered is incorrect.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      updatedPassword = await bcrypt.hash(newPassword, salt);
    }

    await query.run(
      `UPDATE users 
       SET name = ?, bio = ?, avatar_url = ?, password = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [updatedName, updatedBio, updatedAvatar, updatedPassword, userId]
    );

    const updatedUser = await query.get(
      'SELECT id, username, email, name, bio, avatar_url, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
}

// Get all posts authored by a user
async function getUserPosts(req, res) {
  try {
    const { identifier } = req.params;

    const user = await query.get(
      'SELECT id FROM users WHERE username = ? OR id = ?',
      [identifier, identifier]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const posts = await query.all(
      `SELECT 
        p.id, p.title, p.slug, p.summary, p.cover_image, p.category, p.tags, 
        p.read_time, p.views, p.likes_count, p.created_at, p.updated_at,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
       FROM posts p
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC`,
      [user.id]
    );

    return res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error getting user posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user posts.'
    });
  }
}

module.exports = {
  getUserProfile,
  updateProfile,
  getUserPosts
};
