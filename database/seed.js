const bcrypt = require('bcryptjs');
const { query, initDb } = require('./db');

async function seed() {
  try {
    await initDb();

    // Check if users already exist
    const existingUsers = await query.get('SELECT COUNT(*) as count FROM users');
    if (existingUsers && existingUsers.count > 0) {
      console.log(`Database already has ${existingUsers.count} users. Skipping seed.`);
      return;
    }

    console.log('Seeding initial database data...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Seed Users
    const users = [
      {
        username: 'alexturner',
        email: 'alex@example.com',
        name: 'Alex Turner',
        bio: 'Senior Fullstack Engineer & Open Source enthusiast. Writing about modern web architecture, JavaScript ecosystems, and microservices.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        role: 'author'
      },
      {
        username: 'sophiachen',
        email: 'sophia@example.com',
        name: 'Sophia Chen',
        bio: 'Lead Product Designer & UI/UX Specialist. Passionate about clean typography, glassmorphism, and micro-interactions.',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
        role: 'author'
      },
      {
        username: 'marcusvance',
        email: 'marcus@example.com',
        name: 'Marcus Vance',
        bio: 'AI Researcher & Cloud Architect. Exploring autonomous agents, scalable inference systems, and real-time data pipelines.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        role: 'author'
      }
    ];

    const insertedUserIds = [];
    for (const u of users) {
      const res = await query.run(
        `INSERT INTO users (username, email, password, name, bio, avatar_url, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.username, u.email, hashedPassword, u.name, u.bio, u.avatar_url, u.role]
      );
      insertedUserIds.push(res.id);
    }

    console.log(`Created ${insertedUserIds.length} demo users.`);

    // Seed Posts
    const posts = [
      {
        title: 'Mastering Full-Stack Web Development in 2026: Trends & Architecture',
        slug: 'mastering-full-stack-web-development-2026',
        summary: 'Explore the modern paradigm shift in web architecture: server-driven UI, edge computing, lightweight micro-frontends, and native-feeling web applications.',
        content: `### The Next Generation of Full-Stack Architecture

The web development ecosystem has undergone an extraordinary evolution. We are no longer debating monolithic vs microservices in the abstract; instead, high-performance web systems are crafted with **laser-focused pragmatism**, resilient data layers, and lightning-fast edge execution.

#### 1. Core Principles of Modern Web Systems
Modern full-stack engineering is founded upon three key pillars:

- **Speed to First Contentful Paint (FCP):** Lean DOM structures, intelligent asset delivery, and responsive layouts.
- **Stateless RESTful & GraphQL Micro-endpoints:** Decoupled backends with robust schema validation and atomic database transactions.
- **Universal State Synchronization:** Seamless cache invalidation and instantaneous feedback loops for users.

\`\`\`javascript
// Example of an atomic transaction pattern in async Node.js
async function executeTransaction(db, operations) {
  await db.run('BEGIN TRANSACTION');
  try {
    for (const op of operations) {
      await op();
    }
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
\`\`\`

#### 2. The Return to Simplicity
While frameworks have grown immensely complex, engineering teams are rediscovering the sublime beauty of clean, dependency-lite architectures. Modern vanilla JavaScript combined with lightweight, high-speed Express APIs offers unmatched maintainability and near-instant cold starts.

#### Looking Ahead
Focus on deep fundamentals: master DOM APIs, HTTP status codes, relational database indexing, and user-centric ergonomics. The tools change every few years, but solid architectural thinking remains timeless.`,
        cover_image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
        category: 'Development',
        tags: 'JavaScript, WebDev, Architecture, Backend',
        author_id: insertedUserIds[0],
        read_time: 4,
        views: 342,
        likes_count: 28
      },
      {
        title: 'The Psychology of Micro-Interactions in User Interface Design',
        slug: 'psychology-of-micro-interactions-ui-design',
        summary: 'How subtle animations, tactile feedback, and thoughtful state transitions transform everyday software into an enchanting emotional experience.',
        content: `### Why Small Details Create Big Emotional Connections

In digital product design, the line between functional utility and genuine delight is drawn in milliseconds. Micro-interactions are subtle, purposeful animations and state changes that bridge the physical and virtual worlds.

#### The Four Stages of a Micro-Interaction
Every meaningful micro-interaction follows a clear psychological loop:

1. **The Trigger:** Initiated by the user (like clicking a 'Like' button) or a system event (like a new comment notification).
2. **The Rules:** What happens next? Does the count immediately increment optimistically?
3. **The Feedback:** A soft bounce animation, a tactile color shift, or a subtle sound that confirms to the user's brain: *"Your action was heard."*
4. **The Loops & Modes:** What is the enduring state? Is the button now filled, glowing, or transformed?

> "Details make the design. The details are not just details; they make the product." — Charles Eames

#### Glassmorphism and Depth in 2026
Modern design combines crisp optical hierarchy with depth layers: subtle backdrops, frosted gradients, and border refractions that guide the reader's eye naturally toward primary calls to action without visual clutter.

\`\`\`css
/* Clean modern glassmorphism token */
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
\`\`\`

When you honor the user's attention with silky transitions and zero lag, your software stops feeling like a mechanical tool and starts feeling like an extension of their mind.`,
        cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
        category: 'Design',
        tags: 'UI, UX, DesignSystems, CSS, Aesthetics',
        author_id: insertedUserIds[1],
        read_time: 5,
        views: 512,
        likes_count: 45
      },
      {
        title: 'Autonomous AI Agents: From Toy Prompts to Scalable Systems',
        slug: 'autonomous-ai-agents-scalable-systems',
        summary: 'A deep dive into tool augmentation, episodic memory systems, and deterministic guardrails required to run multi-agent workflows in mission-critical software.',
        content: `### The Paradigm Shift to Agentic Workflows

We have officially transitioned beyond simple prompt-response chat interfaces. Today's software engineering frontier belongs to **Autonomous Agents** capable of planning, executing terminal commands, reasoning through error states, and iterating until goals are met.

#### Anatomy of an Autonomous Agent System
What makes an agent truly production-grade?

- **Goal Decomposition:** Breaking multi-stage tasks into executable, DAG-based sub-steps.
- **Dynamic Context Pruning:** Ensuring that token budgets are respected while retaining long-term project memory.
- **Deterministic Validation:** Grounding LLM outputs in verified compilers, linters, unit tests, and structured API contracts.

#### Handling Failure Modes Gracefully
The true differentiator between a brittle script and a resilient agent is its error-recovery mechanism. When an API call fails or a command fails with an unexpected exit code, the agent should re-read the traceback, hypothesize an alternative solution, and self-correct without human panic.

\`\`\`json
{
  "agent_step": "verification",
  "status": "self_corrected",
  "retry_count": 1,
  "confidence": 0.98
}
\`\`\`

The future of software is not humans writing every single semicolon, nor is it AI running unchecked. It is high-velocity pair-programming where human vision guides relentless synthetic execution.`,
        cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        category: 'Artificial Intelligence',
        tags: 'AI, Agents, MachineLearning, Cloud, Future',
        author_id: insertedUserIds[2],
        read_time: 6,
        views: 780,
        likes_count: 67
      },
      {
        title: 'Building Resilient RESTful APIs with Node.js and SQLite',
        slug: 'building-resilient-restful-apis-nodejs-sqlite',
        summary: 'Why SQLite is one of the most underappreciated, blazing-fast databases for modern web services, and how to structure robust REST endpoints.',
        content: `### The Surprising Power of SQLite in Production

For years, developers were conditioned to spin up massive database clusters for even the simplest applications. But modern hardware and SQLite's zero-network-latency embedded architecture have turned conventional wisdom on its head.

#### Why SQLite Excels:
1. **Zero Configuration:** No ports to open, no daemon services crashing in the background. Your database is a single, easily backable file.
2. **Extreme Read Speeds:** In-process memory mapping delivers sub-millisecond query responses.
3. **Rock-Solid ACID Compliance:** Used in billions of smartphones, aerospace systems, and browsers worldwide.

#### Best Practices for RESTful Express Design
When structuring your endpoints:
- Keep controllers clean and focused strictly on request/response handling.
- Centralize your authentication middleware and JWT verification.
- Return consistent JSON response envelopes:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Resource created successfully"
}
\`\`\`

Pairing this with standard HTTP status codes (\`200 OK\`, \`201 Created\`, \`400 Bad Request\`, \`401 Unauthorized\`, \`403 Forbidden\`, \`404 Not Found\`) ensures clean interoperability for any client.`,
        cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        category: 'Backend',
        tags: 'NodeJS, SQLite, API, Database, Backend',
        author_id: insertedUserIds[0],
        read_time: 4,
        views: 290,
        likes_count: 31
      },
      {
        title: 'The Art of Deep Work: Engineering Productivity for Builders',
        slug: 'art-of-deep-work-engineering-productivity',
        summary: 'Strategies to reclaim 4-hour uninterrupted flow states in a world of Slack pings, meeting overload, and notification fatigue.',
        content: `### Flow State as a Competitive Advantage

The highest leverage work in software engineering and creative thinking happens during **unbroken periods of intense concentration**. When your mental context is constantly wiped by notifications, cognitive residue prevents you from reaching the depth required for complex problem-solving.

#### Practical Tactics for Deep Focus:
- **Asynchronous Communication by Default:** Batch email and Slack checks into two designated 20-minute windows per day.
- **The 90-Minute Focus Block:** Human ultradian rhythms naturally peak in 90-minute intervals. Work hard, then deliberately step away for a walk.
- **Write Before You Code:** Spending 15 minutes drafting a concise design document or pseudocode prevents hours of aimless trial and error.

Protect your calendar like your career depends on it—because the quality of your output truly does.`,
        cover_image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
        category: 'Productivity',
        tags: 'Productivity, Career, Mindset, Focus',
        author_id: insertedUserIds[1],
        read_time: 3,
        views: 420,
        likes_count: 53
      }
    ];

    const insertedPostIds = [];
    for (const p of posts) {
      const res = await query.run(
        `INSERT INTO posts (title, slug, summary, content, cover_image, category, tags, author_id, read_time, views, likes_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.title, p.slug, p.summary, p.content, p.cover_image, p.category, p.tags, p.author_id, p.read_time, p.views, p.likes_count]
      );
      insertedPostIds.push(res.id);
    }

    console.log(`Created ${insertedPostIds.length} initial blog posts.`);

    // Seed Comments
    const comments = [
      {
        post_id: insertedPostIds[0],
        user_id: insertedUserIds[1],
        content: 'Spot on analysis! We transitioned our internal dashboard to lean vanilla components and our bundle size dropped by 80%. The responsiveness is night and day.'
      },
      {
        post_id: insertedPostIds[0],
        user_id: insertedUserIds[2],
        content: 'Fascinating breakdown on atomic transactions. Clean architectural patterns like this make onboarding new developers ten times faster.'
      },
      {
        post_id: insertedPostIds[1],
        user_id: insertedUserIds[0],
        content: 'The 4-stage micro-interaction breakdown is brilliant, Sophia. Implementing subtle feedback states really makes web apps feel tangible and alive.'
      },
      {
        post_id: insertedPostIds[2],
        user_id: insertedUserIds[1],
        content: 'Deterministic validation is so critical. Without verifiable constraints, autonomous workflows can easily spiral into infinite loops. Excellent read!'
      },
      {
        post_id: insertedPostIds[3],
        user_id: insertedUserIds[2],
        content: 'SQLite is truly a hidden gem. With WAL mode enabled, its throughput easily matches or exceeds remote databases for read-heavy portals.'
      }
    ];

    for (const c of comments) {
      await query.run(
        `INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`,
        [c.post_id, c.user_id, c.content]
      );
    }

    // Seed Likes
    await query.run(`INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`, [insertedPostIds[0], insertedUserIds[1]]);
    await query.run(`INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`, [insertedPostIds[0], insertedUserIds[2]]);
    await query.run(`INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`, [insertedPostIds[1], insertedUserIds[0]]);
    await query.run(`INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`, [insertedPostIds[2], insertedUserIds[0]]);
    await query.run(`INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`, [insertedPostIds[2], insertedUserIds[1]]);

    console.log('Database seeded successfully with users, posts, comments, and likes!');
  } catch (error) {
    console.error('Error during database seed:', error);
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0));
}

module.exports = seed;
