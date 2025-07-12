import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import RichTextEditor from '../Editor/RichTextEditor';
import Button from '../UI/Button';
import { useAuth } from '../../contexts/AuthContext';

const AnswerForm = ({ questionId, onSuccess }) => {
    const { control, handleSubmit, formState: { errors }, reset } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getAuthHeader } = useAuth();
    const queryClient = useQueryClient();

    const createAnswerMutation = useMutation({
        mutationFn: async (answerData) => {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(answerData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create answer');
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast.success('Answer posted successfully!');
            queryClient.invalidateQueries(['question', questionId]);
            reset();
            if (onSuccess) onSuccess(data);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const onSubmit = async (data) => {
        if (!data.content || data.content.trim() === '<p><br></p>') {
            toast.error('Please provide an answer');
            return;
        }

        setIsSubmitting(true);
        try {
            await createAnswerMutation.mutateAsync({
                ...data,
                questionId: parseInt(questionId)
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <Controller
                        name="content"
                        control={control}
                        rules={{ 
                            required: 'Answer content is required',
                            minLength: { value: 20, message: 'Answer must be at least 20 characters' }
                        }}
                        render={({ field }) => (
                            <RichTextEditor
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="Write your answer here. Be clear and provide examples if possible."
                            />
                        )}
                    />
                    {errors.content && (
                        <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Posting...' : 'Post Your Answer'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AnswerForm;
