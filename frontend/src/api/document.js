import request from '@/utils/request'

export function getDocumentList(params) {
  return request({
    url: '/documents',
    method: 'GET',
    params
  })
}

export function uploadDocument(formData) {
  return request({
    url: '/documents',
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateDocumentStatus(id, status) {
  return request({
    url: `/documents/${id}/status`,
    method: 'PUT',
    data: { status }
  })
}