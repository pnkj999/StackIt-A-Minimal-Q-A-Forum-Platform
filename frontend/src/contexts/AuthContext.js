// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import jwtDecode from 'jwt-decode';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);
    const refreshTimeout = useRef(null);

    // Helper to clear refresh timer
    const clearRefreshTimer = () => {
        if (refreshTimeout.current) {
            clearTimeout(refreshTimeout.current);
            refreshTimeout.current = null;
        }
    };

    // Helper to schedule token refresh
    const scheduleRefresh = (exp, currentToken) => {
        clearRefreshTimer();
        const now = Date.now();
        const expiry = exp * 1000;
        const msUntilRefresh = Math.max(expiry - now - 60 * 1000, 0); // 1 min before expiry
        if (msUntilRefresh > 0) {
            refreshTimeout.current = setTimeout(() => {
                refreshToken(currentToken);
            }, msUntilRefresh);
        }
    };

    // Call backend to refresh token
    const refreshToken = async (currentToken) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentToken}`
                }
            });
            if (!response.ok) throw new Error('Token refresh failed');
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                const decoded = jwtDecode(data.token);
                setUser({
                    id: decoded.userId,
                    username: decoded.username,
                    email: decoded.email,
                    role: decoded.role
                });
                scheduleRefresh(decoded.exp, data.token);
                toast.success('Session refreshed');
            } else {
                throw new Error('No token in refresh response');
            }
        } catch (err) {
            logout();
            toast.error('Session expired. Please login again.');
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedToken = jwtDecode(storedToken);
                if (decodedToken.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setUser({
                        id: decodedToken.userId,
                        username: decodedToken.username,
                        email: decodedToken.email,
                        role: decodedToken.role
                    });
                    scheduleRefresh(decodedToken.exp, storedToken);
                } else {
                    localStorage.removeItem('token');
                    toast.error('Session expired. Please login again.');
                }
            } catch (error) {
                console.error('Invalid token:', error, storedToken);
                localStorage.removeItem('token');
                toast.error('Invalid session. Please login again.');
            }
        }
        setLoading(false);
        return () => clearRefreshTimer();
    }, []);

    useEffect(() => {
        // If token changes, reset refresh timer
        if (token) {
            try {
                const decoded = jwtDecode(token);
                scheduleRefresh(decoded.exp, token);
            } catch (e) {
                // ignore
            }
        } else {
            clearRefreshTimer();
        }
    }, [token]);

    const login = (newToken, userData) => {
        if (!newToken || !userData || !userData.username || !userData.email || !userData.id) {
            console.error('Invalid login payload:', { newToken, userData });
            toast.error('Login failed: invalid user data returned from server.');
            return;
        }
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        try {
            const decoded = jwtDecode(newToken);
            scheduleRefresh(decoded.exp, newToken);
        } catch (e) {}
        toast.success(`Welcome back, ${userData.username}!`);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        clearRefreshTimer();
        toast.success('Logged out successfully');
    };

    const getAuthHeader = () => {
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    const value = {
        user,
        token,
        login,
        logout,
        updateUser,
        getAuthHeader,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
