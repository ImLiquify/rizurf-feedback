import { createContext, useContext, useState, useMemo } from 'react';

const ROLES = { EMPLOYEE: 'employee', MANAGER: 'manager', ADMIN: 'admin' };

export const RoleContext = createContext({});

const roleConfig = {
  [ROLES.EMPLOYEE]: {
    name: 'Employee',
    badgeClass: 'role-employee',
    color: '#64748B',
    bgColor: '#F1F5F9'
  },
  [ROLES.MANAGER]: {
    name: 'Manager',
    badgeClass: 'role-manager',
    color: '#D97706',
    bgColor: '#FEF3C7'
  },
  [ROLES.ADMIN]: {
    name: 'Admin',
    badgeClass: 'role-admin',
    color: '#7C3AED',
    bgColor: '#EDE9FE'
  }
};

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(ROLES.EMPLOYEE);

  const user = useMemo(() => ({
    id: 'u_alex',
    name: 'Alex Morgan',
    id: '',
    name: 'No User Selected',
    role: ROLES.EMPLOYEE,
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    skills: ['React', 'TypeScript', 'CSS Tokens', 'UI/UX']
    department: '',
    avatar: '',
    skills: []
  }), [currentRole]);

  const switchRole = (role) => {
    setCurrentRole(role);
    // user memo will automatically reflect the updated role
  };

  const canDelete = (targetId) => {
    if (currentRole === ROLES.ADMIN) return true;
    if (currentRole === ROLES.MANAGER && targetId.startsWith('u_')) {
      // Managers can delete posts/comments from their team members
      const teamMembers = ['u_marcus', 'u_priya', 'u_sarah', 'u_carlos'];
      return teamMembers.includes(targetId) || targetId === 'company';
    }
    // Employees can only delete their own posts
    return false;
  };

  const canEdit = (senderId, targetId) => {
    if (currentRole === ROLES.ADMIN) return true;
    if (currentRole === ROLES.MANAGER && senderId.startsWith('u_')) {
      return true; // Managers can edit team member posts
    }
    return senderId === 'u_alex'; // Alex Morgan (current user)
    return false;
  };

  const currentUser = useMemo(() => ({
    id: 'u_alex',
    name: 'Alex Morgan',
    id: '',
    name: 'No User Selected',
    role: currentRole,
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    department: '',
    avatar: ''
  }), [currentRole]);

  return (
    <RoleContext.Provider value={{ currentRole, user, switchRole, canDelete, canEdit, currentUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within a RoleProvider');
  return context;
}