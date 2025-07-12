import React, { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../contexts/NotificationContext';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { unreadCount, notifications, markAsRead } = useNotification();

    const handleMarkAsRead = (notificationId) => {
        markAsRead([notificationId]);
    };

    const handleMarkAllAsRead = () => {
        const unreadIds = notifications
            .filter(notification => !notification.is_read)
            .map(notification => notification.id);
        markAsRead(unreadIds);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-2">
                        <div className="px-4 py-2 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-500"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    No notifications
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                                            !notification.is_read ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => handleMarkAsRead(notification.id)}
                                    >
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <p className="text-sm text-gray-900">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(notification.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
