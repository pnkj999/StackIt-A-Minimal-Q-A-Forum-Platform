import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    console.log('ProtectedRoute:', { isAuthenticated, loading, pathname: location.pathname });

    if (loading) {
        console.log('ProtectedRoute: Loading...');
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('ProtectedRoute: Not authenticated, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    console.log('ProtectedRoute: Authenticated, rendering children');
    return children;
};

export default ProtectedRoute;

export const ProtectedAdminRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Not Authorized</h1>
                <p className="text-gray-700">You do not have permission to access this page.</p>
            </div>
        );
    }

    return children;
};
