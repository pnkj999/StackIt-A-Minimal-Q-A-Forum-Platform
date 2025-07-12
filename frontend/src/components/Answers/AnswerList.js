import React from 'react';
import AnswerCard from './AnswerCard';

const AnswerList = ({ answers, questionOwnerId, onVote, onAccept, currentUser }) => {
    if (!answers || answers.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No answers yet. Be the first to answer!</p>
            </div>
        );
    }

    // Sort answers: accepted first, then by votes, then by date
    const sortedAnswers = [...answers].sort((a, b) => {
        if (a.is_accepted && !b.is_accepted) return -1;
        if (!a.is_accepted && b.is_accepted) return 1;
        if (a.votes !== b.votes) return b.votes - a.votes;
        return new Date(a.created_at) - new Date(b.created_at);
    });

    return (
        <div className="space-y-6">
            {sortedAnswers.map((answer) => (
                <AnswerCard
                    key={answer.id}
                    answer={answer}
                    questionOwnerId={questionOwnerId}
                    onVote={onVote}
                    onAccept={onAccept}
                    currentUser={currentUser}
                />
            ))}
        </div>
    );
};

export default AnswerList;
