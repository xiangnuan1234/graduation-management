import request from '@/utils/request'

export function login(username, password) {
  return request({
    url: '/auth/login',
    method: 'POST',
    data: { username, password }
  })
}

export function register(data) {
  return request({
    url: '/auth/register',
    method: 'POST',
    data
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'POST'
  })
}

export function changePassword(oldPassword, newPassword) {
  return request({
    url: '/auth/changePassword',
    method: 'POST',
    data: { oldPassword, newPassword }
  })
}