import { API_BASE_URL } from '../utils/constants';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(credentials) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async register(userData) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async getProfile(token) {
        return this.request('/api/auth/profile', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    // Questions endpoints
    async getQuestions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/questions${queryString ? `?${queryString}` : ''}`);
    }

    async getQuestion(id, token = null) {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return this.request(`/api/questions/${id}`, { headers });
    }

    async createQuestion(questionData, token) {
        return this.request('/api/questions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(questionData),
        });
    }

    async updateQuestion(id, questionData, token) {
        return this.request(`/api/questions/${id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(questionData),
        });
    }

    async deleteQuestion(id, token) {
        return this.request(`/api/questions/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    // Answers endpoints
    async createAnswer(answerData, token) {
        return this.request('/api/answers', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(answerData),
        });
    }

    async voteAnswer(answerId, voteType, token) {
        return this.request(`/api/answers/${answerId}/vote`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ voteType }),
        });
    }

    async acceptAnswer(answerId, token) {
        return this.request(`/api/answers/${answerId}/accept`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    // Notifications endpoints
    async getNotifications(token) {
        return this.request('/api/notifications', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    async markNotificationsAsRead(notificationIds, token) {
        return this.request('/api/notifications/mark-read', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ notificationIds }),
        });
    }

    // Upload endpoints
    async uploadImage(file, token) {
        const formData = new FormData();
        formData.append('image', file);

        return this.request('/api/upload', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
    }
}

export default new ApiService();
