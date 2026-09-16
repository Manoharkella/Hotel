import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, setAuthToken } from '../services/api';
import { USERS } from '../data/mockData';

const AuthContext = createContext(null);

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
    if (currentPathRole) {
      const roleSaved = localStorage.getItem(`hotel_user_${currentPathRole}`);
      if (roleSaved) {
        try { return JSON.parse(roleSaved); } catch(e) {}
      }
      const tabSaved = sessionStorage.getItem('hotel_user');
      if (tabSaved) {
        try { return JSON.parse(tabSaved); } catch(e) {}
      }
    }
    return null;
  });

  // Sync token on boot
  useEffect(() => {
    const savedToken = localStorage.getItem('hostiq_access_token') || sessionStorage.getItem('hostiq_access_token');
    if (savedToken) {
      setAuthToken(savedToken);
      // Fetch fresh authenticated profile if user is a customer
      if (user?.role === 'customer') {
        api.getUserProfile()
          .then(profile => {
            if (profile && profile.id) {
              const updated = {
                id: profile.id,
                name: profile.full_name || profile.name,
                full_name: profile.full_name,
                email: profile.email,
                role: profile.role || 'customer',
                phone: profile.phone || '',
                city: profile.city || '',
                preferences: profile.preferences || {},
                loyalty_points: profile.loyalty_points || 0
              };
              setUser(updated);
              sessionStorage.setItem('hotel_user', JSON.stringify(updated));
              localStorage.setItem(`hotel_user_${updated.role}`, JSON.stringify(updated));
            }
          })
          .catch(() => {
            // Token might be expired or invalid
          });
      }
    }
  }, []);

  const login = useCallback((email, password, role, realUser = null, token = null) => {
    let userData = realUser;
    if (!userData) {
      let found = USERS.find(u => u.email === email);
      if (!found) {
        found = { id: 'u_' + Date.now(), name: email.split('@')[0], email, role, phone: '', avatar: null };
        if (role === 'hotel') found.hotelId = '5';
      }
      userData = found;
    }

    if (token) {
      setAuthToken(token);
    }
    
    // Store in tab session & role storage
    sessionStorage.setItem('hotel_user', JSON.stringify(userData));
    localStorage.setItem(`hotel_user_${userData.role}`, JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const signup = useCallback((name, email, password, role, realUser = null, token = null) => {
    let userData;
    if (realUser && realUser.id) {
      userData = {
        id: realUser.id,
        name: realUser.full_name || realUser.name || name,
        full_name: realUser.full_name || realUser.name || name,
        email: realUser.email || email,
        role: realUser.role || role,
        phone: realUser.phone || '',
        city: realUser.city || '',
        preferences: realUser.preferences || {},
        loyalty_points: realUser.loyalty_points || 0,
        avatar: null
      };
      if (role === 'hotel') userData.hotelId = (realUser.hotelId || realUser.id).toString();
    } else {
      userData = { id: Date.now(), name, email, role, phone: '', avatar: null };
      if (role === 'hotel') userData.hotelId = '5';
    }

    if (token) {
      setAuthToken(token);
    }

    sessionStorage.setItem('hotel_user', JSON.stringify(userData));
    localStorage.setItem(`hotel_user_${role}`, JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    const currentRole = user?.role || 'customer';
    setAuthToken(null);
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
