import { useCurrentUser } from '../context/CurrentUserContext';

export function UserSwitcher() {
  const { currentUser, allUsers, setCurrentUserId } = useCurrentUser();

  return (
    <div className="user-switcher-field">
      <label htmlFor="mock-user-select">Viewing as</label>
      <select
        id="mock-user-select"
        className="user-switcher"
        value={currentUser.id}
        onChange={(e) => setCurrentUserId(e.target.value)}
      >
        {allUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
      </select>
    </div>
  );
}
