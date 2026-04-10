<template>
  <div>
    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <el-form :inline="true" class="mb-4">
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待接单" value="pending" />
            <el-option label="已接单" value="accepted" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="searchForm.startDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="searchForm.endDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchOrders">搜索</el-button>
          <el-button type="success" @click="handleExport">导出数据</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="id" label="订单ID" width="280">
          <template #default="{ row }">
            <span class="text-gray-500 text-xs">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="taskTitle" label="任务标题" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="agreedAmount" label="金额" width="100">
          <template #default="{ row }">
            <span class="text-green-600 font-bold">¥{{ row.agreedAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="雇主" width="120">
          <template #default="{ row }">
            <div>{{ row.employer?.name }}</div>
            <div class="text-gray-400 text-xs">{{ row.employer?.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="工人" width="120">
          <template #default="{ row }">
            <div>{{ row.worker?.name || '-' }}</div>
            <div class="text-gray-400 text-xs">{{ row.worker?.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
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
          @size-change="fetchOrders"
          @current-change="fetchOrders"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getOrders, exportOrders } from '@/api/admin'
import { formatDateTime } from '@/utils/time'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const orders = ref<any[]>([])

const searchForm = reactive({
  status: '',
  startDate: '',
  endDate: '',
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
    pending: 'warning',
    accepted: 'primary',
    in_progress: '',
    completed: 'success',
    cancelled: 'danger',
  }
  return types[status] || ''
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待接单',
    accepted: '已接单',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return texts[status] || status
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrders({
      page: pagination.page,
      limit: pagination.limit,
      status: searchForm.status || undefined,
      startDate: searchForm.startDate || undefined,
      endDate: searchForm.endDate || undefined,
    })
    orders.value = res.orders
    pagination.total = res.total
  } catch (error) {
    console.error('Failed to fetch orders:', error)
  } finally {
    loading.value = false
  }
}

const handleExport = async () => {
  try {
    const blob = await exportOrders({
      status: searchForm.status || undefined,
      startDate: searchForm.startDate || undefined,
      endDate: searchForm.endDate || undefined,
    })
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders_${Date.now()}.csv`
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
  fetchOrders()
})
</script>
