// src/context/UserContext.jsx
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const UserContext = createContext();

// This acts as a global memory bridge between Header and Sidebar
let isOpen = false;
const listeners = new Set();

export const openSidebar = () => {
  isOpen = true;
  listeners.forEach((listener) => listener(isOpen));
};

export const closeSidebar = () => {
  isOpen = false;
  listeners.forEach((listener) => listener(isOpen));
};

// Custom hook so any component can listen to the changes
export const useSidebar = () => {
  const [state, setState] = useState(isOpen);

  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);

  return { isSidebarOpen: state, closeSidebar };
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 🔥 THE SHIELD: Track the exact timestamp of the last successful fetch
  const lastFetchTime = useRef(0);
  const STALE_TIME = 1000 * 60 * 2; // 2 minutes (adjust as needed)

  // 2. The Global Refresh Function (Now with a 'force' override)
  const refreshUser = async (forceFetch = false) => {
    if (!localStorage.getItem('user')) return;

    const now = Date.now();

    // If we are NOT forcing a fetch, and the data is still "fresh" (under 2 mins old), abort the API call.
    if (!forceFetch && (now - lastFetchTime.current < STALE_TIME)) {
      console.log("Data is still fresh, skipping background fetch.");
      return user; 
    }

    try {
      const response = await axios.get('/api/user/me', { 
        withCredentials: true 
      });
      
      const freshUserData = response.data.data || response.data.user;
      
      setUser(freshUserData);
      localStorage.setItem('user', JSON.stringify(freshUserData));
      
      // Update our timestamp!
      lastFetchTime.current = Date.now();
      
      return freshUserData;
    } catch (error) {
      console.error("Session expired or failed to refresh:", error);
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    // Initial load fetch
    refreshUser();

    // The focus listener
    const handleFocus = () => {
      // Notice we do NOT pass `true` here. It will only fetch if the 2-minute timer is up.
      refreshUser(); 
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    lastFetchTime.current = Date.now(); // Reset timer on login
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('onboardingDetails');
    localStorage.removeItem('selectedRole');
  };

  return (
    <UserContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);