import request from '@/utils/request'

export function getUserList(params) {
  return request({
    url: '/users',
    method: 'GET',
    params
  })
}

export function getUserInfo() {
  return request({
    url: '/users/info',
    method: 'GET'
  })
}

export function createUser(data) {
  return request({
    url: '/users',
    method: 'POST',
    data
  })
}

export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'PUT',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'DELETE'
  })
}

export function resetPassword(id) {
  return request({
    url: `/users/resetPassword/${id}`,
    method: 'POST'
  })
}

export function batchImportUsers(users) {
  return request({
    url: '/users/batchImport',
    method: 'POST',
    data: { users }
  })
}