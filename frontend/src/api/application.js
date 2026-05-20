import request from '@/utils/request'

export function getApplicationList(params) {
  return request({
    url: '/applications',
    method: 'GET',
    params
  })
}

export function applyTopic(topicIds) {
  return request({
    url: '/applications',
    method: 'POST',
    data: { topic_ids: topicIds }
  })
}

export function approveApplication(id, status) {
  return request({
    url: `/applications/${id}/approve`,
    method: 'PUT',
    data: { status }
  })
}

export function cancelApplication(id) {
  return request({
    url: `/applications/${id}`,
    method: 'DELETE'
  })
}