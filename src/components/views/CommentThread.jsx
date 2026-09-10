import React from 'react';
import { useRole } from '../../context/RoleContext';
import './CommentThread.css';

export function CommentThread({ postId, comments }) {
  const { currentUser, currentRole } = useRole();

  if (!comments || comments.length === 0) return null;

  // State for managing nested replies and input fields
  const [replyInputs, setReplyInputs] = React.useState({});

  if (typeof React === 'undefined') {
    // Fallback for SSR or older environments
    return (
      <div className="comment-thread">
        Comments ({comments.length})
      </div>
    );
  }

  return (
    <div className="comment-thread">
      <button 
        id={`comment_btn_${postId}`}
        className="comment-toggle-btn"
        onClick={() => {
          const thread = document.getElementById(`comments_${postId}`);
          if (thread) {
            thread.classList.toggle('open');
            const btn = document.getElementById(`comment_btn_${postId}`);
            if (btn) btn.classList.toggle('active', thread.classList.contains('open'));
          }
        }}
      >
        Comments ({comments.length})
      </button>

      <div id={`comments_${postId}`} className="thread-content">
        {comments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            currentUser={currentUser}
            postId={postId}
            onReplySubmit={handleReplySubmit}
          />
        ))}

        {/* Reply Input for posting new comments */}
        <div className="comment-input-wrapper">
          <textarea
            id={`comment_input_${postId}`}
            placeholder="Write a reply to this comment..."
            rows={2}
          />
          <button 
            onClick={() => submitReply(postId)}
            className="submit-comment-btn"
          >
            Reply
          </button>
        </div>

      </div>
    </div>
  );

  function handleReplySubmit(comment, replyText) {
    // Add new reply to the parent comment's replies array immutably
    const newReply = {
      id: `r_${Date.now()}_${comment.id}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      role: currentRole,
      avatar: currentUser.avatar,
      text: replyText.trim(),
      timestamp: new Date().toISOString(),
      reactions: {}
    };

    const updatedReplies = [
      ...comment.replies.map(r => (r.id === comment.id ? null : r)),
      newReply
    ].filter(Boolean);

    // Return updated comment with new reply
    console.log('New reply added:', newReply);
    console.log('Updated replies count:', updatedReplies.length);
    
    // In a real app, this would update state immutably and trigger re-render
    showToast("💬 Reply posted!");
    
    return {
      ...comment,
      replies: updatedReplies
    };
  }
}

function CommentItem({ comment, currentUser, postId }) {
  const [isReplying, setIsReplying] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');

  // Toggle reply thread visibility for this specific comment
  const toggleReplyThread = () => {
    setIsReplying(prev => !prev);
    
    if (isReplying) {
      setReplyText('');
    }
  };

  // Handle reply submission
  const handleLocalReplySubmit = () => {
    if (!replyText.trim()) return;

    const newReply = {
      id: `r_${Date.now()}_${comment.id}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      role: currentRole,
      avatar: currentUser.avatar,
      text: replyText.trim(),
      timestamp: new Date().toISOString(),
      reactions: {}
    };

    const updatedComment = onReplySubmit(comment, replyText);

    console.log('Updated comment with reply:', updatedComment);
    
    setReplyText('');
    setIsReplying(false);
    showToast("💬 Reply posted!");
  };

  // Handle anonymous mode toggle
  const [isAnonMode, setIsAnonMode] = React.useState(comment.isAnonymous || false);

  const toggleAnonymity = () => {
    setIsAnonMode(prev => !prev);
    console.log('Anonymity toggled:', !isAnonMode ? 'anonymous' : 'revealed');
    
    // In real app, this would update isAnonymous flag and show/hide real name
    if (!isAnonMode && comment.senderId !== currentUser.id) {
      showToast("🎭 Anonymous mode enabled");
    } else if (isAnonMode && currentRole === 'Manager' || currentRole === 'Admin') {
      showToast("👤 Manager/Admin identity revealed");
    }
  };

  // Handle inline edit
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(comment.text);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      console.log('Saved edit:', editText);
      // Update comment in FEEDBACKS with isEdited: true
      setIsEditing(false);
      showToast("✏️ Comment edited");
    }
  };

  return (
    <div className={`comment-item ${comment.senderId === currentUser.id ? 'my-comment' : ''}`}>
      {/* Header with avatar, author info */}
      <div className="comment-header">
        <img 
          src={comment.avatar} 
          alt={`${comment.senderName}'s avatar`}
          className="avatar"
        />
        <div className="comment-info">
          <span className="comment-author">
            {isAnonMode && (currentRole === 'Manager' || currentRole === 'Admin') 
              ? `🎭 ${comment.senderId}` 
              : comment.senderName}
          </span>
          <span className={`comment-role`}>{comment.role}</span>
          <span className="comment-time">{formatTimeAgo(comment.timestamp)}</span>
        </div>
      </div>

      {/* Anonymous toggle for non-authors */}
      {comment.senderId !== currentUser.id && (
        <button 
          onClick={toggleAnonymity}
          className={`anon-toggle ${isAnonMode ? 'active' : ''}`}
        >
          🎭 {isAnonMode ? 'Show identity' : 'Hide identity'}
        </button>
      )}

      {/* Content - supports inline editing */}
      <div className="comment-text">
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="edit-input"
          />
        ) : (
          comment.text
        )}
        {isEditing && (
          <button onClick={handleSaveEdit}>Save</button>
        )}
        {isAnonMode && currentRole === 'Manager' || currentRole === 'Admin' ? (
          <span className="edited-badge">[Revealed]</span>
        ) : comment.isEdited && (
          <span className="edited-badge">(Edited)</span>
        )}
      </div>

      {/* Reactions */}
      <div className="reactions-container">
        {Object.entries(comment.reactions || {}).map(([emoji, count]) => 
          count > 0 && (
            <ReactionItem key={emoji} emoji={emoji} count={count}>
              {currentUser.reactions?.[emoji] ? 'remove' : 'add'}
            </ReactionItem>
          )
        )}
      </div>

      {/* Reply button */}
      <button 
        onClick={toggleReplyThread}
        className={`reply-btn ${isReplying ? 'open' : ''}`}
      >
        💬 Reply
      </button>

      {/* Nested replies container */}
      {isReplying && (
        <div className="replies-container">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.senderName}...`}
            rows={2}
            className="reply-textarea"
          />
          <button 
            onClick={handleLocalReplySubmit}
            className="submit-reply-btn"
          >
            Post Reply
          </button>
        </div>
      )}

      {/* Handle nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-list">
          {comment.replies.map((reply) => (
            <ReplyItem 
              key={reply.id} 
              reply={reply} 
              currentUser={currentUser}
              postId={postId}
              onReplySubmit={(r, rt) => handleReplySubmit(comment, rt)}
            />
          ))}
        </div>
      )}

    </div>
  );
}

function ReplyItem({ reply, currentUser, postId, onReplySubmit }) {
  // Handle delete - would remove this reply immutably from parent's replies array
  const handleDeleteReply = () => {
    console.log('Deleting reply:', reply.id);
    showToast("🗑️ Reply deleted");
    // In real app: remove from parent comment's replies array immutably
  };

  return (
    <div className="reply-item">
      <img 
        src={reply.avatar} 
        alt={`${reply.senderName}'s avatar`}
        className="avatar"
        style={{ width: '40px', height: '40px' }}
      />
      <div className="reply-content">
        <div className="reply-header">
          <span className="reply-author">{reply.senderName}</span>
          <span className={`reply-role`}>{reply.role}</span>
          <span className="reply-time">{formatTimeAgo(reply.timestamp)}</span>
        </div>

        <div className="reply-text">{reply.text}</div>

        <div className="reactions-container">
          {Object.entries(reply.reactions || {}).map(([emoji, count]) => 
            count > 0 && (
              <ReactionItem key={emoji} emoji={emoji} count={count}>
                {currentUser.reactions?.[emoji] ? 'remove' : 'add'}
              </ReactionItem>
            )
          )}
        </div>

        {/* Delete button for replies */}
        <button 
          onClick={handleDeleteReply}
          className="delete-reply-btn"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

function ReactionItem({ children, emoji, count }) {
  return (
    <button 
      className={`reaction-item ${children === 'remove' ? 'my-reaction' : ''}`}
      aria-label={`${emoji}, ${count} reactions`}
    >
      {emoji} ({count}) {children && ` - ${children}`}
    </button>
  );
}

function submitReply(postId) {
  // Get textarea value and add new comment/reply to FEEDBACKS array
  const textarea = document.getElementById(`comment_input_${postId}`);
  if (!textarea || !textarea.value.trim()) return;

  showToast("💬 Reply posted!");
  console.log('New reply:', textarea.value);
  // Implementation would update FEEDBACKS data
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // Fallback to original timestamp format for older dates
  return date.toISOString().split('T')[0];
}
