const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

// Helper to generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Register user
async function register(req, res) {
  try {
    const { username, email, password, name, bio, avatar_url } = req.body;

    // Validation
    if (!username || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and name are required.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if username or email already exists
    const existing = await query.get(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existing) {
      if (existing.username === cleanUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken. Please choose another.'
        });
      }
      if (existing.email === cleanEmail) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default avatar if none provided
    const avatar = avatar_url && avatar_url.trim() !== ''
      ? avatar_url.trim()
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=6366f1,8b5cf6,ec4899`;

    const userBio = bio ? bio.trim() : `Hello! I'm ${name.trim()}, a passionate reader and writer on BlogSphere.`;

    const result = await query.run(
      `INSERT INTO users (username, email, password, name, bio, avatar_url, role)
       VALUES (?, ?, ?, ?, ?, ?, 'author')`,
      [cleanUsername, cleanEmail, hashedPassword, name.trim(), userBio, avatar]
    );

    const newUser = await query.get(
      'SELECT id, username, email, name, bio, avatar_url, role, created_at FROM users WHERE id = ?',
      [result.id]
    );

    const token = generateToken(newUser.id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.'
    });
  }
}

// Login user
async function login(req, res) {
  try {
    const { identifier, email, password } = req.body;
    const loginIdentifier = (identifier || email || '').trim().toLowerCase();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/username and password.'
      });
    }

    // Search by email or username
    const user = await query.get(
      `SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?`,
      [loginIdentifier, loginIdentifier]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.'
      });
    }

    const token = generateToken(user.id);

    // Exclude password from response
    const { password: _, ...userSafe } = user;

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: userSafe
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
}

// Get current authenticated user
async function getMe(req, res) {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current user profile.'
    });
  }
}

// Logout user (stateless endpoint for client consistency)
async function logout(req, res) {
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}

module.exports = {
  register,
  login,
  getMe,
  logout
};
