import { jwtDecode } from 'jwt-decode';

export const authService = {
    getToken: () => localStorage.getItem('token'),
    
    setToken: (token) => localStorage.setItem('token', token),
    
    removeToken: () => localStorage.removeItem('token'),
    
    isTokenValid: (token) => {
        if (!token) return false;
        
        try {
            const decoded = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },
    
    getDecodedToken: (token) => {
        try {
            return jwtDecode(token);
        } catch {
            return null;
        }
    },
    
    getAuthHeaders: () => {
        const token = authService.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }
};
