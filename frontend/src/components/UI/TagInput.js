// frontend/src/components/UI/TagInput.js
import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';

const TagInput = ({ value = [], onChange, placeholder = "Add tags..." }) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Fetch tag suggestions
    const { data: availableTags = [] } = useQuery({
        queryKey: ['tags', inputValue],
        queryFn: async () => {
            if (inputValue.length < 2) return [];
            
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/questions/tags?search=${encodeURIComponent(inputValue)}&limit=10`
            );
            
            if (!response.ok) throw new Error('Failed to fetch tags');
            
            const data = await response.json();
            return data.tags;
        },
        enabled: inputValue.length >= 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    useEffect(() => {
        if (inputValue.length >= 2) {
            const filtered = availableTags
                .filter(tag => 
                    tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
                    !value.includes(tag.name)
                )
                .slice(0, 5);
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [inputValue, availableTags, value]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputValue.trim());
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
            removeTag(value.length - 1);
        } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
            e.preventDefault();
            // Focus first suggestion
            const firstSuggestion = suggestionsRef.current?.querySelector('button');
            firstSuggestion?.focus();
        }
    };

    const addTag = (tagName) => {
        if (tagName && !value.includes(tagName) && value.length < 5) {
            onChange([...value, tagName]);
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    const removeTag = (index) => {
        const newTags = value.filter((_, i) => i !== index);
        onChange(newTags);
    };

    const handleSuggestionClick = (tagName) => {
        addTag(tagName);
        inputRef.current?.focus();
    };

    const handleSuggestionKeyDown = (e, tagName) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagName);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="relative">
            <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-md bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                {value.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                            <XMarkIcon className="h-3 w-3" />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] outline-none bg-transparent"
                    disabled={value.length >= 5}
                />
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
                >
                    {suggestions.map((tag, index) => (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleSuggestionClick(tag.name)}
                            onKeyDown={(e) => handleSuggestionKeyDown(e, tag.name)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between"
                        >
                            <span>{tag.name}</span>
                            <span className="text-xs text-gray-500">
                                {tag.question_count} questions
                            </span>
                        </button>
                    ))}
                </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
                {value.length}/5 tags • Press Enter or comma to add
            </p>
        </div>
    );
};

export default TagInput;
