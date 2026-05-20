import request from '@/utils/request'

export function getMidtermList(params) {
  return request({
    url: '/midterms',
    method: 'GET',
    params
  })
}

export function submitMidterm(data) {
  return request({
    url: '/midterms',
    method: 'POST',
    data
  })
}

export function updateMidterm(id, data) {
  return request({
    url: `/midterms/${id}`,
    method: 'PUT',
    data
  })
}

export function reviewMidterm(id, data) {
  return request({
    url: `/midterms/${id}/review`,
    method: 'PUT',
    data
  })
}