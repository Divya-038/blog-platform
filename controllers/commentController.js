const { query } = require('../database/db');

// Get all comments for a post
async function getPostComments(req, res) {
  try {
    const postId = req.params.postId || req.query.postId;
    const currentUserId = req.user ? req.user.id : null;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required.'
      });
    }

    const comments = await query.all(
      `SELECT 
        c.id, c.post_id, c.content, c.created_at, c.updated_at,
        u.id as user_id, u.name as user_name, u.username as user_username, 
        u.avatar_url as user_avatar, u.role as user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    // Annotate with is_owner flag
    const enriched = comments.map(c => ({
      ...c,
      is_owner: currentUserId ? c.user_id === currentUserId : false
    }));

    return res.json({
      success: true,
      data: enriched,
      count: enriched.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch comments.'
    });
  }
}

// Add a comment to a post
async function addComment(req, res) {
  try {
    const postId = req.params.postId || req.body.post_id;
    const { content } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required.'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.'
      });
    }

    // Verify post exists
    const post = await query.get('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    const result = await query.run(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content.trim()]
    );

    const newComment = await query.get(
      `SELECT 
        c.id, c.post_id, c.content, c.created_at, c.updated_at,
        u.id as user_id, u.name as user_name, u.username as user_username, 
        u.avatar_url as user_avatar, u.role as user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully!',
      data: {
        ...newComment,
        is_owner: true
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to post comment.'
    });
  }
}

// Update an existing comment (author only)
async function updateComment(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const currentUserId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.'
      });
    }

    const comment = await query.get('SELECT * FROM comments WHERE id = ?', [id]);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    // Check ownership
    if (comment.user_id !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own comments.'
      });
    }

    await query.run(
      'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content.trim(), id]
    );

    const updatedComment = await query.get(
      `SELECT 
        c.id, c.post_id, c.content, c.created_at, c.updated_at,
        u.id as user_id, u.name as user_name, u.username as user_username, 
        u.avatar_url as user_avatar, u.role as user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Comment updated successfully!',
      data: {
        ...updatedComment,
        is_owner: true
      }
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update comment.'
    });
  }
}

// Delete a comment (author of comment or author of post or admin)
async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const comment = await query.get(
      `SELECT c.*, p.author_id as post_author_id 
       FROM comments c 
       JOIN posts p ON c.post_id = p.id 
       WHERE c.id = ?`,
      [id]
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    // Allow comment author OR post author OR admin to delete
    const isCommentAuthor = comment.user_id === currentUserId;
    const isPostAuthor = comment.post_author_id === currentUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this comment.'
      });
    }

    await query.run('DELETE FROM comments WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Comment deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete comment.'
    });
  }
}

module.exports = {
  getPostComments,
  addComment,
  updateComment,
  deleteComment
};
