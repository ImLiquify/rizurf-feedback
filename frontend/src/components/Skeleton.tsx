// Placeholder shapes that match the real layout, so the page doesn't jump
// when data arrives. Announced once as "Loading" to screen readers.
type Variant = 'rows' | 'profile' | 'tiles';

// Before we know who's signed in: the app's frame with empty rows, so the
// real shell appears in place instead of popping in around the content.
export function ShellSkeleton() {
  return (
    <>
      <div className="top-accent" aria-hidden="true" />
      <div className="shell">
        <aside className="sidebar" aria-hidden="true">
          <div className="sidebar-brand">
            <Bone w={28} h={28} />
          </div>
          <nav className="nav skeleton-rail">
            {[0, 1, 2].map((i) => (
              <Bone key={i} w={24} h={24} />
            ))}
          </nav>
        </aside>
        <div className="main">
          <header className="topbar">
            <Bone w={160} h={12} />
          </header>
          <main className="content">
            <Skeleton variant="rows" />
          </main>
        </div>
      </div>
    </>
  );
}

function Bone({ w, h = 12, round }: { w: number | string; h?: number; round?: boolean }) {
  return <span className={'bone' + (round ? ' round' : '')} style={{ width: w, height: h }} />;
}

function Row() {
  return (
    <div className="skeleton-row">
      <Bone w={38} h={38} round />
      <span className="skeleton-lines">
        <Bone w="38%" h={13} />
        <Bone w="22%" h={10} />
      </span>
      <Bone w={84} h={12} />
    </div>
  );
}

function ReviewBone() {
  return (
    <div className="skeleton-card">
      <Bone w={120} h={12} />
      <span className="skeleton-inline">
        <Bone w={30} h={30} round />
        <Bone w={110} h={11} />
      </span>
      <Bone w="92%" h={11} />
      <Bone w="64%" h={11} />
    </div>
  );
}

export function Skeleton({ variant }: { variant: Variant }) {
  return (
    <div className="skeleton" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading</span>

      {variant === 'rows' && [0, 1, 2, 3, 4].map((i) => <Row key={i} />)}

      {variant === 'profile' && (
        <>
          <div className="skeleton-inline skeleton-header">
            <Bone w={56} h={56} round />
            <span className="skeleton-lines">
              <Bone w={220} h={24} />
              <Bone w={180} h={12} />
            </span>
          </div>
          <div className="skeleton-card skeleton-summary">
            <Bone w={90} h={36} />
            {[0, 1, 2, 3, 4].map((i) => (
              <Bone key={i} w="100%" h={8} />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <ReviewBone key={i} />
          ))}
        </>
      )}

      {variant === 'tiles' && (
        <div className="wall-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-card">
              <span className="skeleton-inline">
                <Bone w={38} h={38} round />
                <span className="skeleton-lines">
                  <Bone w={130} h={13} />
                  <Bone w={80} h={10} />
                </span>
              </span>
              <Bone w={70} h={10} />
              <Bone w="100%" h={44} />
              <Bone w={80} h={10} />
              <Bone w="100%" h={44} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
