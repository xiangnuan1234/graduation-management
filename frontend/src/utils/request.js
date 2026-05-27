import axios from 'axios'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

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
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/login'
    }
    return res
  },
  error => {
    // 处理 HTTP 错误状态码
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        ElMessage.error('登录已过期，请重新登录')
        window.location.href = '/login'
      } else if (status === 403) {
        ElMessage.error('权限不足，无法访问该资源')
      } else if (status === 500) {
        ElMessage.error('服务器内部错误')
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export default request