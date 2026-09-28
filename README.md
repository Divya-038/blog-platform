# 🌟 BlogSphere — Modern Full-Stack Blog Platform with Comments

A modern, responsive, and production-grade Blog Publishing Platform built with **Node.js, Express, SQLite, and vanilla ES6+**. Zero external database configuration required — works out of the box with realistic seed data, JWT authentication, rich markdown writing, and full ownership-controlled posts and comments.

---

## ✨ Features

- **🔐 Authentication & Authorization:**
  - Secure user registration and login with `bcryptjs` password hashing and stateless `jsonwebtoken` (JWT).
  - 1-click **Demo Logins** on the login page for instantaneous testing without typing.
  - Granular ownership verification: Users can only edit or delete their **own** posts and comments.

- **📝 Post Management (CRUD):**
  - **Create Posts:** Rich Markdown editor with live preview toggle, preset wallpaper selection, tags, and category picker.
  - **Read Posts:** Full post reader with calculated read-time, view counters, like counts, author biography, and rendered markdown code blocks.
  - **Edit Posts:** Authors can update title, content, tags, category, and cover image.
  - **Delete Posts:** Authors can delete posts with confirmation modal (automatically cascades to delete related comments and likes).
  - **Search & Filters:** Real-time search by keyword, category filtering, tag filtering, and sorting (Newest, Most Popular, Oldest).

- **💬 Dynamic Comments System:**
  - View comments on any post with author avatars, names, and relative timestamps (`2m ago`, `3h ago`).
  - Add comments with immediate feed updates.
  - **Inline Comment Editing:** Comment authors can edit their comment directly within the thread.
  - **Comment Deletion:** Comment authors or article authors can delete comments with confirmation prompts.

- **👤 User Profiles & Statistics:**
  - Public author profile pages showing total articles published, total likes accumulated, and comment activity.
  - Author's full catalogue of published articles with direct Read, Edit, and Delete actions.
  - "Edit Profile" modal to update display name, biography, avatar URL, or change account password.

- **🎨 Modern Aesthetic & Ergonomics:**
  - Glassmorphic translucent cards, custom CSS variables, and vibrant gradients.
  - Google Fonts (`Plus Jakarta Sans` & `JetBrains Mono`).
  - **Dark Mode / Light Mode** theme toggle with localStorage persistence.
  - Toast notification system (Success, Error, Info) and modal dialogs.
  - 100% mobile-responsive layout with slide-out navigation menu.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher — tested on v24+)
- **npm** (included with Node.js)

### 1. Install & Run in 1 Step
From the project folder:
```bash
# Navigate to the project directory
cd blog-platform

# Install dependencies (Express, SQLite3, Bcrypt, JWT, etc.)
npm install

# Start the application
npm start
```

That's it! The server will automatically initialize SQLite (`database/blog.db`), apply schemas, and seed initial demo users, high-quality articles, and comments.

Open your browser to:
👉 **`http://localhost:3000`**

---

## 👥 Demo Accounts (Pre-configured)

Use any of these demo accounts (or click the **1-Click Demo Login** buttons on `/login`):

| Name | Email / Username | Password | Role |
| :--- | :--- | :--- | :--- |
| **Alex Turner** | `alex@example.com` (`alexturner`) | `password123` | Senior Fullstack Dev |
| **Sophia Chen** | `sophia@example.com` (`sophiachen`) | `password123` | Lead Product Designer |
| **Marcus Vance** | `marcus@example.com` (`marcusvance`) | `password123` | AI Cloud Architect |

*You can also register any new custom account from the `/register` page at any time.*

---

## 📡 RESTful API Documentation

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in with email/username & password | No |
| `GET` | `/api/auth/me` | Fetch authenticated user data | Yes (Bearer Token) |
| `POST` | `/api/auth/logout` | Client session logout | No |

### 📰 Posts (`/api/posts`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | List posts (filters: `search`, `category`, `tag`, `sort`, `page`, `limit`) | Optional |
| `GET` | `/api/posts/categories`| List all post categories with counts | No |
| `GET` | `/api/posts/:identifier`| Get post details by slug or numeric ID | Optional |
| `POST` | `/api/posts` | Create a new blog post | Yes |
| `PUT` | `/api/posts/:id` | Update an existing post (Author only) | Yes |
| `DELETE`| `/api/posts/:id` | Delete a post (Author only) | Yes |
| `POST` | `/api/posts/:id/like` | Toggle like/unlike on a post | Yes |

### 💬 Comments (`/api/comments`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/comments/post/:postId` | Get all comments for a post | Optional |
| `POST` | `/api/comments/post/:postId` | Post a new comment | Yes |
| `PUT` | `/api/comments/:id` | Edit comment content (Author only) | Yes |
| `DELETE`| `/api/comments/:id` | Delete a comment (Author or Post Owner) | Yes |

### 👤 Users & Profiles (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/:identifier` | Get public author profile & statistics | Optional |
| `PUT` | `/api/users/profile` | Update current user's profile/password | Yes |
| `GET` | `/api/users/:identifier/posts` | Get all posts authored by a user | No |

---

## 📂 Project Architecture

```
blog-platform/
├── server.js               # Express application, middleware & route registration
├── package.json            # Project dependencies & npm scripts
├── .env                    # Environment configurations (PORT, JWT_SECRET, DB path)
│
├── database/
│   ├── db.js               # SQLite connection, async query promises & schema setup
│   ├── seed.js             # Initial database seed script (users, articles, comments)
│   └── blog.db             # Local SQLite database file (auto-generated)
│
├── middleware/
│   └── auth.js             # JWT verification middleware & optionalAuth handler
│
├── controllers/
│   ├── authController.js   # User registration, login, JWT issuance
│   ├── postController.js   # Post CRUD, slug generation, like toggle, filtering
│   ├── commentController.js# Comment CRUD and ownership checking
│   └── userController.js   # Author profiles, stats, profile edit, authored posts
│
├── routes/
│   ├── authRoutes.js       # /api/auth routes
│   ├── postRoutes.js       # /api/posts routes
│   ├── commentRoutes.js    # /api/comments routes
│   └── userRoutes.js       # /api/users routes
│
└── public/                 # Modern Responsive Frontend (Vanilla HTML, CSS, JS)
    ├── index.html          # Semantic HTML5 layout with SEO meta & Google Fonts
    ├── css/
    │   ├── style.css       # Complete modern CSS design system & dark/light theme
    │   └── toast.css       # Toast notifications & modal dialog styles
    └── js/
        ├── api.js          # Fetch client wrapper with automatic token management
        ├── auth.js         # Reactive Auth State manager
        ├── components.js   # Toast, Modal, Markdown parser, PostCard renderer
        ├── router.js       # SPA client-side router with HTML5 history
        ├── app.js          # App initialization, theme switch, navbar state
        └── views/
            ├── homeView.js       # Landing page with hero, search, category pills
            ├── blogView.js       # Feed explorer with search, sorting & pagination
            ├── postDetailsView.js# Full article, like button, author box, comments
            ├── editorView.js     # Post editor with live Markdown preview
            ├── profileView.js    # Author profile, stats, edit modal, authored posts
            └── authView.js       # Login & Register forms with 1-click demo logins
```
