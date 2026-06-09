const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'vibenet_super_secret_key_2026_spec';

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// JWT Authentication Middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
      if (err) {
        return res.status(403).json({ error: 'Token is invalid or expired' });
      }
      const user = db.users.findById(userPayload.id);
      if (!user) {
        return res.status(404).json({ error: 'User session not found' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authentication token required' });
  }
}

// Optional JWT Middleware (for pages that display content differently if logged in)
function optionalJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
      if (!err) {
        req.user = db.users.findById(userPayload.id) || null;
      }
      next();
    });
  } else {
    next();
  }
}

// Helper to project safe user data (exclude password hash)
function safeUser(user) {
  if (!user) return null;
  const { passwordHash, ...clean } = user;
  return clean;
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, displayName, password } = req.body;
  
  if (!username || !displayName || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3 || cleanUsername.includes(' ')) {
    return res.status(400).json({ error: 'Username must be at least 3 characters and contain no spaces' });
  }

  const existing = db.users.findOne(u => u.username === cleanUsername);
  if (existing) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = db.users.insert({
    username: cleanUsername,
    displayName: displayName.trim(),
    passwordHash,
    bio: `Welcome to my profile! I am excited to connect on VibeNet. 🪐`,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', // Default gorgeous avatar
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=300&q=80' // Default beautiful cover
  });

  const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    user: safeUser(newUser),
    token
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = db.users.findOne(u => u.username === cleanUsername);
  
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    user: safeUser(user),
    token
  });
});

// Get Current User Profile
app.get('/api/auth/me', authenticateJWT, (req, res) => {
  res.json(safeUser(req.user));
});

// ==========================================
// 2. POSTS & ACTIONS
// ==========================================

// Get Posts (Feed)
app.get('/api/posts', optionalJWT, (req, res) => {
  const { feed } = req.query;
  let posts = db.posts.getAll();

  // If feed is followed, filter to only posts from people they follow and themselves
  if (feed === 'followed' && req.user) {
    const followedIds = db.follows.find(f => f.followerId === req.user.id).map(f => f.followedId);
    followedIds.push(req.user.id); // Include user's own posts
    posts = posts.filter(post => followedIds.includes(post.userId));
  }

  // Sort posts by date descending
  posts = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Populate user data, likes, comments
  const populated = posts.map(post => {
    const author = db.users.findById(post.userId);
    const postLikes = db.likes.find(l => l.postId === post.id);
    const commentsCount = db.comments.find(c => c.postId === post.id).length;
    const isLiked = req.user ? !!postLikes.find(l => l.userId === req.user.id) : false;

    return {
      ...post,
      author: safeUser(author),
      likesCount: postLikes.length,
      commentsCount,
      isLiked
    };
  });

  res.json(populated);
});

// Create Post
app.post('/api/posts', authenticateJWT, (req, res) => {
  const { content, mediaUrl } = req.body;
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content cannot be empty' });
  }

  const newPost = db.posts.insert({
    userId: req.user.id,
    content: content.trim(),
    mediaUrl: mediaUrl ? mediaUrl.trim() : ''
  });

  const responsePost = {
    ...newPost,
    author: safeUser(req.user),
    likesCount: 0,
    commentsCount: 0,
    isLiked: false
  };

  res.status(201).json(responsePost);
});

// Delete Post
app.delete('/api/posts/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const post = db.posts.findById(id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.userId !== req.user.id) {
    return res.status(403).json({ error: 'You are not authorized to delete this post' });
  }

  db.posts.delete(id);
  // Cleanup likes and comments for this post
  db.likes.deleteWhere(l => l.postId === id);
  db.comments.deleteWhere(c => c.postId === id);

  res.json({ message: 'Post and associated interactions deleted successfully' });
});

// Like/Unlike Toggle
app.post('/api/posts/:id/like', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const post = db.posts.findById(id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const existingLike = db.likes.findOne(l => l.postId === id && l.userId === req.user.id);
  let isLiked = false;

  if (existingLike) {
    db.likes.deleteWhere(l => l.postId === id && l.userId === req.user.id);
    isLiked = false;
  } else {
    db.likes.insert({
      userId: req.user.id,
      postId: id
    });
    isLiked = true;
  }

  const likesCount = db.likes.find(l => l.postId === id).length;
  res.json({ likesCount, isLiked });
});

// ==========================================
// 3. COMMENTS ROUTES
// ==========================================

// Get Comments for Post
app.get('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const post = db.posts.findById(id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const comments = db.comments.find(c => c.postId === id);
  
  // Sort comments chronologically (oldest first)
  const populated = [...comments]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(comment => {
      const author = db.users.findById(comment.userId);
      return {
        ...comment,
        author: safeUser(author)
      };
    });

  res.json(populated);
});

// Add Comment to Post
app.post('/api/posts/:id/comments', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment content cannot be empty' });
  }

  const post = db.posts.findById(id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const newComment = db.comments.insert({
    postId: id,
    userId: req.user.id,
    content: content.trim()
  });

  const responseComment = {
    ...newComment,
    author: safeUser(req.user)
  };

  res.status(201).json(responseComment);
});

// ==========================================
// 4. USER PROFILE AND RELATIONS
// ==========================================

// Get User Profile
app.get('/api/users/profile/:username', optionalJWT, (req, res) => {
  const { username } = req.params;
  const user = db.users.findOne(u => u.username === username.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userPosts = db.posts.find(p => p.userId === user.id);
  const followers = db.follows.find(f => f.followedId === user.id);
  const following = db.follows.find(f => f.followerId === user.id);

  const postsCount = userPosts.length;
  const followersCount = followers.length;
  const followingCount = following.length;

  const isFollowing = req.user ? !!followers.find(f => f.followerId === req.user.id) : false;

  res.json({
    user: safeUser(user),
    postsCount,
    followersCount,
    followingCount,
    isFollowing
  });
});

// Update Profile
app.put('/api/users/profile', authenticateJWT, (req, res) => {
  const { displayName, bio, avatar, cover } = req.body;
  const updates = {};

  if (displayName && displayName.trim().length > 0) updates.displayName = displayName.trim();
  if (bio !== undefined) updates.bio = bio.trim();
  if (avatar) updates.avatar = avatar.trim();
  if (cover) updates.cover = cover.trim();

  const updatedUser = db.users.update(req.user.id, updates);
  res.json(safeUser(updatedUser));
});

// Toggle Follow / Unfollow
app.post('/api/users/:id/follow', authenticateJWT, (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  const targetUser = db.users.findById(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const existingFollow = db.follows.findOne(f => f.followerId === req.user.id && f.followedId === id);
  let isFollowing = false;

  if (existingFollow) {
    db.follows.deleteWhere(f => f.followerId === req.user.id && f.followedId === id);
    isFollowing = false;
  } else {
    db.follows.insert({
      followerId: req.user.id,
      followedId: id
    });
    isFollowing = true;
  }

  const followersCount = db.follows.find(f => f.followedId === id).length;
  const followingCount = db.follows.find(f => f.followerId === req.user.id).length;

  res.json({
    isFollowing,
    followersCount,
    followingCount
  });
});

// Get Explore Page Recommendations
app.get('/api/explore', optionalJWT, (req, res) => {
  const users = db.users.getAll();
  let suggestions = [];

  if (req.user) {
    // Show users they don't follow yet and excluding themselves
    const followedIds = db.follows.find(f => f.followerId === req.user.id).map(f => f.followedId);
    suggestions = users.filter(u => u.id !== req.user.id && !followedIds.includes(u.id));
  } else {
    suggestions = users.slice(0, 5); // Fallback for anonymous
  }

  // Shuffle and pick top 4 suggestions
  const shuffled = [...suggestions].sort(() => 0.5 - Math.random()).slice(0, 4);
  const cleanSuggestions = shuffled.map(u => safeUser(u));

  // Find trending topics based on simple word count in posts
  const posts = db.posts.getAll();
  const hashtagsMap = {};
  
  posts.forEach(post => {
    const hashtags = post.content.match(/#\w+/g) || [];
    hashtags.forEach(tag => {
      hashtagsMap[tag] = (hashtagsMap[tag] || 0) + 1;
    });
  });

  const trendingHashtags = Object.entries(hashtagsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  // Fallback default tags if no hashtags exist
  const defaultTags = [
    { tag: '#VibeNet', count: 12 },
    { tag: '#Glassmorphism', count: 8 },
    { tag: '#NodeJS', count: 6 },
    { tag: '#WebDesign', count: 5 },
    { tag: '#UIUX', count: 4 }
  ];

  res.json({
    suggestions: cleanSuggestions,
    trends: trendingHashtags.length > 0 ? trendingHashtags : defaultTags
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`VibeNet Server is running on port ${PORT}`);
});
