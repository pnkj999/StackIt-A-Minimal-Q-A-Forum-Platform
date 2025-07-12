// frontend/src/components/Questions/QuestionCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
    ChatBubbleLeftIcon, 
    EyeIcon, 
    CheckCircleIcon,
    ClockIcon,
    ChevronUpIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import ReportModal from '../UI/ReportModal';
import { useState } from 'react';
import toast from 'react-hot-toast';

const QuestionCard = ({ question, onVote, currentUser }) => {
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

    const truncateDescription = (html, maxLength = 150) => {
        const text = html.replace(/<[^>]*>/g, '');
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const handleVote = (voteType) => {
        if (onVote) {
            onVote(question.id, voteType);
        }
    };

    const canVote = currentUser && currentUser.id !== question.author_id;

    const [showReport, setShowReport] = useState(false);
    const handleReport = async ({ targetType, targetId, reason, details }) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {})
                },
                body: JSON.stringify({ targetType, targetId, reason, details })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to report');
            }
            toast.success('Report submitted');
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex">
                {/* Vote Section */}
                <div className="flex flex-col items-center mr-6">
                    <button
                        onClick={() => handleVote(1)}
                        disabled={!canVote}
                        className={`vote-button vote-button-up ${question.user_vote === 1 ? 'active' : ''} ${!canVote ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ChevronUpIcon className="h-6 w-6" />
                    </button>
                    
                    <span className="text-xl font-bold text-gray-700 my-2">
                        {question.votes || 0}
                    </span>
                    
                    <button
                        onClick={() => handleVote(-1)}
                        disabled={!canVote}
                        className={`vote-button vote-button-down ${question.user_vote === -1 ? 'active' : ''} ${!canVote ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ChevronDownIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1">
                    <Link 
                        to={`/questions/${question.id}`}
                        className="block group"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                            {question.title}
                        </h3>
                    </Link>
                    
                    <p className="text-gray-600 text-sm mb-4">
                        {truncateDescription(question.description)}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {question.tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                    backgroundColor: `${tag.color}20`,
                                    color: tag.color 
                                }}
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                    
                    {/* Meta information */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                                <span>{question.answer_count} answers</span>
                                {question.has_accepted_answer && (
                                    <CheckCircleIcon className="h-4 w-4 ml-1 text-green-500" />
                                )}
                            </div>
                            
                            <div className="flex items-center">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                <span>{question.view_count || 0} views</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>asked {formatTimeAgo(question.created_at)}</span>
                            <span className="ml-1">by</span>
                            <span className="ml-1 font-medium text-gray-700">
                                {question.author}
                            </span>
                        </div>
                        {currentUser && (
                            <button
                                className="ml-2 px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs"
                                onClick={() => setShowReport(true)}
                            >
                                Report
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <ReportModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                onSubmit={handleReport}
                targetType="question"
                targetId={question.id}
            />
        </div>
    );
};

export default QuestionCard;
