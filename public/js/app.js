// Global Application State
let state = {
  currentUser: null,
  activeView: 'feed', // 'feed', 'explore', 'notifications', 'profile'
  feedFilter: 'all',  // 'all', 'followed'
  activeProfileUsername: null,
  activeCommentPostId: null,
  inlineMediaUrl: ''
};

// UI Elements Cache
const DOM = {
  authScreen: document.getElementById('auth-screen'),
  appScreen: document.getElementById('app-screen'),
  authForm: document.getElementById('auth-form'),
  authSubtitle: document.getElementById('auth-subtitle-text'),
  groupDisplayName: document.getElementById('group-displayname'),
  authSubmitBtn: document.getElementById('btn-auth-submit'),
  authTogglePrompt: document.getElementById('auth-toggle-prompt'),
  authToggleLink: document.getElementById('auth-toggle-link'),
  
  viewTitle: document.getElementById('view-title'),
  feedViewTabs: document.getElementById('feed-view-tabs'),
  postCreatorBox: document.getElementById('post-creator-box'),
  dynamicPortal: document.getElementById('dynamic-content-portal'),
  activeUserBadge: document.getElementById('active-user-badge'),
  creatorAvatar: document.getElementById('creator-avatar'),
  
  // Modals & Drawer
  modalOverlay: document.getElementById('modal-overlay'),
  editProfileModal: document.getElementById('edit-profile-modal'),
  createPostModal: document.getElementById('create-post-modal'),
  commentsDrawer: document.getElementById('comments-drawer'),
  commentsContainer: document.getElementById('comments-list-container'),
  
  // Right Sidebar
  suggestionsContainer: document.getElementById('suggestions-container'),
  trendsContainer: document.getElementById('trends-container'),
  
  // Toasts
  toastPortal: document.getElementById('toast-portal')
};

// ==========================================
// 1. INITIALIZATION & AUTH STATE
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('VibeNet App Initializing...');
  
  // Check auth state
  try {
    const user = await api.getCurrentUser();
    if (user) {
      handleAuthSuccess(user);
    } else {
      showAuthScreen();
    }
  } catch (err) {
    showAuthScreen();
  }
});

function handleAuthSuccess(user) {
  state.currentUser = user;
  
  // Toggle Views
  DOM.authScreen.style.display = 'none';
  DOM.appScreen.style.display = 'flex';
  
  // Setup Active User UI Badges
  DOM.creatorAvatar.src = user.avatar;
  
  DOM.activeUserBadge.innerHTML = `
    <img src="${user.avatar}" alt="${escapeHTML(user.displayName)}">
    <div class="user-badge-info">
      <span class="user-badge-name">${escapeHTML(user.displayName)}</span>
      <span class="user-badge-username">@${escapeHTML(user.username)}</span>
    </div>
  `;
  
  // Load right sidebar recommendations and trends
  loadSidebarData();
  
  // Switch to Default Tab (Home Feed)
  switchTab('feed');
  showToast(`Welcome back, ${user.displayName}! ✨`);
}

function showAuthScreen() {
  state.currentUser = null;
  DOM.appScreen.style.display = 'none';
  DOM.authScreen.style.display = 'flex';
  
  // Reset Form Mode to Login
  isRegisterMode = false;
  DOM.groupDisplayName.style.display = 'none';
  document.getElementById('auth-displayname').required = false;
  DOM.authSubtitle.textContent = 'Connect to the glowing social hub.';
  DOM.authSubmitBtn.textContent = 'Sign In';
  DOM.authTogglePrompt.textContent = "Don't have an account?";
  DOM.authToggleLink.textContent = 'Sign Up';
}

// Toggle Register / Login Mode
let isRegisterMode = false;
function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  DOM.authForm.reset();
  
  if (isRegisterMode) {
    DOM.groupDisplayName.style.display = 'block';
    document.getElementById('auth-displayname').required = true;
    DOM.authSubtitle.textContent = 'Create your cyber-identity on VibeNet.';
    DOM.authSubmitBtn.textContent = 'Create Account';
    DOM.authTogglePrompt.textContent = 'Already have an account?';
    DOM.authToggleLink.textContent = 'Sign In';
  } else {
    DOM.groupDisplayName.style.display = 'none';
    document.getElementById('auth-displayname').required = false;
    DOM.authSubtitle.textContent = 'Connect to the glowing social hub.';
    DOM.authSubmitBtn.textContent = 'Sign In';
    DOM.authTogglePrompt.textContent = "Don't have an account?";
    DOM.authToggleLink.textContent = 'Sign Up';
  }
}

// Handle Form Submission
async function handleAuthSubmit(event) {
  event.preventDefault();
  
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  
  try {
    if (isRegisterMode) {
      const displayName = document.getElementById('auth-displayname').value.trim();
      const user = await api.register(username, displayName, password);
      handleAuthSuccess(user);
    } else {
      const user = await api.login(username, password);
      handleAuthSuccess(user);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleLogout(event) {
  if (event) event.preventDefault();
  await api.logout();
  showAuthScreen();
  showToast('Logged out successfully');
}

// ==========================================
// 2. NAVIGATION AND ROUTING
// ==========================================

function switchTab(viewName) {
  state.activeView = viewName;
  state.activeProfileUsername = null;
  
  // Update left navigation items active status
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Update mobile bottom nav items active status
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const leftNavElement = document.getElementById(`nav-${viewName}`);
  if (leftNavElement) leftNavElement.classList.add('active');

  const bottomNavElement = document.getElementById(`bnav-${viewName}`);
  if (bottomNavElement) bottomNavElement.classList.add('active');

  // Toggle View-Specific Controls
  if (viewName === 'feed') {
    DOM.viewTitle.textContent = 'Home Feed';
    DOM.feedViewTabs.style.display = 'flex';
    DOM.postCreatorBox.style.display = 'block';
    renderFeed();
  } else {
    DOM.feedViewTabs.style.display = 'none';
    DOM.postCreatorBox.style.display = 'none';
    
    if (viewName === 'explore') {
      DOM.viewTitle.textContent = 'Explore Hub';
      renderExplore();
    } else if (viewName === 'notifications') {
      DOM.viewTitle.textContent = 'Notifications';
      renderNotifications();
    }
  }
}

// ==========================================
// 3. HOME FEED RENDER
// ==========================================

async function renderFeed() {
  DOM.dynamicPortal.innerHTML = `
    <div style="display: flex; justify-content: center; padding: 40px;" id="feed-spinner">
      <div class="spinner" style="border: 4px solid var(--glass-border); border-top-color: var(--accent-pink); width: 36px; height: 36px; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
  `;
  
  try {
    const posts = await api.getPosts(state.feedFilter);
    DOM.dynamicPortal.innerHTML = '';
    
    if (posts.length === 0) {
      DOM.dynamicPortal.innerHTML = `
        <div class="glass" style="padding: 40px; text-align: center; color: var(--text-secondary);">
          <svg style="width: 48px; height: 48px; stroke: var(--text-muted); fill: none; stroke-width: 1.5; margin-bottom: 16px;"><use href="#icon-globe"></use></svg>
          <p style="font-size: 16px; font-weight: 600;">No posts to display in this feed.</p>
          <p style="font-size: 13px; margin-top: 8px;">Be the first to share a vibe or follow other creators!</p>
        </div>
      `;
      return;
    }

    posts.forEach(post => {
      DOM.dynamicPortal.innerHTML += components.postCard(post, state.currentUser);
    });
  } catch (err) {
    showToast('Failed to load feed posts', 'error');
  }
}

function changeFeedFilter(filter) {
  state.feedFilter = filter;
  document.getElementById('feed-tab-all').classList.toggle('active', filter === 'all');
  document.getElementById('feed-tab-followed').classList.toggle('active', filter === 'followed');
  renderFeed();
}

// Add CSS keyframe spinning in JS dynamically if not in CSS
const styleSheet = document.createElement('style');
styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

// ==========================================
// 4. POST OPERATIONS
// ==========================================

function promptAddMedia() {
  const url = prompt('Enter a direct image URL to attach (e.g. Unsplash link):');
  if (url && url.trim().startsWith('http')) {
    state.inlineMediaUrl = url.trim();
    const previewBox = document.getElementById('inline-media-preview-box');
    const previewImg = document.getElementById('inline-media-img');
    previewImg.src = state.inlineMediaUrl;
    previewBox.style.display = 'block';
  } else if (url) {
    showToast('Please enter a valid image URL starting with http/https', 'error');
  }
}

function removeInlineMedia() {
  state.inlineMediaUrl = '';
  document.getElementById('inline-media-preview-box').style.display = 'none';
}

async function submitPost() {
  const textarea = document.getElementById('creator-text');
  const content = textarea.value.trim();
  
  if (!content) {
    showToast('Post content cannot be empty', 'error');
    return;
  }

  try {
    await api.createPost(content, state.inlineMediaUrl);
    textarea.value = '';
    removeInlineMedia();
    showToast('Published your new vibe! 🚀');
    
    // Refresh Sidebar data (trends can change based on hashtags)
    loadSidebarData();
    
    if (state.activeView === 'feed') {
      renderFeed();
    } else {
      switchTab('feed');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Modal Post Action
function openCreatePostModal() {
  DOM.modalOverlay.style.display = 'flex';
  DOM.createPostModal.style.display = 'block';
  DOM.editProfileModal.style.display = 'none';
  setTimeout(() => DOM.modalOverlay.classList.add('active'), 10);
}

async function submitModalPost() {
  const content = document.getElementById('modal-post-text').value.trim();
  const mediaUrl = document.getElementById('modal-post-media').value.trim();

  if (!content) {
    showToast('Post content cannot be empty', 'error');
    return;
  }

  try {
    await api.createPost(content, mediaUrl);
    document.getElementById('modal-post-text').value = '';
    document.getElementById('modal-post-media').value = '';
    closeAllModals();
    showToast('Published your new vibe! 🚀');
    loadSidebarData();
    
    if (state.activeView === 'feed') {
      renderFeed();
    } else {
      switchTab('feed');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deletePost(postId) {
  if (!confirm('Are you sure you want to permanently delete this post?')) return;
  
  try {
    await api.deletePost(postId);
    showToast('Post deleted successfully');
    
    // Animate removal in UI
    const card = document.getElementById(`post-${postId}`);
    if (card) {
      card.style.transform = 'scale(0.9)';
      card.style.opacity = '0';
      card.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        card.remove();
        // If profile is active, refresh it to keep stats synced
        if (state.activeView === 'profile') {
          renderProfile(state.activeProfileUsername);
        }
      }, 300);
    } else {
      if (state.activeView === 'feed') renderFeed();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleLike(postId) {
  try {
    const res = await api.toggleLike(postId);
    const card = document.getElementById(`post-${postId}`);
    if (card) {
      const btn = card.querySelector('.like-btn');
      const counter = btn.querySelector('.likes-count');
      
      counter.textContent = res.likesCount;
      btn.classList.toggle('liked', res.isLiked);
    }
  } catch (err) {
    showToast('Authenticate to like posts', 'error');
  }
}

// ==========================================
// 5. COMMENTS OPERATIONS
// ==========================================

async function openCommentsDrawer(postId) {
  state.activeCommentPostId = postId;
  DOM.commentsContainer.innerHTML = `
    <div style="display:flex; justify-content:center; padding: 20px;">
      <div class="spinner" style="border: 3px solid var(--glass-border); border-top-color: var(--accent-cyan); width: 24px; height: 24px; border-radius:50%; animation: spin 1s linear infinite;"></div>
    </div>
  `;
  
  DOM.commentsDrawer.classList.add('active');
  
  try {
    const comments = await api.getComments(postId);
    DOM.commentsContainer.innerHTML = '';
    
    if (comments.length === 0) {
      DOM.commentsContainer.innerHTML = `
        <div style="text-align:center; padding:40px 10px; color: var(--text-secondary);">
          <p style="font-size:14px; font-weight:600;">No comments on this post yet.</p>
          <p style="font-size:12px; margin-top:6px;">Add a response below to start the convo!</p>
        </div>
      `;
      return;
    }

    comments.forEach(comment => {
      DOM.commentsContainer.innerHTML += components.commentItem(comment);
    });
  } catch (err) {
    showToast('Failed to load comments', 'error');
  }
}

function closeCommentsDrawer() {
  DOM.commentsDrawer.classList.remove('active');
  state.activeCommentPostId = null;
  document.getElementById('comment-textarea').value = '';
}

async function submitComment(event) {
  event.preventDefault();
  
  const textarea = document.getElementById('comment-textarea');
  const content = textarea.value.trim();
  
  if (!content || !state.activeCommentPostId) return;

  try {
    const newComment = await api.addComment(state.activeCommentPostId, content);
    textarea.value = '';
    
    // If first comment, clear empty placeholder
    if (DOM.commentsContainer.querySelector('p')) {
      DOM.commentsContainer.innerHTML = '';
    }
    
    // Add comment to list
    DOM.commentsContainer.innerHTML += components.commentItem(newComment);
    
    // Scroll comment container to bottom
    DOM.commentsContainer.scrollTop = DOM.commentsContainer.scrollHeight;
    
    // Update comment counter badge in main card feed
    const card = document.getElementById(`post-${state.activeCommentPostId}`);
    if (card) {
      const counter = card.querySelector('.comments-count');
      counter.textContent = parseInt(counter.textContent) + 1;
    }
    
    showToast('Comment posted! 💬');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// 6. EXPLORE HUB RENDER
// ==========================================

async function renderExplore() {
  DOM.dynamicPortal.innerHTML = '';
  
  try {
    const data = await api.getExploreData();
    
    // Render standard Explore UI card containing top suggestions & top hashtags
    const hashtags = data.trends.map(t => `<span class="glass glass-interactive" onclick="searchHashtag('${t.tag}')" style="padding: 10px 18px; border-radius: 20px; font-size: 14px; font-weight:700; cursor:pointer; color: var(--text-primary); display:inline-block; border-color: rgba(6, 182, 212, 0.25);">${t.tag} <small style="color:var(--accent-cyan); font-weight:800; margin-left: 4px;">${t.count}</small></span>`).join(' ');
    
    DOM.dynamicPortal.innerHTML = `
      <section class="glass" style="padding: 28px;">
        <h2 style="font-family: var(--font-display); font-size: 18px; font-weight:800; margin-bottom: 16px; background: var(--secondary-glow); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Hot Tags</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${hashtags || '<p style="color:var(--text-secondary)">No tags trending yet.</p>'}
        </div>
      </section>
      
      <section style="display: flex; flex-direction: column; gap: 16px;">
        <h2 style="font-family: var(--font-display); font-size: 18px; font-weight: 800; background: var(--primary-glow); -webkit-background-clip:text; -webkit-text-fill-color:transparent; padding-left: 6px;">Global Feed Highlights</h2>
        <div id="explore-posts-feed" style="display:flex; flex-direction:column; gap:20px;"></div>
      </section>
    `;

    // Renders general global posts under highlights
    const posts = await api.getPosts('all');
    const highlightsBox = document.getElementById('explore-posts-feed');
    if (posts.length === 0) {
      highlightsBox.innerHTML = `<p style="color: var(--text-secondary); text-align:center; padding: 20px;">No updates published yet.</p>`;
    } else {
      posts.forEach(post => {
        highlightsBox.innerHTML += components.postCard(post, state.currentUser);
      });
    }
  } catch (err) {
    showToast('Failed to populate Explore Hub', 'error');
  }
}

async function searchHashtag(tag) {
  // Populate the search input and press enter
  const searchInput = document.getElementById('global-search-input');
  searchInput.value = tag;
  executeSearch(tag);
}

function handleSearchKeyPress(event) {
  if (event.key === 'Enter') {
    executeSearch(event.target.value.trim());
  }
}

async function executeSearch(query) {
  if (!query) return;
  switchTab('explore');
  DOM.viewTitle.textContent = `Search: "${query}"`;
  
  DOM.dynamicPortal.innerHTML = `
    <div style="display: flex; justify-content: center; padding: 40px;">
      <div class="spinner" style="border: 4px solid var(--glass-border); border-top-color: var(--accent-cyan); width: 36px; height: 36px; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
  `;

  try {
    const posts = await api.getPosts('all');
    const filtered = posts.filter(post => 
      post.content.toLowerCase().includes(query.toLowerCase()) || 
      post.author.username.toLowerCase().includes(query.toLowerCase()) ||
      post.author.displayName.toLowerCase().includes(query.toLowerCase())
    );

    DOM.dynamicPortal.innerHTML = '';
    
    if (filtered.length === 0) {
      DOM.dynamicPortal.innerHTML = `
        <div class="glass" style="padding: 40px; text-align: center; color: var(--text-secondary);">
          <p style="font-size: 16px; font-weight: 600;">No results matching "${escapeHTML(query)}".</p>
          <p style="font-size: 13px; margin-top: 8px;">Try searching for other words, usernames, or hashtags.</p>
        </div>
      `;
      return;
    }

    DOM.dynamicPortal.innerHTML = `
      <p style="font-size:14px; color: var(--text-secondary); margin-bottom: 8px; padding-left: 6px;">Found ${filtered.length} posts matching your search</p>
    `;
    
    filtered.forEach(post => {
      DOM.dynamicPortal.innerHTML += components.postCard(post, state.currentUser);
    });
  } catch (err) {
    showToast('Failed to perform search query', 'error');
  }
}

// ==========================================
// 7. PROFILE VIEW RENDER
// ==========================================

async function navigateToProfile(username) {
  state.activeView = 'profile';
  state.activeProfileUsername = username;
  
  // Deactivate navigation links
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
  
  if (state.currentUser && username === state.currentUser.username) {
    const profileLink = document.getElementById('nav-profile');
    if (profileLink) profileLink.classList.add('active');
    const mobProfileLink = document.getElementById('bnav-profile');
    if (mobProfileLink) mobProfileLink.classList.add('active');
  }

  DOM.viewTitle.textContent = `@${username}`;
  DOM.feedViewTabs.style.display = 'none';
  DOM.postCreatorBox.style.display = 'none';
  
  renderProfile(username);
}

function navigateToMyProfile() {
  if (state.currentUser) {
    navigateToProfile(state.currentUser.username);
  }
}

async function renderProfile(username) {
  DOM.dynamicPortal.innerHTML = `
    <div style="display: flex; justify-content: center; padding: 40px;">
      <div class="spinner" style="border: 4px solid var(--glass-border); border-top-color: var(--accent-pink); width: 36px; height: 36px; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
  `;

  try {
    const profile = await api.getUserProfile(username);
    const isMe = state.currentUser && state.currentUser.username === username;
    
    const actionBtnHtml = isMe 
      ? `<button class="btn-edit-profile" onclick="openEditProfileModal()">Tune Profile</button>`
      : `<button class="btn-follow ${profile.isFollowing ? 'following' : ''}" style="padding:8px 24px; font-size:14px; border-radius:20px;" onclick="toggleFollowFromProfile('${profile.user.id}')">
          ${profile.isFollowing ? 'Following' : 'Follow'}
         </button>`;

    const avatarUrl = profile.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
    const coverUrl = profile.user.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=300&q=80';

    DOM.dynamicPortal.innerHTML = `
      <section class="profile-card glass">
        <div class="profile-cover">
          <img src="${coverUrl}" alt="Profile Cover">
          <div class="profile-avatar-container">
            <img class="profile-avatar" src="${avatarUrl}" alt="${escapeHTML(profile.user.displayName)}">
          </div>
        </div>
        <div class="profile-actions">
          ${actionBtnHtml}
        </div>
        <div class="profile-details">
          <h2 class="profile-name">${escapeHTML(profile.user.displayName)}</h2>
          <div class="profile-username">@${escapeHTML(profile.user.username)}</div>
          <p class="profile-bio">${escapeHTML(profile.user.bio)}</p>
          <div class="profile-stats">
            <span class="stat-item"><span class="stat-val" id="prof-stat-posts">${profile.postsCount}</span> Posts</span>
            <span class="stat-item"><span class="stat-val" id="prof-stat-followers">${profile.followersCount}</span> Followers</span>
            <span class="stat-item"><span class="stat-val" id="prof-stat-following">${profile.followingCount}</span> Following</span>
          </div>
        </div>
      </section>
      
      <div style="border-bottom:1px solid var(--glass-border); padding-bottom: 4px; padding-left: 6px;">
        <h3 style="font-family: var(--font-display); font-size: 16px; font-weight:800; color:var(--text-secondary);">Posts by @${username}</h3>
      </div>
      
      <div id="profile-posts-container" style="display:flex; flex-direction:column; gap:20px;"></div>
    `;

    // Load User's Posts
    const posts = await api.getPosts('all');
    const userPosts = posts.filter(p => p.userId === profile.user.id);
    const container = document.getElementById('profile-posts-container');
    
    if (userPosts.length === 0) {
      container.innerHTML = `
        <div class="glass" style="padding: 40px; text-align: center; color: var(--text-secondary);">
          <p style="font-size: 15px; font-weight:600;">No vibe posts published yet.</p>
        </div>
      `;
      return;
    }

    userPosts.forEach(post => {
      container.innerHTML += components.postCard(post, state.currentUser);
    });
  } catch (err) {
    showToast('Failed to load profile details', 'error');
  }
}

// Follow / Unfollow Toggles
async function toggleFollowFromProfile(userId) {
  try {
    const res = await api.toggleFollow(userId);
    const btn = document.querySelector('.profile-card .btn-follow');
    
    if (btn) {
      btn.classList.toggle('following', res.isFollowing);
      btn.textContent = res.isFollowing ? 'Following' : 'Follow';
    }
    
    // Update numerical stat counters
    const followersEl = document.getElementById('prof-stat-followers');
    if (followersEl) followersEl.textContent = res.followersCount;
    
    showToast(res.isFollowing ? 'Followed creator! 🔔' : 'Unfollowed creator');
    
    // Refresh recommendations sidebar
    loadSidebarData();
  } catch (err) {
    showToast('Error toggling follow status', 'error');
  }
}

async function toggleFollowFromSuggestion(userId) {
  try {
    const res = await api.toggleFollow(userId);
    const item = document.getElementById(`suggest-${userId}`);
    if (item) {
      const btn = item.querySelector('.btn-follow');
      btn.classList.toggle('following', res.isFollowing);
      btn.textContent = res.isFollowing ? 'Following' : 'Follow';
    }
    
    showToast(res.isFollowing ? 'Followed creator! 🔔' : 'Unfollowed creator');
    
    // If viewing profile of this user, sync stats in real-time
    if (state.activeView === 'profile' && state.activeProfileUsername) {
      renderProfile(state.activeProfileUsername);
    }
  } catch (err) {
    showToast('Error toggling follow status', 'error');
  }
}

// Profile Editing Modal
function openEditProfileModal() {
  if (!state.currentUser) return;
  DOM.modalOverlay.style.display = 'flex';
  DOM.editProfileModal.style.display = 'block';
  DOM.createPostModal.style.display = 'none';
  
  document.getElementById('edit-display-name').value = state.currentUser.displayName;
  document.getElementById('edit-bio').value = state.currentUser.bio;
  document.getElementById('edit-avatar').value = state.currentUser.avatar;
  document.getElementById('edit-cover').value = state.currentUser.cover;

  setTimeout(() => DOM.modalOverlay.classList.add('active'), 10);
}

async function submitProfileEdit(event) {
  event.preventDefault();
  
  const updates = {
    displayName: document.getElementById('edit-display-name').value.trim(),
    bio: document.getElementById('edit-bio').value.trim(),
    avatar: document.getElementById('edit-avatar').value.trim(),
    cover: document.getElementById('edit-cover').value.trim()
  };

  try {
    const updatedUser = await api.updateProfile(updates);
    handleAuthSuccess(updatedUser);
    closeAllModals();
    showToast('Profile specs updated successfully! ⚙️');
    
    // Re-render profile if active
    if (state.activeView === 'profile') {
      renderProfile(updatedUser.username);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Close Modals Helper
function closeAllModals() {
  DOM.modalOverlay.classList.remove('active');
  setTimeout(() => {
    DOM.modalOverlay.style.display = 'none';
    DOM.editProfileModal.style.display = 'none';
    DOM.createPostModal.style.display = 'none';
  }, 300);
}

// ==========================================
// 8. NOTIFICATIONS SIMULATION (PREMIUM TOUCH)
// ==========================================

function renderNotifications() {
  DOM.dynamicPortal.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div class="glass" style="padding:20px; display:flex; gap:16px; align-items:center;">
        <img class="comment-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" alt="Sarah">
        <div>
          <p style="font-size:14px;"><strong onclick="navigateToProfile('sarah_dev')" style="cursor:pointer; hover:text-decoration:underline;">Sarah Chen</strong> started following you</p>
          <span style="font-size:11px; color:var(--text-muted);">2 hours ago</span>
        </div>
      </div>
      
      <div class="glass" style="padding:20px; display:flex; gap:16px; align-items:center;">
        <img class="comment-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" alt="Alex">
        <div>
          <p style="font-size:14px;"><strong onclick="navigateToProfile('alex_designer')" style="cursor:pointer;">Alex Rivera</strong> liked your post <span style="color:var(--text-secondary)">"Just finalized the specs..."</span></p>
          <span style="font-size:11px; color:var(--text-muted);">1 day ago</span>
        </div>
      </div>

      <div class="glass" style="padding:20px; display:flex; gap:16px; align-items:center;">
        <img class="comment-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" alt="Alex">
        <div>
          <p style="font-size:14px;"><strong onclick="navigateToProfile('alex_designer')" style="cursor:pointer;">Alex Rivera</strong> commented: <span style="color:var(--text-secondary)">"Completely agree on state management..."</span></p>
          <span style="font-size:11px; color:var(--text-muted);">2 days ago</span>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 9. SIDEBAR DATA LOADER
// ==========================================

async function loadSidebarData() {
  try {
    const data = await api.getExploreData();
    
    // Render Who to Follow
    DOM.suggestionsContainer.innerHTML = '';
    if (data.suggestions.length === 0) {
      DOM.suggestionsContainer.innerHTML = `<p style="font-size: 12px; color: var(--text-secondary); text-align:center;">You are following everyone! 🪐</p>`;
    } else {
      data.suggestions.forEach(user => {
        DOM.suggestionsContainer.innerHTML += components.suggestionItem(user, false);
      });
    }

    // Render Trends
    DOM.trendsContainer.innerHTML = '';
    data.trends.forEach(trend => {
      DOM.trendsContainer.innerHTML += components.trendItem(trend);
    });
  } catch (err) {
    console.error('Failed to load sidebar content:', err.message);
  }
}

// ==========================================
// 10. TOAST SYSTEM
// ==========================================

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '#icon-explore' : '#icon-close';
  
  toast.innerHTML = `
    <svg style="width:18px; height:18px; stroke:currentColor; fill:none; stroke-width:2.5;"><use href="${icon}"></use></svg>
    <span>${escapeHTML(message)}</span>
  `;
  
  DOM.toastPortal.appendChild(toast);
  
  // Trigger removal after animation
  setTimeout(() => {
    toast.style.transform = 'translateX(-100%)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Expose toast function globally for dynamic error handling
window.showToast = showToast;
