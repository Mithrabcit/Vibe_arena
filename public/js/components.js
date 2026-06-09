// Helper to format date into relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Escape HTML utility to prevent XSS attacks
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const components = {
  // 1. Post Card Component
  postCard: (post, currentUser) => {
    const isOwner = currentUser && currentUser.id === post.userId;
    const mediaHtml = post.mediaUrl 
      ? `<div class="post-media">
           <img src="${escapeHTML(post.mediaUrl)}" alt="Post Attachment" loading="lazy">
         </div>`
      : '';
      
    const deleteBtnHtml = isOwner
      ? `<button class="post-action-btn delete-btn" onclick="event.stopPropagation(); deletePost('${post.id}')" title="Delete Post">
           <svg><use href="#icon-trash"></use></svg>
         </button>`
      : '';

    const avatarUrl = post.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
    const postContent = escapeHTML(post.content).replace(/#\w+/g, '<span class="accent-link" style="color: var(--accent-cyan); font-weight: 600; cursor: pointer;">$&</span>');

    return `
      <article class="post-card glass glass-interactive" id="post-${post.id}">
        <header class="post-header">
          <div class="post-author" onclick="navigateToProfile('${post.author.username}')">
            <img src="${avatarUrl}" alt="${escapeHTML(post.author.displayName)}">
            <div class="post-author-details">
              <span class="post-author-name">${escapeHTML(post.author.displayName)}</span>
              <span class="post-author-username">@${escapeHTML(post.author.username)}</span>
            </div>
          </div>
          <span class="post-time">${formatRelativeTime(post.createdAt)}</span>
        </header>
        
        <div class="post-content">${postContent}</div>
        
        ${mediaHtml}
        
        <footer class="post-actions">
          <button class="post-action-btn like-btn ${post.isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLike('${post.id}')">
            <svg><use href="#icon-heart"></use></svg>
            <span class="likes-count">${post.likesCount}</span>
          </button>
          
          <button class="post-action-btn comment-btn" onclick="event.stopPropagation(); openCommentsDrawer('${post.id}')">
            <svg><use href="#icon-comment"></use></svg>
            <span class="comments-count">${post.commentsCount}</span>
          </button>
          
          ${deleteBtnHtml}
        </footer>
      </article>
    `;
  },

  // 2. Comment Item Component
  commentItem: (comment) => {
    const avatarUrl = comment.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
    return `
      <div class="comment-item">
        <img class="comment-avatar" src="${avatarUrl}" alt="${escapeHTML(comment.author.displayName)}">
        <div class="comment-body">
          <div class="comment-user">
            <span class="comment-author-name" onclick="navigateToProfile('${comment.author.username}')" style="cursor:pointer; hover:text-decoration:underline;">
              ${escapeHTML(comment.author.displayName)}
            </span>
            <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p class="comment-text">${escapeHTML(comment.content)}</p>
        </div>
      </div>
    `;
  },

  // 3. User Suggestion Component (Who to Follow)
  suggestionItem: (user, isFollowing = false) => {
    const avatarUrl = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
    return `
      <div class="suggestion-item" id="suggest-${user.id}">
        <div class="suggestion-user" onclick="navigateToProfile('${user.username}')">
          <img src="${avatarUrl}" alt="${escapeHTML(user.displayName)}">
          <div class="suggestion-info">
            <span class="suggestion-name">${escapeHTML(user.displayName)}</span>
            <span class="suggestion-username">@${escapeHTML(user.username)}</span>
          </div>
        </div>
        <button class="btn-follow ${isFollowing ? 'following' : ''}" onclick="toggleFollowFromSuggestion('${user.id}')">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    `;
  },

  // 4. Trending Hashtag Component
  trendItem: (trend) => {
    return `
      <li class="trend-item" onclick="searchHashtag('${escapeHTML(trend.tag)}')">
        <div style="display: flex; flex-direction: column;">
          <span class="trend-tag">${escapeHTML(trend.tag)}</span>
          <span class="trend-posts">${trend.count} posts</span>
        </div>
        <svg style="width:16px; height:16px; stroke:var(--text-secondary); fill:none; stroke-width:2;">
          <use href="#icon-trending"></use>
        </svg>
      </li>
    `;
  }
};

window.components = components; // Expose globally
