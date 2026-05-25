import request from '@/utils/request'

export function getStorageUsage() {
  return request({
    url: '/storage/usage',
    method: 'GET'
  })
}
