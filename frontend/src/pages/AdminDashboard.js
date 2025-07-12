import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    UsersIcon, 
    QuestionMarkCircleIcon, 
    ChatBubbleLeftIcon,
    TagIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { getAuthHeader } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/admin/stats`,
                {
                    headers: getAuthHeader()
                }
            );
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        }
    });

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/admin/users`,
                {
                    headers: getAuthHeader()
                }
            );
            if (!response.ok) throw new Error('Failed to fetch users');
            return response.json();
        },
        enabled: activeTab === 'users'
    });

    const { data: flaggedContent, isLoading: flaggedLoading } = useQuery({
        queryKey: ['admin-flagged'],
        queryFn: async () => {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/admin/flagged`,
                {
                    headers: getAuthHeader()
                }
            );
            if (!response.ok) throw new Error('Failed to fetch flagged content');
            return response.json();
        },
        enabled: activeTab === 'moderation'
    });

    if (statsLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    const tabs = [
        { id: 'overview', name: 'Overview', icon: ChartBarIcon },
        { id: 'users', name: 'User Management', icon: UsersIcon },
        { id: 'moderation', name: 'Content Moderation', icon: ShieldCheckIcon }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">Manage your StackIt community</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-5 w-5 mr-2" />
                                {tab.name}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <UsersIcon className="h-8 w-8 text-blue-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <QuestionMarkCircleIcon className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Questions</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <ChatBubbleLeftIcon className="h-8 w-8 text-purple-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Answers</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalAnswers}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <TagIcon className="h-8 w-8 text-orange-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Tags</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalTags}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                        </div>
                        <div className="p-6">
                            {stats.recentActivity?.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.recentActivity.map((activity, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                                <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {activity.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                    </div>
                    <div className="p-6">
                        {usersLoading ? (
                            <LoadingSpinner />
                        ) : users?.users?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Questions
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Answers
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Joined
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.users.map((user) => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {user.username.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.username}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        user.role === 'admin' 
                                                            ? 'bg-red-100 text-red-800' 
                                                            : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {user.questionCount || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {user.answerCount || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Button size="sm" variant="secondary">
                                                        View Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No users found</p>
                        )}
                    </div>
                </div>
            )}

            {/* Moderation Tab */}
            {activeTab === 'moderation' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Content Moderation</h3>
                    </div>
                    <div className="p-6">
                        {flaggedLoading ? (
                            <LoadingSpinner />
                        ) : flaggedContent?.flaggedItems?.length > 0 ? (
                            <div className="space-y-4">
                                {flaggedContent.flaggedItems.map((item) => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {item.type} - {item.reason}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {new Date(item.flaggedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{item.content}</p>
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="danger">
                                                Remove
                                            </Button>
                                            <Button size="sm" variant="secondary">
                                                Dismiss
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No flagged content</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard; 