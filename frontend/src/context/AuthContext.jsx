import { createContext, useContext, useState, useCallback } from 'react';
import { USERS } from '../data/mockData';

const AuthContext = createContext(null);

// Get current role context from URL path
function getCurrentPathRole() {
  const path = window.location.pathname;
  if (path.startsWith('/hotel')) return 'hotel';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/customer')) return 'customer';
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const currentPathRole = getCurrentPathRole();
    // 1. Check if user saved for this specific role exists in localStorage
    if (currentPathRole) {
      const roleSaved = localStorage.getItem(`hotel_user_${currentPathRole}`);
      if (roleSaved) {
        try { return JSON.parse(roleSaved); } catch(e) {}
      }
      // 2. Check tab session storage
      const tabSaved = sessionStorage.getItem('hotel_user');
      if (tabSaved) {
        try { return JSON.parse(tabSaved); } catch(e) {}
      }
    }
    return null;
  });

  const login = useCallback((email, password, role, realUser = null) => {
    let userData = realUser;
    if (!userData) {
      let found = USERS.find(u => u.email === email);
      if (!found) {
        found = { id: 'u_' + Date.now(), name: email.split('@')[0], email, role, phone: '', avatar: null };
        if (role === 'hotel') found.hotelId = '5';
      }
      userData = found;
    }
    
    // Store in tab session & role storage
    sessionStorage.setItem('hotel_user', JSON.stringify(userData));
    localStorage.setItem(`hotel_user_${userData.role}`, JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const signup = useCallback((name, email, password, role, realUser = null) => {
    let userData;
    if (realUser && realUser.id) {
      userData = {
        id: realUser.id,
        name: realUser.full_name || realUser.name || name,
        email: realUser.email || email,
        role: realUser.role || role,
        phone: realUser.phone || '',
        loyalty_points: realUser.loyalty_points || 0,
        avatar: null
      };
      if (role === 'hotel') userData.hotelId = (realUser.hotelId || realUser.id).toString();
    } else {
      userData = { id: Date.now(), name, email, role, phone: '', avatar: null };
      if (role === 'hotel') userData.hotelId = '5';
    }
    sessionStorage.setItem('hotel_user', JSON.stringify(userData));
    localStorage.setItem(`hotel_user_${role}`, JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    const currentRole = user?.role || 'customer';
    sessionStorage.removeItem('hotel_user');
    localStorage.removeItem(`hotel_user_${currentRole}`);
    setUser(null);
  }, [user]);

  const updateProfile = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      sessionStorage.setItem('hotel_user', JSON.stringify(updated));
      localStorage.setItem(`hotel_user_${updated.role}`, JSON.stringify(updated));
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
