import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    EyeIcon, 
    ClockIcon, 
    ArrowLeftIcon,
    PencilIcon,
    TrashIcon,
    ChevronUpIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import AnswerList from '../components/Answers/AnswerList';
import AnswerForm from '../components/Answers/AnswerForm';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const QuestionDetail = () => {
    const { id } = useParams();
    const { user, getAuthHeader } = useAuth();
    const queryClient = useQueryClient();

    const { data: question, isLoading, error } = useQuery({
        queryKey: ['question', id],
        queryFn: async () => {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/questions/${id}`,
                {
                    headers: getAuthHeader()
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch question');
            }

            return response.json();
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    const voteAnswerMutation = useMutation({
        mutationFn: async ({ answerId, voteType }) => {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/answers/${answerId}/vote`,
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
            queryClient.invalidateQueries(['question', id]);
        },
        onError: (error) => {
            toast.error(error.message);
        }
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
            queryClient.invalidateQueries(['question', id]);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const acceptMutation = useMutation({
        mutationFn: async (answerId) => {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/answers/${answerId}/accept`,
                {
                    method: 'POST',
                    headers: getAuthHeader()
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to accept answer');
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success('Answer accepted successfully!');
            queryClient.invalidateQueries(['question', id]);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleAnswerVote = (answerId, voteType) => {
        if (!user) {
            toast.error('Please login to vote');
            return;
        }
        voteAnswerMutation.mutate({ answerId, voteType });
    };

    const handleQuestionVote = (voteType) => {
        if (!user) {
            toast.error('Please login to vote');
            return;
        }
        voteQuestionMutation.mutate({ questionId: id, voteType });
    };

    const handleAccept = (answerId) => {
        acceptMutation.mutate(answerId);
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Error loading question: {error.message}</p>
                <Link to="/" className="mt-4 text-blue-600 hover:text-blue-800">
                    ← Back to Questions
                </Link>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Question not found</p>
                <Link to="/" className="mt-4 text-blue-600 hover:text-blue-800">
                    ← Back to Questions
                </Link>
            </div>
        );
    }

    const canEdit = user && (user.id === question.author_id || user.role === 'admin');

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
                <Link
                    to="/"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Questions
                </Link>
            </div>

            {/* Question */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center mr-6">
                        <button
                            onClick={() => handleQuestionVote(1)}
                            disabled={!user || user.id === question.author_id}
                            className={`vote-button vote-button-up ${question.user_vote === 1 ? 'active' : ''} ${(!user || user.id === question.author_id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ChevronUpIcon className="h-6 w-6" />
                        </button>
                        
                        <span className="text-xl font-bold text-gray-700 my-2">
                            {question.votes || 0}
                        </span>
                        
                        <button
                            onClick={() => handleQuestionVote(-1)}
                            disabled={!user || user.id === question.author_id}
                            className={`vote-button vote-button-down ${question.user_vote === -1 ? 'active' : ''} ${(!user || user.id === question.author_id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ChevronDownIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                            <h1 className="text-2xl font-bold text-gray-900 flex-1 mr-4">
                                {question.title}
                            </h1>
                            {canEdit && (
                                <div className="flex space-x-2">
                                    <button className="text-gray-500 hover:text-blue-600">
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button className="text-gray-500 hover:text-red-600">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Question Stats */}
                        <div className="flex items-center space-x-6 mb-6 text-sm text-gray-500">
                            <div className="flex items-center">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                <span>{question.view_count || 0} views</span>
                            </div>
                            <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                <span>asked {formatTimeAgo(question.created_at)}</span>
                            </div>
                        </div>

                        {/* Question Content */}
                        <div className="question-content mb-6" dangerouslySetInnerHTML={{ __html: question.description }} />

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {question.tags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="tag"
                                    style={{ 
                                        backgroundColor: `${tag.color}20`,
                                        color: tag.color 
                                    }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                        </div>

                        {/* Question Author */}
                        <div className="flex justify-end">
                            <div className="text-sm text-gray-500">
                                <span>asked by </span>
                                <span className="font-medium text-gray-700">{question.author}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Answers Section */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    {question.answers?.length || 0} Answer{question.answers?.length !== 1 ? 's' : ''}
                </h2>
                
                <AnswerList
                    answers={question.answers}
                    questionOwnerId={question.author_id}
                    onVote={handleAnswerVote}
                    onAccept={handleAccept}
                    currentUser={user}
                />
            </div>

            {/* Answer Form */}
            {user ? (
                <AnswerForm
                    questionId={id}
                    onSuccess={() => {
                        // Scroll to top of answers section
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                />
            ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-600 mb-4">
                        Please <Link to="/login" className="text-blue-600 hover:text-blue-800">sign in</Link> to post an answer.
                    </p>
                </div>
            )}
        </div>
    );
};

export default QuestionDetail;
