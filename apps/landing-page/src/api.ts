import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

api.interceptors.request.use(config => {
    try {
        const storageData = localStorage.getItem('client-auth-storage');
        if (storageData) {
            const { state } = JSON.parse(storageData);
            if (state && state.token) {
                config.headers.Authorization = `Bearer ${state.token}`;
            }
        }
    } catch (e) {
        console.error('Error reading client auth token', e);
    }
    return config;
});

export default api;
