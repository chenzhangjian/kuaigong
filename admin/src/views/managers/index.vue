<template>
  <div class="h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="bg-white rounded-lg p-4 mb-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索用户名/昵称"
          clearable
          class="w-60"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="searchForm.status" placeholder="状态" clearable class="w-32" @change="handleSearch">
          <el-option label="正常" value="active" />
          <el-option label="禁用" value="disabled" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加管理员
      </el-button>
    </div>

    <!-- 表格 -->
    <div class="flex-1 bg-white rounded-lg p-4 overflow-hidden">
      <el-table :data="managers" v-loading="loading" stripe class="w-full">
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="手机号" width="150" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'super_admin' ? 'danger' : 'primary'">
              {{ row.role === 'super_admin' ? '超级管理员' : '管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.last_login_at ? formatDate(row.last_login_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button 
              type="primary" 
              link 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              v-if="row.role !== 'super_admin'"
              type="danger" 
              link 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchManagers"
          @current-change="fetchManagers"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingManager ? '编辑管理员' : '新增管理员'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名"
            :disabled="!!editingManager"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password"
            placeholder="请输入密码"
            show-password
          />
          <div v-if="editingManager" class="text-gray-400 text-xs mt-1">留空则不修改密码</div>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="超级管理员" value="super_admin" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editingManager" label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { getManagers, createManager, updateManager, deleteManager } from '@/api/admin'
import { formatDateTime } from '@/utils/time'
import type { FormInstance, FormRules } from 'element-plus'

interface Manager {
  id: number
  username: string
  nickname: string
  email: string
  phone: string
  role: 'admin' | 'super_admin'
  status: 'active' | 'disabled'
  last_login_at: string
  created_at: string
}

const loading = ref(false)
const managers = ref<Manager[]>([])
const dialogVisible = ref(false)
const submitting = ref(false)
const editingManager = ref<Manager | null>(null)
const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: '',
  status: '',
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  role: 'admin' as 'admin' | 'super_admin',
  status: 'active' as 'active' | 'disabled',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度3-50位', trigger: 'blur' },
  ],
  password: [
    { min: 6, message: '密码至少6位', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!editingManager.value && !value) {
          callback(new Error('请输入密码'))
        } else {
          callback()
        }
      },
      trigger: 'blur' 
    },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
}

const formatDate = (date: string) => {
  return formatDateTime(date)
}

const fetchManagers = async () => {
  loading.value = true
  try {
    const res = await getManagers({
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchForm.keyword,
      status: searchForm.status,
    })
    managers.value = res.managers
    pagination.total = res.total
  } catch (error) {
    console.error('Fetch managers error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchManagers()
}

const resetForm = () => {
  form.username = ''
  form.password = ''
  form.nickname = ''
  form.email = ''
  form.phone = ''
  form.role = 'admin'
  form.status = 'active'
  editingManager.value = null
}

const handleAdd = () => {
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: Manager) => {
  editingManager.value = row
  form.username = row.username
  form.password = ''
  form.nickname = row.nickname || ''
  form.email = row.email || ''
  form.phone = row.phone || ''
  form.role = row.role
  form.status = row.status
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitting.value = true
  try {
    const data: any = {
      nickname: form.nickname,
      email: form.email,
      phone: form.phone,
      role: form.role,
    }

    if (form.password) {
      data.password = form.password
    }

    if (editingManager.value) {
      data.status = form.status
      await updateManager(editingManager.value.id, data)
      ElMessage.success('更新成功')
    } else {
      data.username = form.username
      data.password = form.password
      await createManager(data)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchManagers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleToggleStatus = async (row: Manager) => {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  const action = newStatus === 'disabled' ? '禁用' : '启用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该管理员吗？`, '提示', {
      type: 'warning',
    })
    
    await updateManager(row.id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    fetchManagers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '操作失败')
    }
  }
}

const handleDelete = async (row: Manager) => {
  try {
    await ElMessageBox.confirm('确定要删除该管理员吗？此操作不可恢复！', '警告', {
      type: 'warning',
    })
    
    await deleteManager(row.id)
    ElMessage.success('删除成功')
    fetchManagers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '删除失败')
    }
  }
}

onMounted(() => {
  fetchManagers()
})
</script>
