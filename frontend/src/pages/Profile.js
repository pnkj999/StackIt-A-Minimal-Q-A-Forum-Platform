import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserCircleIcon, QuestionMarkCircleIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Profile = () => {
    const { user, getAuthHeader } = useAuth();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/auth/profile`,
                {
                    headers: getAuthHeader()
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            return response.json();
        },
        enabled: !!user,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Profile not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {profile.user.avatarUrl ? (
                                <img
                                    className="h-20 w-20 rounded-full border-4 border-white"
                                    src={profile.user.avatarUrl}
                                    alt={profile.user.username}
                                />
                            ) : (
                                <UserCircleIcon className="h-20 w-20 text-white" />
                            )}
                        </div>
                        <div className="ml-6">
                            <h1 className="text-2xl font-bold text-white">
                                {profile.user.username}
                            </h1>
                            <p className="text-blue-100">{profile.user.email}</p>
                            <p className="text-blue-100 text-sm">
                                Member since {new Date(profile.user.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Stats */}
                <div className="px-6 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                                <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {profile.user.questionCount || 0}
                            </div>
                            <div className="text-sm text-gray-500">Questions Asked</div>
                        </div>
                        
                        <div className="text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                                <ChatBubbleLeftIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {profile.user.answerCount || 0}
                            </div>
                            <div className="text-sm text-gray-500">Answers Given</div>
                        </div>
                        
                        <div className="text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                                <UserCircleIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {profile.user.role === 'admin' ? 'Admin' : 'Member'}
                            </div>
                            <div className="text-sm text-gray-500">Role</div>
                        </div>
                    </div>
                </div>

                {/* Profile Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="flex space-x-4">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Edit Profile
                        </button>
                        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
                            View Activity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
