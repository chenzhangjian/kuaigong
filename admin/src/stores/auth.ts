import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLogin, getAdminInfo } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const admin = ref<any>(null)

  const login = async (username: string, password: string) => {
    try {
      const res = await adminLogin(username, password)
      token.value = res.token
      admin.value = res.admin
      localStorage.setItem('admin_token', res.token)
      return res
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    token.value = ''
    admin.value = null
    localStorage.removeItem('admin_token')
  }

  const fetchAdminInfo = async () => {
    try {
      const res = await getAdminInfo()
      admin.value = res
      return res
    } catch (error) {
      logout()
      throw error
    }
  }

  return {
    token,
    admin,
    login,
    logout,
    fetchAdminInfo,
  }
})
