import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/token/refresh/`, {
                        refresh: refreshToken,
                    });
                    if (response.status === 200) {
                        localStorage.setItem('accessToken', response.data.access);
                        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh failed - logout
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            } else {
                // No refresh token - logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                // Optional: redirect to login if not already there
            }
        }
        return Promise.reject(error);
    }
);

export default api;
