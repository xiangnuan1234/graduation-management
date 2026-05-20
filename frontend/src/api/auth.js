import request from '@/utils/request'

export function login(username, password) {
  return request({
    url: '/auth/login',
    method: 'POST',
    data: { username, password }
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