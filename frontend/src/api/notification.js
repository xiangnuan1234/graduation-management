import request from '@/utils/request'

export function getNotificationList(params) {
  return request({
    url: '/notifications',
    method: 'GET',
    params
  })
}

export function sendNotification(data) {
  return request({
    url: '/notifications',
    method: 'POST',
    data
  })
}

export function broadcastNotification(data) {
  return request({
    url: '/notifications/broadcast',
    method: 'POST',
    data
  })
}

export function markAsRead(id) {
  return request({
    url: `/notifications/${id}/read`,
    method: 'PUT'
  })
}

export function markAllAsRead() {
  return request({
    url: '/notifications/readAll',
    method: 'PUT'
  })
}