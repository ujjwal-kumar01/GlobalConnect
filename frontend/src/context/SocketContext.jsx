import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios'; // 🔥 NEW: Imported axios to make the initial fetch
import { useUser } from './UserContext'; 

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    
    // Global Notifications State
    const [notifications, setNotifications] = useState([]); 
    
    const { user } = useUser();

    useEffect(() => {
        if (user) {
            // 🔥 NEW: Ask the database for existing unread messages on login!
            axios.get('/api/messages/unread', { withCredentials: true })
                .then((res) => {
                    if (res.data.success) {
                        setNotifications(res.data.data);
                    }
                })
                .catch(err => console.error("Failed to load past unread messages", err));

            // Initialize Socket Connection
            const socketInstance = io(import.meta.env.VITE_BACKEND_URI, {
                query: { userId: user._id }
            });

            setSocket(socketInstance);

            socketInstance.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            // Listen for NEW messages GLOBALLY
            socketInstance.on("newMessage", (message) => {
                // Add the new message to our unread notifications array
                setNotifications((prev) => [...prev, message]);
            });

            return () => {
                socketInstance.close();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    // Wrapped in useCallback to prevent infinite re-renders in Messages.jsx
    const clearNotifications = useCallback((senderId) => {
        setNotifications((prev) => prev.filter((msg) => msg.sender !== senderId));
    }, []);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, notifications, clearNotifications }}>
            {children}
        </SocketContext.Provider>
    );
};