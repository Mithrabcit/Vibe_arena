const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'db.json');

// Helper to generate unique IDs
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

class Collection {
  constructor(db, name) {
    this.db = db;
    this.name = name;
  }

  getAll() {
    return this.db.data[this.name];
  }

  find(filterFn) {
    return this.getAll().filter(filterFn);
  }

  findOne(filterFn) {
    return this.getAll().find(filterFn);
  }

  findById(id) {
    return this.getAll().find(item => item.id === id);
  }

  insert(item) {
    const newItem = { id: generateId(), createdAt: new Date().toISOString(), ...item };
    this.getAll().push(newItem);
    this.db.save();
    return newItem;
  }

  update(id, updates) {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      this.db.save();
      return items[index];
    }
    return null;
  }

  delete(id) {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      const deleted = items.splice(index, 1)[0];
      this.db.save();
      return deleted;
    }
    return null;
  }

  deleteWhere(filterFn) {
    const initialLength = this.getAll().length;
    this.db.data[this.name] = this.getAll().filter(item => !filterFn(item));
    this.db.save();
    return initialLength - this.db.data[this.name].length;
  }
}

class Database {
  constructor() {
    this.data = {
      users: [],
      posts: [],
      comments: [],
      likes: [],
      follows: []
    };
    this.init();
    
    this.users = new Collection(this, 'users');
    this.posts = new Collection(this, 'posts');
    this.comments = new Collection(this, 'comments');
    this.likes = new Collection(this, 'likes');
    this.follows = new Collection(this, 'follows');
  }

  init() {
    if (fs.existsSync(DB_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf8');
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error('Error reading database file, resetting...', err);
        this.save();
      }
    } else {
      this.save();
      this.seedMockData();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing to database file:', err);
    }
  }

  seedMockData() {
    console.log('Seeding initial premium mock data for VibeNet...');
    
    // Hash mock passwords
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('password123', salt);

    // 1. Create Mock Users
    const alex = {
      id: 'user_alex',
      username: 'alex_designer',
      passwordHash: defaultPasswordHash,
      displayName: 'Alex Rivera',
      bio: 'Senior Product Designer at VibeLabs. Obsessed with neon glassmorphism and motion graphics. 🎨✨',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=300&q=80',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    };

    const sarah = {
      id: 'user_sarah',
      username: 'sarah_dev',
      passwordHash: defaultPasswordHash,
      displayName: 'Sarah Chen',
      bio: 'Full Stack Engineer & OSS contributor. Building the future of the web, one interactive card at a time. 💻🚀',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
      cover: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&h=300&q=80',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    };

    const marcus = {
      id: 'user_marcus',
      username: 'marcus_fit',
      passwordHash: defaultPasswordHash,
      displayName: 'Marcus Aurelius',
      bio: 'Mindfulness Practitioner, Fitness Coach & Philosophy Enthusiast. Sound body, sound mind. 🧘‍♂️💪',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&h=300&q=80',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.data.users.push(alex, sarah, marcus);

    // 2. Create Mock Follows (everyone follows each other for maximum engagement)
    this.data.follows.push(
      { followerId: 'user_alex', followedId: 'user_sarah' },
      { followerId: 'user_alex', followedId: 'user_marcus' },
      { followerId: 'user_sarah', followedId: 'user_alex' },
      { followerId: 'user_sarah', followedId: 'user_marcus' },
      { followerId: 'user_marcus', followedId: 'user_alex' },
      { followerId: 'user_marcus', followedId: 'user_sarah' }
    );

    // 3. Create Mock Posts
    const postAlex = {
      id: 'post_alex_1',
      userId: 'user_alex',
      content: 'Just finalized the design specifications for VibeNet! Combining deep space backdrops with highly neon-accented glassmorphic panels. It feels incredibly sleek. What do you think? 🌌🎨🧪',
      mediaUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    };

    const postSarah = {
      id: 'post_sarah_1',
      userId: 'user_sarah',
      content: 'Experimenting with React 19 Server Actions and Node.js v24 clustering today. Node is incredibly fast, but maintaining state consistency across instances requires robust DB models. Always plan before coding! 💻⚙️',
      mediaUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    };

    const postMarcus = {
      id: 'post_marcus_1',
      userId: 'user_marcus',
      content: 'Your mind is like water. When it\'s turbulent, it\'s difficult to see. When it\'s calm, everything becomes clear. Starting my morning with 20 minutes of silent meditation and a 5km run. Invest in your peace. 🧘‍♂️🍃🌅',
      mediaUrl: '',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    };

    this.data.posts.push(postAlex, postSarah, postMarcus);

    // 4. Create Mock Likes
    this.data.likes.push(
      { userId: 'user_sarah', postId: 'post_alex_1' },
      { userId: 'user_marcus', postId: 'post_alex_1' },
      { userId: 'user_alex', postId: 'post_sarah_1' },
      { userId: 'user_marcus', postId: 'post_sarah_1' },
      { userId: 'user_alex', postId: 'post_marcus_1' }
    );

    // 5. Create Mock Comments
    this.data.comments.push(
      {
        id: 'comment_1',
        postId: 'post_alex_1',
        userId: 'user_sarah',
        content: 'This glassmorphism layout is absolutely stunning! The backdrop-filter is perfect.',
        createdAt: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'comment_2',
        postId: 'post_alex_1',
        userId: 'user_marcus',
        content: 'Loving the colors here, Alex. The purple gradient is extremely vibrant.',
        createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'comment_3',
        postId: 'post_sarah_1',
        userId: 'user_alex',
        content: 'Completely agree on state management. Excited to see what you build with it!',
        createdAt: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString()
      }
    );

    this.save();
    console.log('Seed completed successfully!');
  }
}

module.exports = new Database();
