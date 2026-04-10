import api from './request'

// 管理员登录
export const adminLogin = (username: string, password: string) => {
  return api.post<any, { token: string; admin: any }>('/admin/login', { username, password })
}

// 获取管理员信息
export const getAdminInfo = () => {
  return api.get<any, any>('/admin/me')
}
