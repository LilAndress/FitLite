import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Usuario } from '../types';
import { usuariosApi } from '../api/usuarios.api';

interface UserContextType {
  activeUser: Usuario | null;
  setActiveUser: (user: Usuario | null) => void;
  logout: () => void;
  users: Usuario[];
  isLoadingUsers: boolean;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeUser, setActiveUserState] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem('fitlite_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState<Usuario[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const setActiveUser = useCallback((user: Usuario | null) => {
    setActiveUserState(user);
    if (user) {
      localStorage.setItem('fitlite_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fitlite_active_user');
    }
  }, []);

  const logout = useCallback(() => {
    setActiveUser(null);
  }, [setActiveUser]);

  const refreshUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const saved = localStorage.getItem('fitlite_active_user');
      const currentUser: Usuario | null = saved ? JSON.parse(saved) : null;

      if (!currentUser) {
        setUsers([]);
        setActiveUserState(null);
        return;
      }

      if (currentUser.rol === 'ADMIN') {
        const data = await usuariosApi.getAll();
        setUsers(data);
        const updatedCurrent = data.find((u) => u.id === currentUser.id);
        if (updatedCurrent) {
          setActiveUserState(updatedCurrent);
          localStorage.setItem('fitlite_active_user', JSON.stringify(updatedCurrent));
        }
      } else {
        const updatedCurrent = await usuariosApi.getById(currentUser.id);
        if (updatedCurrent) {
          setActiveUserState(updatedCurrent);
          localStorage.setItem('fitlite_active_user', JSON.stringify(updatedCurrent));
        }
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  return (
    <UserContext.Provider
      value={{
        activeUser,
        setActiveUser,
        logout,
        users,
        isLoadingUsers,
        refreshUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
