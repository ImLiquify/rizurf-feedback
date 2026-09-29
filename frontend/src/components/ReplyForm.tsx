import { useState, type FormEvent } from 'react';
import { IconSend } from './icons';

interface ReplyFormProps {
  onSubmit: (body: string) => void;
}

export function ReplyForm({ onSubmit }: ReplyFormProps) {
  const [body, setBody] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    onSubmit(body.trim());
    setBody('');
  }

  return (
    <form className="compose-bar" onSubmit={handleSubmit}>
      <textarea
        autoFocus
        aria-label="Reply"
        placeholder="Write a reply…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter adds a line.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        rows={1}
      />
      <button type="submit" className="compose-send" aria-label="Post reply">
        <IconSend width={16} height={16} />
      </button>
    </form>
  );
}
