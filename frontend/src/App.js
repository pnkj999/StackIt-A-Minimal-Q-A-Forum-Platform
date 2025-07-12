// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

// Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import AskQuestion from './pages/AskQuestion';
import QuestionDetail from './pages/QuestionDetail';
import Profile from './pages/Profile';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import AdminTags from './pages/AdminTags';
import AdminDashboard from './pages/AdminDashboard';
import { ProtectedAdminRoute } from './components/Auth/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                if (error.status === 404) return false;
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
        },
        mutations: {
            retry: 1,
        },
    },
});

function App() {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            transports: ['websocket', 'polling'],
            timeout: 20000,
        });

        newSocket.on('connect', () => {
            console.log('Connected to server');
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <NotificationProvider socket={socket}>
                        <Router>
                            <div className="min-h-screen bg-gray-50 flex flex-col">
                                <Navbar />
                                <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
                                    <Routes>
                                        {/* Public routes */}
                                        <Route path="/login" element={<LoginPage />} />
                                        <Route path="/register" element={<RegisterPage />} />

                                        {/* Protected routes */}
                                        <Route
                                            path="/"
                                            element={
                                                <ProtectedRoute>
                                                    <Home />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/ask"
                                            element={
                                                <ProtectedRoute>
                                                    <AskQuestion />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/questions/:id"
                                            element={
                                                <ProtectedRoute>
                                                    <QuestionDetail />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/profile"
                                            element={
                                                <ProtectedRoute>
                                                    <Profile />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin"
                                            element={
                                                <ProtectedAdminRoute>
                                                    <AdminDashboard />
                                                </ProtectedAdminRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/tags"
                                            element={
                                                <ProtectedAdminRoute>
                                                    <AdminTags />
                                                </ProtectedAdminRoute>
                                            }
                                        />
                                    </Routes>
                                </main>
                                <Footer />
                                <Toaster 
                                    position="top-right"
                                    toastOptions={{
                                        duration: 4000,
                                        style: {
                                            background: '#363636',
                                            color: '#fff',
                                        },
                                        success: {
                                            duration: 3000,
                                            theme: {
                                                primary: '#4aed88',
                                            },
                                        },
                                        error: {
                                            duration: 5000,
                                            theme: {
                                                primary: '#ff6b6b',
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </Router>
                    </NotificationProvider>
                </AuthProvider>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
