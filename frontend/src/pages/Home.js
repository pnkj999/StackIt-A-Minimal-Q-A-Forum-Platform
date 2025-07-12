// frontend/src/pages/Home.js
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import QuestionCard from '../components/Questions/QuestionCard';
import Pagination from '../components/UI/Pagination';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const Home = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const { isAuthenticated, user, getAuthHeader } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['questions', currentPage, searchQuery, selectedTag, sortBy],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                sortBy,
                ...(searchQuery && { search: searchQuery }),
                ...(selectedTag && { tag: selectedTag })
            });

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/questions?${params}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch questions');
            }

            return response.json();
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    const { data: popularTags = [] } = useQuery({
        queryKey: ['popular-tags'],
        queryFn: async () => {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/questions/tags?limit=20`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch tags');
            }

            const result = await response.json();
            return result.tags;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    const voteQuestionMutation = useMutation({
        mutationFn: async ({ questionId, voteType }) => {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/questions/${questionId}/vote`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader()
                    },
                    body: JSON.stringify({ voteType })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to vote');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['questions']);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleQuestionVote = (questionId, voteType) => {
        if (!user) {
            toast.error('Please login to vote');
            return;
        }
        voteQuestionMutation.mutate({ questionId, voteType });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    const handleTagClick = (tagName) => {
        setSelectedTag(tagName === selectedTag ? '' : tagName);
        setCurrentPage(1);
    };

    const handleSortChange = (newSortBy) => {
        setSortBy(newSortBy);
        setCurrentPage(1);
    };

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Error loading questions: {error.message}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome to StackIt
                    </h1>
                    <p className="text-gray-600">
                        A community-driven Q&A platform for developers
                    </p>
                </div>
                {isAuthenticated && (
                    <Link
                        to="/ask"
                        className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ask Question
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    {/* Search */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Search Questions
                        </h3>
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search questions..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                            </div>
                        </form>
                    </div>

                    {/* Popular Tags */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Popular Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {popularTags.map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => handleTagClick(tag.name)}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                        selectedTag === tag.name
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {tag.name}
                                    <span className="ml-1 text-xs opacity-75">
                                        {tag.question_count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                                <span className="text-sm font-medium text-gray-700">
                                    Sort by:
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="most_answers">Most Answers</option>
                                    <option value="most_views">Most Views</option>
                                </select>
                            </div>
                            
                            {selectedTag && (
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 mr-2">
                                        Filtered by:
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                                        {selectedTag}
                                        <button
                                            onClick={() => handleTagClick(selectedTag)}
                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Questions List */}
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : data?.questions?.length > 0 ? (
                        <>
                            <div className="space-y-4 mb-8">
                                {data.questions.map((question) => (
                                    <QuestionCard 
                                        key={question.id} 
                                        question={question}
                                        onVote={handleQuestionVote}
                                        currentUser={user}
                                    />
                                ))}
                            </div>
                            
                            {data.pagination.pages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={data.pagination.pages}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-600 mb-4">
                                {searchQuery || selectedTag 
                                    ? 'No questions found matching your criteria.' 
                                    : 'No questions yet. Be the first to ask!'
                                }
                            </p>
                            {isAuthenticated && (
                                <Link
                                    to="/ask"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Ask the First Question
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
