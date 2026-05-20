import request from '@/utils/request'

export function getTopicList(params) {
  return request({
    url: '/topics',
    method: 'GET',
    params
  })
}

export function getMyTopics() {
  return request({
    url: '/topics/my-topics',
    method: 'GET'
  })
}

export function getTopicDetail(id) {
  return request({
    url: `/topics/${id}`,
    method: 'GET'
  })
}

export function createTopic(data) {
  return request({
    url: '/topics',
    method: 'POST',
    data
  })
}

export function updateTopic(id, data) {
  return request({
    url: `/topics/${id}`,
    method: 'PUT',
    data
  })
}

export function deleteTopic(id) {
  return request({
    url: `/topics/${id}`,
    method: 'DELETE'
  })
}