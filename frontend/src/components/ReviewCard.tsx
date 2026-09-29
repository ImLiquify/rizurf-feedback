import { useEffect, useRef, useState } from 'react';
import type { ReviewView, Visibility } from '../types';
import { ReviewForm } from './ReviewForm';
import { ReplyForm } from './ReplyForm';
import { IconDots, IconPencil, IconTrash, IconFlag } from './icons';
import { Avatar } from './Avatar';

interface ReviewCardProps {
  review: ReviewView;
  authorName: string | null;
  authorPhotoUrl?: string | null;
  metaLabel?: string; // replaces the author line, e.g. on your own given reviews
  canManage: boolean;
  canReply: boolean;
  onEdit: (input: { rating: number; body: string; visibility: Visibility }) => void;
  onDelete: () => void;
  onFlag: (reason: string) => void;
  onReply: (body: string) => void;
}

export function ReviewCard({ review, authorName, authorPhotoUrl, metaLabel, canManage, canReply, onEdit, onDelete, onFlag, onReply }: ReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [replying, setReplying] = useState(false);
  const [reason, setReason] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);

  const authorLabel =
    metaLabel ??
    (review.visibility === 'anonymous'
      ? authorName
        ? `Anonymous (author visible to you: ${authorName})`
        : 'Anonymous'
      : `— ${authorName ?? 'Unknown'}`);
  const edited = review.updatedAt !== review.createdAt;

  if (editing) {
    return (
      <div className="review-card">
        <ReviewForm
          initial={{ rating: review.rating, body: review.body, visibility: review.visibility }}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={(input) => {
            onEdit(input);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  function submitFlag(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    onFlag(reason.trim());
    setReason('');
    setFlagging(false);
  }

  return (
    <div className="review-card">
      <div className="review-top">
        <span className="stars">
          {'★'.repeat(review.rating)}
          {'☆'.repeat(5 - review.rating)}
        </span>
        <div className="menu-wrap" ref={menuRef}>
          <button className="dots-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Review actions">
            <IconDots />
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              {canManage && (
                <button
                  onClick={() => {
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                >
                  <IconPencil width={14} height={14} /> Edit
                </button>
              )}
              {canManage && (
                <button
                  className="danger-item"
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                >
                  <IconTrash width={14} height={14} /> Delete
                </button>
              )}
              <button
                onClick={() => {
                  setFlagging(true);
                  setMenuOpen(false);
                }}
              >
                <IconFlag width={14} height={14} /> Flag
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="review-meta">
        {!metaLabel && authorName && <Avatar name={authorName} photoUrl={authorPhotoUrl} size={30} />}
        {authorLabel}
        {edited && <span className="edited-tag"> - Edited</span>}
      </p>
      <p className="review-body">{review.body}</p>

      {flagging && (
        <form className="compose-bar" onSubmit={submitFlag}>
          <input
            type="text"
            placeholder="Reason for flagging"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <button type="submit" className="compose-send" aria-label="Submit flag">
            <IconFlag width={16} height={16} />
          </button>
        </form>
      )}

      {review.reply && (
        <div className="reply-block">
          <strong>Reply:</strong> {review.reply.body}
        </div>
      )}

      {canReply &&
        !review.reply &&
        (replying ? (
          <ReplyForm
            onSubmit={(body) => {
              onReply(body);
              setReplying(false);
            }}
          />
        ) : (
          <button type="button" className="link-btn" onClick={() => setReplying(true)}>
            Reply
          </button>
        ))}
    </div>
  );
}
