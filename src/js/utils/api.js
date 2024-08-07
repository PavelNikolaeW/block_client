import axios from 'axios';
import Cookies from 'js-cookie';
import {dispatch} from "./functions";
import uiRender from "./uiRender";

class Api {
    constructor() {
        // Настройка базового URL и создание экземпляра axios
        this.isLoading = false;
        this.errorMessage = '';


        this.api = axios.create({
            baseURL: 'http://127.0.0.1:8000/api/v1/',
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Добавление интерцептора запроса для вставки JWT в заголовки
        this.api.interceptors.request.use(config => {
            const token = Cookies.get('access');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        }, error => {
            return Promise.reject(error);
        });

        // Добавление интерцептора ответа для обработки истечения токена
        this.api.interceptors.response.use(response => response, async error => {
            const originalRequest = error.config;
            if (error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const tokenRefreshed = await this.refreshToken();
                    if (tokenRefreshed) {
                        return this.api(originalRequest);
                    }
                } catch (refreshError) {
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        });
    }

    // Метод для обновления токена
    async refreshToken() {
        const refresh = Cookies.get('refresh');
        if (refresh) {
            return await this.api.post('/token/refresh/', {refresh})
                .then(res => {
                    if (res.status === 200) {
                        const {access} = res.data;
                        Cookies.set('access', access);
                        return true;
                    }
                }).catch(err => {
                    console.log(err)
                    return false;
                })
        } else {
            return false;
        }
    }

    // Метод для регистрации
    async register(userData) {
        return this.api.post('/register/', userData);
    }

    async login(credentials) {
        return this.api.post('/login/', credentials)
            .then(res => {
                if (res.status === 200) {
                    const {access, refresh} = res.data;
                    Cookies.set('access', access, {expires: 30});
                    Cookies.set('refresh', refresh, {expires: 30});
                    return true;
                }
            }).catch(err => {
                console.log(err)
                return false;
            })
    }

    logout() {
        Cookies.remove('access');
        Cookies.remove('refresh');
        // Очистить заголовки авторизации
        delete this.api.defaults.headers.common['Authorization'];
    }

    async getRootBlock() {
        return this.api.get('/root-block/')
    }

    async getBlock(id) {
        return this.api.get(`/block/${id}/`)
    }

    async deleteBlock(id, data) {
        return this.api.delete(`/remove-block/`, {data})
    }

    async setBlock(id, data) {
        return await this.api.patch(`/block/${id}/`, data)
            .then(res => {
                if (res.status === 200)
                    dispatch('update-block', {block: data})
            })
            .catch(err => console.log(err))
    }

    async createBlock(data) {
        return await this.api.post('/block/', data)

    }

    async verifyToken(data) {
        return this.api.post('/token/verify/', data)
    }

}

const api = new Api()

export default api



