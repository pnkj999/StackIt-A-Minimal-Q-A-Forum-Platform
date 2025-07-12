import React, { useEffect, useState } from 'react';
import { ProtectedAdminRoute } from '../components/Auth/ProtectedRoute';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const AdminTags = () => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', color: '#000000' });
    const [editing, setEditing] = useState(null);
    const { getAuthHeader } = useAuth();

    const fetchTags = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/questions/tags?limit=100`);
            const data = await res.json();
            setTags(data.tags || []);
        } catch (e) {
            toast.error('Failed to fetch tags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTags(); }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editing ? 'PUT' : 'POST';
            const url = editing
                ? `${process.env.REACT_APP_API_URL}/api/questions/tags/${editing.id}`
                : `${process.env.REACT_APP_API_URL}/api/questions/tags`;
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error('Failed to save tag');
            toast.success(editing ? 'Tag updated' : 'Tag created');
            setForm({ name: '', color: '#000000' });
            setEditing(null);
            fetchTags();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const handleEdit = (tag) => {
        setEditing(tag);
        setForm({ name: tag.name, color: tag.color });
    };

    const handleDelete = async (tag) => {
        if (!window.confirm(`Delete tag "${tag.name}"?`)) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/questions/tags/${tag.id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });
            if (!res.ok) throw new Error('Failed to delete tag');
            toast.success('Tag deleted');
            fetchTags();
        } catch (e) {
            toast.error(e.message);
        }
    };

    return (
        <ProtectedAdminRoute>
            <div className="max-w-2xl mx-auto py-8">
                <h1 className="text-2xl font-bold mb-6">Tag Management</h1>
                <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
                    <Input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Tag name"
                        className="w-1/2"
                        required
                    />
                    <input
                        name="color"
                        type="color"
                        value={form.color}
                        onChange={handleChange}
                        className="w-12 h-12 border-none"
                        title="Tag color"
                    />
                    <Button type="submit">{editing ? 'Update' : 'Add'} Tag</Button>
                    {editing && (
                        <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm({ name: '', color: '#000000' }); }}>Cancel</Button>
                    )}
                </form>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <table className="w-full border text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">Name</th>
                                <th className="p-2 text-left">Color</th>
                                <th className="p-2 text-left">Questions</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tags.map(tag => (
                                <tr key={tag.id}>
                                    <td className="p-2">{tag.name}</td>
                                    <td className="p-2"><span className="inline-block w-6 h-6 rounded-full border" style={{ backgroundColor: tag.color }} title={tag.color}></span></td>
                                    <td className="p-2">{tag.question_count}</td>
                                    <td className="p-2 flex gap-2">
                                        <Button type="button" size="sm" onClick={() => handleEdit(tag)}>Edit</Button>
                                        <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(tag)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </ProtectedAdminRoute>
    );
};

export default AdminTags; 