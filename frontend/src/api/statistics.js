import request from '@/utils/request'

export function getOverview() {
  return request({
    url: '/statistics/overview',
    method: 'GET'
  })
}

export function getScores() {
  return request({
    url: '/statistics/scores',
    method: 'GET'
  })
}

export function getTopicPopularity() {
  return request({
    url: '/statistics/topics/popularity',
    method: 'GET'
  })
}

export function getTeachersStats() {
  return request({
    url: '/statistics/teachers/stats',
    method: 'GET'
  })
}

export function getStagesProgress() {
  return request({
    url: '/statistics/stages/progress',
    method: 'GET'
  })
}