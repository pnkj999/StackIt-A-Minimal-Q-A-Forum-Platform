import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import TagInput from '../components/UI/TagInput';
import RichTextEditor from '../components/Editor/RichTextEditor';

const AskQuestion = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getAuthHeader } = useAuth();
    const navigate = useNavigate();

    const askQuestionMutation = useMutation({
        mutationFn: async (questionData) => {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(questionData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create question', { cause: error.details });
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast.success('Question posted successfully!');
            navigate(`/questions/${data.question.id}`);
        },
        onError: (error) => {
            if (error.cause && Array.isArray(error.cause)) {
                toast.error(error.cause.map(e => e.message).join('\n'));
            } else {
                toast.error(error.message);
            }
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim()) {
            toast.error('Please enter a question title');
            return;
        }

        if (!description.trim() || description.replace(/<[^>]*>/g, '').length < 1) {
            toast.error('Description must not be empty');
            return;
        }

        setIsSubmitting(true);
        try {
            await askQuestionMutation.mutateAsync({
                title: title.trim(),
                description,
                tags: tags.map(tag => tag.name)
            });
        } catch (err) {
            // Already handled in onError, but just in case
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Ask a Question</h1>
                <p className="mt-2 text-gray-600">
                    Share your knowledge and help others in the community
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Question Title *
                    </label>
                    <Input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What's your question? Be specific."
                        className="w-full"
                        maxLength={200}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        {title.length}/200 characters
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Question Description *
                    </label>
                    <RichTextEditor
                        value={description}
                        onChange={setDescription}
                        placeholder="Provide details about your question. Include code examples, error messages, or any relevant context."
                    />
                </div>

                {/* Tags */}
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                    </label>
                    <TagInput
                        tags={tags}
                        onChange={setTags}
                        placeholder="Add tags to help others find your question"
                        maxTags={5}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        Add up to 5 tags to categorize your question
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/')}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !title.trim() || !description.trim()}
                    >
                        {isSubmitting ? <LoadingSpinner /> : 'Post Question'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AskQuestion;
