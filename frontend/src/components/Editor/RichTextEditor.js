// frontend/src/components/Editor/RichTextEditor.js (continued)
import React, { useRef, useEffect, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const RichTextEditor = ({ value, onChange, placeholder = "Write your content here..." }) => {
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const { getAuthHeader } = useAuth();

    useEffect(() => {
        if (!quillRef.current) {
            // Initialize Quill
            quillRef.current = new Quill(editorRef.current, {
                theme: 'snow',
                placeholder: placeholder,
                modules: {
                    toolbar: {
                        container: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'align': [] }],
                            ['link', 'image', 'code-block'],
                            ['clean']
                        ],
                        handlers: {
                            image: imageHandler
                        }
                    }
                },
                formats: [
                    'header', 'bold', 'italic', 'underline', 'strike',
                    'list', 'bullet', 'align', 'link', 'image', 'code-block'
                ]
            });

            // Handle text changes
            quillRef.current.on('text-change', () => {
                const html = quillRef.current.root.innerHTML;
                onChange(html);
            });
        }

        // Set initial content
        if (value && quillRef.current.root.innerHTML !== value) {
            quillRef.current.root.innerHTML = value;
        }
    }, [value, onChange, placeholder]);

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    toast.error('Image size must be less than 5MB');
                    return;
                }

                setIsUploading(true);
                const formData = new FormData();
                formData.append('image', file);

                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload`, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            ...getAuthHeader()
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const range = quillRef.current.getSelection();
                        quillRef.current.insertEmbed(range.index, 'image', data.url);
                        toast.success('Image uploaded successfully');
                    } else {
                        throw new Error('Upload failed');
                    }
                } catch (error) {
                    console.error('Image upload failed:', error);
                    toast.error('Failed to upload image');
                } finally {
                    setIsUploading(false);
                }
            }
        };
    };

    return (
        <div className="relative">
            <div className="bg-white rounded-lg border border-gray-300">
                <div ref={editorRef} className="h-64" />
            </div>
            {isUploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">Uploading image...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;
