import { createContext, useContext, useState, useCallback } from 'react';
import { USERS } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('hotel_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email, password, role, realUser = null) => {
    if (realUser) {
      sessionStorage.setItem('hotel_user', JSON.stringify(realUser));
      setUser(realUser);
      return realUser;
    }
    // Fallback for mock users
    let found = USERS.find(u => u.email === email);
    if (!found) {
      found = { id: 'u_' + Date.now(), name: email.split('@')[0], email, role, phone: '', avatar: null };
      if (role === 'hotel') found.hotelId = '11';
    }
    sessionStorage.setItem('hotel_user', JSON.stringify(found));
    setUser(found);
    return found;
  }, []);

  const signup = useCallback((name, email, password, role, hotelId = null) => {
    const newUser = { id: 'u_' + Date.now(), name, email, role, phone: '', avatar: null };
    if (role === 'hotel') newUser.hotelId = hotelId || 'h1';
    sessionStorage.setItem('hotel_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('hotel_user');
    setUser(null);
  }, []);

  const updateProfile = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      sessionStorage.setItem('hotel_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
