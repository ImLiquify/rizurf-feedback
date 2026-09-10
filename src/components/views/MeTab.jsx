import { useEffect, useState } from 'react';
import { useRole } from '../../context/RoleContext';
import './MeTab.css';

export function MeTab() {
  const { currentUser, canEdit } = useRole();
  
  return (
    <section className="me-tab">
      <div className="me-tab-header">
        <h2>My Dashboard</h2>
        
        {/* Stats */}
        <div className="me-tab-stats">
          <div className="stat-card stat-card-received">
            <span className="stat-icon">📥</span>
            <span className="stat-label">Feedback Received</span>
            <span id="meSubtabReceivedBadge" className="stat-value">{FEEDBACKS.filter(f => f.targetId === currentUser.id).length}</span>
          </div>
          
          <div className="stat-card stat-card-sent">
            <span className="stat-icon">📤</span>
            <span className="stat-label">Feedback Sent</span>
            <span id="meSubtabGivenBadge" className="stat-value">{FEEDBACKS.filter(f => f.senderId === currentUser.id).length}</span>
          </div>
          
          <div className="stat-card stat-card-total">
            <span className="stat-icon">📊</span>
            <span className="stat-label">Total Feedbacks</span>
            <span id="meTotalBadge" className="stat-value">{FEEDBACKS.length}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="me-tab-content">
        <h3>Recent Feedback</h3>
        
        {FEEDBACKS.filter(f => f.targetId === currentUser.id || f.senderId === currentUser.id)
          .slice(0, 10)
          .map(feedback => (
            <FeedbackMiniCard key={feedback.id} feedback={feedback} />
          ))}
      </div>

      {/* Global Stats */}
      <div className="me-tab-stats-section">
        <h3>Organization-Wide Stats</h3>
        
        <div className="global-stats-grid">
          <div id="statReceived" className="global-stat-card stat-received">
            <span className="global-stat-icon">📥</span>
            <span className="global-stat-label">Total Feedback Received</span>
            <span id="statReceivedCount" className="global-stat-value">{FEEDBACKS.filter(f => f.targetId === currentUser.id).length}</span>
          </div>
          
          <div id="statGiven" className="global-stat-card stat-given">
            <span className="global-stat-icon">📤</span>
            <span className="global-stat-label">Total Feedback Sent</span>
            <span id="statGivenCount" className="global-stat-value">{FEEDBACKS.filter(f => f.senderId === currentUser.id).length}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="me-tab-timeline">
        <h3>Recent Activity</h3>
        
        {FEEDBACKS.filter(f => f.targetId === currentUser.id || f.senderId === currentUser.id)
          .slice(0, 5)
          .map(feedback => (
            <ActivityItem key={feedback.id} feedback={feedback} />
          ))}
      </div>

      {/* Top Performers */}
      <div className="me-tab-performers">
        <h3>Top Performers This Week</h3>
        
        {getTopPerformers().map((perf, index) => (
          <div key={index} className="performer-card">
            <span className={`performer-rank rank-${index + 1}`}>{index + 1}</span>
            <img src={perf.avatar} alt="" className="performer-avatar" />
            <div className="performer-info">
              <span className="performer-name">{perf.name}</span>
              <span className="performer-role">{perf.role}</span>
            </div>
            <span className="performer-stats">
              {perf.received} received, {perf.sent} sent
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeedbackMiniCard({ feedback }) {
  return (
    <article className="mini-feedback-card">
      <div className="mini-fc-header">
        <span className="mini-fc-label">From {feedback.senderId}</span>
        <span className="mini-fc-time">{feedback.timestamp}</span>
      </div>
      
      <p className="mini-fc-content">{feedback.content}</p>
      
      <div className="mini-fc-reactions">
        {Object.entries(feedback.reactions || {}).map(([emoji, count]) => 
          count > 0 && (
            <span key={emoji} className="mini-fc-reaction">
              {emoji} {count}
            </span>
          )
        )}
      </div>
    </article>
  );
}

function ActivityItem({ feedback }) {
  return (
    <article className="activity-item">
      <div className="activity-icon">{feedback.senderId === 'u_marcus' ? '🎯' : 
                                    feedback.senderId === 'u_priya' ? '💾' :
                                    feedback.senderId === 'u_jordan' ? '💰' : '✨'}</div>
      
      <div className="activity-content">
        <p className="activity-text">{feedback.content}</p>
        <span className="activity-time">{feedback.timestamp}</span>
      </div>

      {Object.keys(feedback.reactions || {}).length > 0 && (
        <span className="activity-reaction-count">
          {Object.values(feedback.reactions || {}).reduce((a, b) => a + b, 0)} reactions
        </span>
      )}
    </article>
  );
}

function getTopPerformers() {
  return [
    { id: 'u_alex', name: 'Alex Morgan', role: 'Senior Frontend Developer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', received: 5, sent: 4 },
    { id: 'u_sarah', name: 'Sarah Jenkins', role: 'Engineering Manager', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', received: 3, sent: 1 },
    { id: 'u_elena', name: 'Elena Rostova', role: 'VP of Engineering', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', received: 2, sent: 0 }
  ].sort((a, b) => (b.received + b.sent) - (a.received + a.sent)).slice(0, 3);
}