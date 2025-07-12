import React, { useState } from 'react';
import { 
    ChevronUpIcon, 
    ChevronDownIcon, 
    CheckCircleIcon,
    ClockIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import ReportModal from '../UI/ReportModal';
import toast from 'react-hot-toast';

const AnswerCard = ({ answer, questionOwnerId, onVote, onAccept, currentUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showReport, setShowReport] = useState(false);

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

    const handleVote = (voteType) => {
        if (onVote) {
            onVote(answer.id, voteType);
        }
    };

    const handleAccept = () => {
        if (onAccept) {
            onAccept(answer.id);
        }
    };

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

    const canEdit = currentUser && currentUser.id === answer.author_id;
    // Accept if current user is question owner or admin, and not already accepted
    const canAccept = currentUser && !answer.is_accepted && (currentUser.id === questionOwnerId || currentUser.role === 'admin');
    const canVote = currentUser && currentUser.id !== answer.author_id;

    return (
        <div className={`bg-white rounded-lg shadow-md p-6 ${answer.is_accepted ? 'ring-2 ring-green-500' : ''}`}>
            <div className="flex">
                {/* Vote Section */}
                <div className="flex flex-col items-center mr-6">
                    <button
                        onClick={() => handleVote(1)}
                        disabled={!canVote}
                        className={`vote-button vote-button-up ${answer.user_vote === 1 ? 'active' : ''} ${!canVote ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ChevronUpIcon className="h-6 w-6" />
                    </button>
                    
                    <span className="text-xl font-bold text-gray-700 my-2">
                        {answer.votes || 0}
                    </span>
                    
                    <button
                        onClick={() => handleVote(-1)}
                        disabled={!canVote}
                        className={`vote-button vote-button-down ${answer.user_vote === -1 ? 'active' : ''} ${!canVote ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ChevronDownIcon className="h-6 w-6" />
                    </button>

                    {canAccept && (
                        <button
                            onClick={handleAccept}
                            className="mt-4 p-2 text-gray-400 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
                            title={currentUser.role === 'admin' ? 'Accept as admin' : 'Accept this answer'}
                        >
                            <CheckCircleIcon className="h-8 w-8" />
                        </button>
                    )}

                    {answer.is_accepted && (
                        <div className="mt-4 p-2 text-green-600" title="Accepted answer">
                            <CheckCircleIconSolid className="h-8 w-8" />
                        </div>
                    )}
                </div>

                {/* Answer Content */}
                <div className="flex-1">
                    <div className="question-content" dangerouslySetInnerHTML={{ __html: answer.content }} />
                    
                    {/* Answer Meta */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                            {canEdit && (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-sm text-gray-500 hover:text-blue-600 flex items-center"
                                    >
                                        <PencilIcon className="h-4 w-4 mr-1" />
                                        Edit
                                    </button>
                                    <button className="text-sm text-gray-500 hover:text-red-600 flex items-center">
                                        <TrashIcon className="h-4 w-4 mr-1" />
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>answered {formatTimeAgo(answer.created_at)}</span>
                            <span className="ml-1">by</span>
                            <span className="ml-1 font-medium text-gray-700">
                                {answer.author}
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
                targetType="answer"
                targetId={answer.id}
            />
        </div>
    );
};

export default AnswerCard;
