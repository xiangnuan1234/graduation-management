import request from '@/utils/request'

export function getProposalList(params) {
  return request({
    url: '/proposals',
    method: 'GET',
    params
  })
}

export function submitProposal(formData) {
  return request({
    url: '/proposals',
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateProposal(id, formData) {
  return request({
    url: `/proposals/${id}`,
    method: 'PUT',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function reviewProposal(id, data) {
  return request({
    url: `/proposals/${id}/review`,
    method: 'PUT',
    data
  })
}