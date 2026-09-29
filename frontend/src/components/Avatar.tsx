import { useState } from 'react';
import { initials } from '../utils';

// The person's photo from the Intern API when there is one; their initials
// when there isn't, or when the photo fails to load.
export function Avatar({ name, photoUrl, size = 38 }: { name: string; photoUrl?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };

  if (photoUrl && !broken) {
    return <img className="avatar" src={photoUrl} alt="" style={style} onError={() => setBroken(true)} />;
  }
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
