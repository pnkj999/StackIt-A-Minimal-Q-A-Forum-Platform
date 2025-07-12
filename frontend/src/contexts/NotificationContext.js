// frontend/src/contexts/NotificationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children, socket }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (socket && user) {
            // Join user room for real-time notifications
            socket.emit('join', user.id);

            // Listen for new notifications
            socket.on('notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Show toast notification
                toast(notification.message, {
                    icon: '🔔',
                    duration: 4000,
                });
            });

            return () => {
                socket.off('notification');
            };
        }
    }, [socket, user]);

    const markAsRead = (notificationIds) => {
        setNotifications(prev => 
            prev.map(notification => 
                notificationIds.includes(notification.id) 
                    ? { ...notification, is_read: true }
                    : notification
            )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    };

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const value = {
        unreadCount,
        notifications,
        setUnreadCount,
        setNotifications,
        markAsRead,
        addNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
