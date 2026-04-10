import api from './request'

// 获取平台统计数据
export const getStatistics = () => {
  return api.get<any, any>('/admin/statistics')
}

// 获取用户列表
export const getUsers = (params: {
  page?: number
  limit?: number
  type?: string
  keyword?: string
  status?: string
}) => {
  return api.get<any, any>('/admin/users', { params })
}

// 获取用户详情
export const getUserDetail = (id: string) => {
  return api.get<any, any>(`/admin/users/${id}`)
}

// 获取订单列表
export const getOrders = (params: {
  page?: number
  limit?: number
  status?: string
  startDate?: string
  endDate?: string
}) => {
  return api.get<any, any>('/admin/orders', { params })
}

// 获取任务列表
export const getTasks = (params: {
  page?: number
  limit?: number
  status?: string
  keyword?: string
}) => {
  return api.get<any, any>('/admin/tasks', { params })
}

// ============ 数据导出 ============

// 导出用户数据
export const exportUsers = (params: {
  type?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  return api.get<any, Blob>('/admin/export/users', { 
    params,
    responseType: 'blob'
  })
}

// 导出订单数据
export const exportOrders = (params: {
  status?: string
  startDate?: string
  endDate?: string
}) => {
  return api.get<any, Blob>('/admin/export/orders', { 
    params,
    responseType: 'blob'
  })
}

// 导出任务数据
export const exportTasks = (params: {
  status?: string
  startDate?: string
  endDate?: string
}) => {
  return api.get<any, Blob>('/admin/export/tasks', { 
    params,
    responseType: 'blob'
  })
}

// ============ 管理员管理 ============

// 获取管理员列表
export const getManagers = (params: {
  page?: number
  limit?: number
  keyword?: string
  status?: string
}) => {
  return api.get<any, any>('/admin/managers', { params })
}

// 创建管理员
export const createManager = (data: {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
  role: 'admin' | 'super_admin'
}) => {
  return api.post<any, any>('/admin/managers', data)
}

// 更新管理员
export const updateManager = (id: number, data: {
  nickname?: string
  email?: string
  phone?: string
  role?: 'admin' | 'super_admin'
  status?: 'active' | 'disabled'
  password?: string
}) => {
  return api.put<any, any>(`/admin/managers/${id}`, data)
}

// 删除管理员
export const deleteManager = (id: number) => {
  return api.delete<any, any>(`/admin/managers/${id}`)
}

// ============ 实名认证管理 ============

// 获取实名认证列表
export const getVerifications = (params: {
  page?: number
  limit?: number
  status?: string
}) => {
  return api.get<any, any>('/admin/verifications', { params })
}

// 审核实名认证
export const reviewVerification = (data: {
  verificationId: number
  status: 'approved' | 'rejected'
  rejectReason?: string
}) => {
  return api.post<any, any>('/admin/verifications/review', data)
}
