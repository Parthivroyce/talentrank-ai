import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/talentrank';
import { api } from '../api';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginAs: (email: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: 'recruiter' | 'client') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadInitialUser() {
      try {
        const savedId = localStorage.getItem('talentrank_user_id') || 'usr-recruiter-01';
        api.setUserId(savedId);
        const { user } = await api.getMe();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to load user session, defaulting to demo recruiter', err);
        // Fallback to recruiter
        try {
          const { user } = await api.login('recruiter@talentrank.ai');
          setCurrentUser(user);
        } catch (e) {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    }
    loadInitialUser();
  }, []);

  const loginAs = async (email: string) => {
    setLoading(true);
    try {
      const { user } = await api.login(email);
      setCurrentUser(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('talentrank_user_id');
    setCurrentUser(null);
  };

  const switchRole = async (targetRole: 'recruiter' | 'client') => {
    const email = targetRole === 'recruiter' ? 'recruiter@talentrank.ai' : 'hiring.manager@apexfintech.com';
    await loginAs(email);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, loginAs, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
