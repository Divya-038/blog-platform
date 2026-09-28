const { query } = require('../database/db');

// Helper to generate a clean URL slug from title
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'post'}-${Date.now().toString().slice(-6)}`;
}

// Calculate approximate read time in minutes
function calculateReadTime(content) {
  const words = (content || '').trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Get all posts (with search, category, tag, author filters, and pagination)
async function getAllPosts(req, res) {
  try {
    const { search, category, tag, author, sort, page = 1, limit = 9 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const parsedLimit = Math.max(1, Math.min(50, parseInt(limit, 10)));

    let sql = `
      SELECT 
        p.id, p.title, p.slug, p.summary, p.cover_image, p.category, p.tags, 
        p.read_time, p.views, p.likes_count, p.created_at, p.updated_at,
        u.id as author_id, u.name as author_name, u.username as author_username, 
        u.avatar_url as author_avatar,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      sql += ` AND (p.title LIKE ? OR p.content LIKE ? OR p.summary LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'All' && category.trim() !== '') {
      sql += ` AND LOWER(p.category) = LOWER(?)`;
      params.push(category.trim());
    }

    if (tag && tag.trim() !== '') {
      sql += ` AND LOWER(p.tags) LIKE LOWER(?)`;
      params.push(`%${tag.trim()}%`);
    }

    if (author && author.trim() !== '') {
      sql += ` AND (u.username = ? OR u.id = ?)`;
      params.push(author.trim(), author.trim());
    }

    // Total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as sub`;
    const totalRow = await query.get(countSql, params);
    const total = totalRow ? totalRow.total : 0;

    // Sorting
    if (sort === 'popular') {
      sql += ` ORDER BY (p.likes_count * 2 + p.views) DESC, p.created_at DESC`;
    } else if (sort === 'oldest') {
      sql += ` ORDER BY p.created_at ASC`;
    } else {
      sql += ` ORDER BY p.created_at DESC`;
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(parsedLimit, offset);

    const posts = await query.all(sql, params);

    return res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve blog posts.'
    });
  }
}

// Get single post by slug or ID
async function getPostByIdOrSlug(req, res) {
  try {
    const { identifier } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const post = await query.get(
      `SELECT 
        p.*,
        u.id as author_id, u.name as author_name, u.username as author_username, 
        u.bio as author_bio, u.avatar_url as author_avatar,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.slug = ? OR p.id = ?`,
      [identifier, identifier]
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    // Increment view count asynchronously
    query.run('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]).catch(() => {});

    // Check if the current user has liked this post
    let userHasLiked = false;
    if (currentUserId) {
      const like = await query.get(
        'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
        [post.id, currentUserId]
      );
      userHasLiked = !!like;
    }

    // Check if current user is author
    const isAuthor = currentUserId === post.author_id;

    return res.json({
      success: true,
      data: {
        ...post,
        views: post.views + 1,
        has_liked: userHasLiked,
        is_author: isAuthor
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch post details.'
    });
  }
}

// Create a new blog post
async function createPost(req, res) {
  try {
    const { title, content, summary, cover_image, category, tags } = req.body;
    const authorId = req.user.id;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post title is required.'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required.'
      });
    }

    const cleanTitle = title.trim();
    const slug = generateSlug(cleanTitle);
    const readTime = calculateReadTime(content);
    const postSummary = summary && summary.trim() !== ''
      ? summary.trim()
      : content.replace(/[#*`_>\[\]]/g, '').trim().slice(0, 160) + '...';

    // Default cover image if omitted
    const defaultCovers = [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'
    ];
    const finalCover = cover_image && cover_image.trim() !== ''
      ? cover_image.trim()
      : defaultCovers[Math.floor(Math.random() * defaultCovers.length)];

    const finalCategory = (category && category.trim()) || 'General';
    const finalTags = (tags && tags.trim()) || '';

    const result = await query.run(
      `INSERT INTO posts (title, slug, summary, content, cover_image, category, tags, author_id, read_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cleanTitle, slug, postSummary, content.trim(), finalCover, finalCategory, finalTags, authorId, readTime]
    );

    const newPost = await query.get(
      `SELECT p.*, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`,
      [result.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Blog post published successfully!',
      data: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create blog post.'
    });
  }
}

// Update an existing blog post (Author only)
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { title, content, summary, cover_image, category, tags } = req.body;
    const currentUserId = req.user.id;

    // Check post existence and author ownership
    const post = await query.get('SELECT * FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    if (post.author_id !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own posts.'
      });
    }

    const newTitle = title !== undefined ? title.trim() : post.title;
    const newContent = content !== undefined ? content.trim() : post.content;
    const newSummary = summary !== undefined 
      ? summary.trim() 
      : (newContent.replace(/[#*`_>\[\]]/g, '').trim().slice(0, 160) + '...');
    const newCover = cover_image !== undefined ? cover_image.trim() : post.cover_image;
    const newCategory = category !== undefined ? category.trim() : post.category;
    const newTags = tags !== undefined ? tags.trim() : post.tags;
    const newReadTime = calculateReadTime(newContent);

    // If title changed, update slug
    let newSlug = post.slug;
    if (title && title.trim() !== post.title) {
      newSlug = generateSlug(newTitle);
    }

    await query.run(
      `UPDATE posts 
       SET title = ?, slug = ?, summary = ?, content = ?, cover_image = ?, category = ?, tags = ?, read_time = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newTitle, newSlug, newSummary, newContent, newCover, newCategory, newTags, newReadTime, id]
    );

    const updatedPost = await query.get(
      `SELECT p.*, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Post updated successfully!',
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update blog post.'
    });
  }
}

// Delete an existing blog post (Author only)
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const post = await query.get('SELECT * FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    if (post.author_id !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own posts.'
      });
    }

    // Delete post (foreign keys ON will cascade delete comments and likes)
    await query.run('DELETE FROM posts WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Post deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete blog post.'
    });
  }
}

// Toggle like on a post
async function toggleLike(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await query.get('SELECT id, likes_count FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    const existingLike = await query.get(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, userId]
    );

    let hasLiked = false;
    if (existingLike) {
      // Unlike
      await query.run('DELETE FROM post_likes WHERE id = ?', [existingLike.id]);
      await query.run('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?', [id]);
      hasLiked = false;
    } else {
      // Like
      await query.run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, userId]);
      await query.run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [id]);
      hasLiked = true;
    }

    const updated = await query.get('SELECT likes_count FROM posts WHERE id = ?', [id]);

    return res.json({
      success: true,
      has_liked: hasLiked,
      likes_count: updated.likes_count
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update like status.'
    });
  }
}

// Get categories & popular tags
async function getCategories(req, res) {
  try {
    const categories = await query.all(
      `SELECT category, COUNT(*) as count 
       FROM posts 
       WHERE category IS NOT NULL AND category != ''
       GROUP BY category 
       ORDER BY count DESC`
    );

    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load categories.'
    });
  }
}

module.exports = {
  getAllPosts,
  getPostByIdOrSlug,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  getCategories
};
