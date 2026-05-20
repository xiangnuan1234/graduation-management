import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout, changePassword as apiChangePassword } from '@/api/auth'
import { getUserInfo } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isStudent = computed(() => user.value?.role === 'student')
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username, password) {
    const res = await apiLogin(username, password)
    if (res.code === 200) {
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
    return res
  }

  async function logout() {
    await apiLogout()
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function changePassword(oldPassword, newPassword) {
    return await apiChangePassword(oldPassword, newPassword)
  }

  async function fetchUserInfo() {
    if (!token.value) return
    const res = await getUserInfo()
    if (res.code === 200) {
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    }
    return res
  }

  return {
    token,
    user,
    isLoggedIn,
    isStudent,
    isTeacher,
    isAdmin,
    login,
    logout,
    changePassword,
    fetchUserInfo
  }
})