import { useState, type FormEvent } from 'react';

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
    <form className="panel" style={{ marginTop: 10 }} onSubmit={handleSubmit}>
      <label htmlFor="reply-body">Reply</label>
      <textarea id="reply-body" value={body} onChange={(e) => setBody(e.target.value)} />
      <button type="submit" className="btn small">
        Post reply
      </button>
    </form>
  );
}
