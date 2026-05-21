import axios from 'axios'
import { useUserStore } from '@/store/user'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://graduation-management-api.wangbang-2023.workers.dev/api',
  timeout: 30000, // 增加到30秒
})

request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 401) {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
    }
    return res
  },
  error => {
    return Promise.reject(error)
  }
)

export default request