<template>
  <div>
    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <el-form :inline="true" class="mb-4">
        <el-form-item label="任务状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待接单" value="open" />
            <el-option label="已指派" value="assigned" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="标题/描述" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchTasks">搜索</el-button>
          <el-button type="success" @click="handleExport">导出数据</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tasks" v-loading="loading" stripe>
        <el-table-column prop="id" label="任务ID" width="80" />
        <el-table-column prop="title" label="任务标题" min-width="150" show-overflow-tooltip />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.categoryName || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预算" width="120">
          <template #default="{ row }">
            <span class="text-green-600">¥{{ row.budgetMin }}-{{ row.budgetMax }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" width="150" show-overflow-tooltip />
        <el-table-column label="工作时间" width="180">
          <template #default="{ row }">
            <span v-if="row.workTime">{{ formatDate(row.workTime) }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="发布者" width="120">
          <template #default="{ row }">
            <div>{{ row.employer?.name }}</div>
            <div class="text-gray-400 text-xs">{{ row.employer?.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button type="primary" link size="small">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchTasks"
          @current-change="fetchTasks"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getTasks, exportTasks } from '@/api/admin'
import { formatDateTime } from '@/utils/time'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tasks = ref<any[]>([])

const searchForm = reactive({
  status: '',
  keyword: '',
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

const formatDate = (date: string) => {
  return formatDateTime(date)
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    open: 'warning',
    assigned: 'primary',
    in_progress: '',
    completed: 'success',
    cancelled: 'danger',
  }
  return types[status] || ''
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    open: '待接单',
    assigned: '已指派',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return texts[status] || status
}

const fetchTasks = async () => {
  loading.value = true
  try {
    const res = await getTasks({
      page: pagination.page,
      limit: pagination.limit,
      status: searchForm.status || undefined,
      keyword: searchForm.keyword || undefined,
    })
    tasks.value = res.tasks
    pagination.total = res.total
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
  } finally {
    loading.value = false
  }
}

const handleExport = async () => {
  try {
    const blob = await exportTasks({
      status: searchForm.status || undefined,
    })
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks_${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.text-green-600 {
  color: #16a34a;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-xs {
  font-size: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
