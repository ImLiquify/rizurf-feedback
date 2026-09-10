import { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import './FeedbackWall.css';
import { FEEDBACKS } from '../../data/mockData';

export function FeedbackWall() {
  const { currentUser, currentRole, canEdit, setCurrentRole } = useRole();
  
  const switchRole = (role) => {
    setCurrentRole(role);
    // user memo will automatically reflect role change
  };
  
  // Filter out posts that the user has already reacted to
  const filteredFeedbacks = FEEDBACKS.filter(f => 
    f.authorId === currentUser.id || 
    f.reactions.HEART < (currentUser.reactions?.HEART || 0) ||
    f.reactions.CLAP < (currentUser.reactions?.CLAP || 0) ||
    f.reactions.LIGHTBULB < (currentUser.reactions?.LIGHTBULB || 0) ||
    f.reactions.RAISED_HANDS < (currentUser.reactions?.RAISED_HANDS || 0)
  );

  return (
    <>
      {/* Welcome Header */}
      <div className="feedback-wall-header">
        <h1>Employee Feedback Wall</h1>
        <p className="wall-subtitle">
          Read, react to, and contribute feedback. Be kind and constructive!
        </p>

        {/* User Stats Badges */}
        <div className="user-stats-badges">
          <span id="meSubtabReceivedBadge" className="stat-badge stat-badge-received">
            📥 {FEEDBACKS.filter(f => f.targetId === currentUser.id).length} received
          </span>

          <span id="meSubtabGivenBadge" className="stat-badge stat-badge-sent">
            📤 {FEEDBACKS.filter(f => f.authorId === currentUser.id).length} sent
          </span>
        </div>
      </div>

      {/* Main Feed - Shows all posts */}
      <main id="wallMainFeed" className="feedback-wall-main">
        {filteredFeedbacks.map(feedback => (
          <FeedbackCard key={feedback.id} feedback={feedback} />
        ))}
      </main>
    </>
  );
}

function FeedbackCard({ feedback }) {
  const { currentUser, currentRole, canEdit } = useRole();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const isOwnPost = feedback.authorId === currentUser.id;
  
  return (
    <article className="feedback-card">
      {/* Card Header */}
      <div className="feedback-card-header">
        {isOwnPost ? (
          <>
            <span className="feedback-card-label">My Feedback</span>
            <span className={`feedback-card-badge role-${currentRole}`}>
              {currentRole.toUpperCase()}
            </span>
          </>
        ) : (
          <>
            <img 
              src={feedback.senderAvatar || currentUser.avatar} 
              alt=""
              className="feedback-card-avatar"
            />
            <div className="feedback-card-info">
              <div className="feedback-card-meta">
                <span className="feedback-card-name">{feedback.senderName}</span>
                <span className="feedback-card-time">{feedback.timestamp}</span>
              </div>
            </div>
          </>
        )}

        {feedback.isAnonymous && (
          <span className="feedback-card-badge-anonymous">🎭 Anonymous</span>
        )}
      </div>

      {/* Card Content */}
      <div className="feedback-card-content">
        <p className="feedback-card-text">{feedback.content}</p>

        {feedback.targetId && feedback.targetName && (
          <div className="feedback-card-target-info">
            Target: {feedback.targetName}
          </div>
        )}
      </div>

      {/* Reactions Bar */}
      <div className="feedback-card-reactions-bar">
        {Object.entries(feedback.reactions || {}).map(([emoji, count]) => 
          count > 0 && (
            <button
              key={emoji}
              className={`reaction-btn ${currentUser.reactions?.[emoji] ? 'my-reaction' : ''}`}
              onClick={() => toggleReaction(feedback.id, emoji)}
              title={`${emoji}: ${count} ${count === 1 ? 'like' : 'likes'}`}
            >
              {emoji} {count}
            </button>
          )
        )}
      </div>

      {/* Card Footer - Actions */}
      <div className="feedback-card-footer">
        <button 
          id={`comment_btn_${feedback.id}`}
          className={`action-btn ${commentsOpen ? 'active' : ''}`}
          onClick={() => setCommentsOpen(open => !open)}
        >
          💬 {commentsOpen ? 'Hide Comments' : 'Add Comment'}
        </button>

        {canEdit(feedback.authorId) && (
          <>
            <button 
              className="action-btn edit-btn"
              onClick={() => editFeedback(feedback.id)}
            >
              ✏️ Edit
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={() => deletePost(feedback.id)}
            >
              🗑️ Delete
            </button>
          </>
        )}
      </div>

      {/* Comments Section */}
      {commentsOpen && feedback.comments && (
        <CommentThreadSection 
          feedback={feedback}
        />
      )}
    </article>
  );
}

function CommentThreadSection({ feedback }) {
  const { currentUser } = useRole();

  return (
    <div className="comment-section">
      {/* Top-level Comments */}
      {(feedback.comments || []).map((comment) => (
        <CommentItem 
          key={comment.id} 
          comment={comment}
          currentUser={currentUser}
        />
      ))}

      {/* Add New Comment */}
      <textarea
        id={`comment_input_${feedback.id}`}
        placeholder="Write a comment..."
        rows={2}
        className="comment-input"
      />

      {/* Reply to Comments Section */}
      <div id={`replies_${feedback.id}`} style={{ display: 'none' }}></div>
    </div>
  );
}

function CommentItem({ comment, currentUser }) {
  const isMyComment = comment.senderId === currentUser.id;
  
  return (
    <div className={`comment-item ${isMyComment ? 'my-comment' : ''}`}>
      <div className="comment-header">
        <img 
          src={comment.avatar || currentUser.avatar} 
          alt=""
          className="avatar"
        />
        <div className="comment-info">
          <span className="comment-author">{comment.senderName}</span>
          <span className="comment-role">{comment.role || comment.senderId}</span>
          <span className="comment-time">{comment.time}</span>
        </div>
      </div>

      <p className="comment-text">{comment.text}</p>

      {/* Comment reactions */}
      {Object.entries(comment.reactions || {}).map(([emoji, count]) => 
        count > 0 && (
          <span key={emoji} className={`reaction-item`}>
            {emoji} ({count})
          </span>
        )
      )}

      {/* Reply to this comment */}
      <button 
        className="action-btn reply-btn"
        onClick={() => toggleReplyThread(comment.id)}
        id={`reply_btn_${comment.id}`}
      >
        💬 Reply
      </button>

      {/* Render nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container" id={`replies_${comment.id}`}>
          {comment.replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={{ ...reply, avatar: reply.avatar || currentUser.avatar }}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentInputSection({ feedbackId }) {
  return (
    <textarea
      id={`comment_input_${feedbackId}`}
      placeholder="Write a comment..."
      rows={2}
      className="comment-input"
    />
  );
}

// Reply to comments thread container
const replyThreads = {}; // Store in memory for demo: { [threadId]: { postId, parentId, text, time } }

function ReplyToCommentsSection({ feedbackId }) {
  return (
    <div id={`replies_${feedbackId}`} style={{ display: 'none' }}></div>
  );
}

function toggleReplyThread(commentId) {
  const thread = document.getElementById(`replies_${commentId}`);
  const btn = document.getElementById(`reply_btn_${commentId}`);

  if (thread) {
    thread.classList.toggle('open');
    if (btn) btn.classList.toggle('active', thread.classList.contains('open'));

    const input = document.getElementById(`reply_input_${commentId}`);
    if (thread.classList.contains('open') && input) {
      input.focus();
    }
  }
}