<template>
  <div class="space-y-4">
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">总用户数</p>
              <p class="text-3xl font-bold text-blue-600 mt-2">{{ stats.users.total }}</p>
              <p class="text-xs text-gray-400 mt-1">
                今日新增 <span class="text-green-500">+{{ stats.users.todayNew }}</span>
              </p>
            </div>
            <el-icon class="text-5xl text-blue-200"><User /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">总订单数</p>
              <p class="text-3xl font-bold text-green-600 mt-2">{{ stats.orders.total }}</p>
              <p class="text-xs text-gray-400 mt-1">
                已完成 {{ stats.orders.completed }}
              </p>
            </div>
            <el-icon class="text-5xl text-green-200"><Document /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">总任务数</p>
              <p class="text-3xl font-bold text-orange-600 mt-2">{{ stats.tasks.total }}</p>
              <p class="text-xs text-gray-400 mt-1">
                待接单 {{ stats.tasks.open }}
              </p>
            </div>
            <el-icon class="text-5xl text-orange-200"><List /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">交易总额</p>
              <p class="text-3xl font-bold text-purple-600 mt-2">
                ¥{{ formatMoney(stats.orders.totalTransactionAmount) }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                今日活跃 {{ stats.activeUsers.today }}
              </p>
            </div>
            <el-icon class="text-5xl text-purple-200"><Money /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">用户增长趋势</span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button label="user">用户</el-radio-button>
                <el-radio-button label="order">订单</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart :option="chartOption" autoresize style="height: 350px" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span class="font-bold">用户类型分布</span>
          </template>
          <v-chart :option="pieOption" autoresize style="height: 350px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="font-bold">热门任务分类</span>
          </template>
          <el-table :data="stats.categories" stripe>
            <el-table-column prop="name" label="分类" />
            <el-table-column prop="taskCount" label="任务数" width="80" />
            <el-table-column prop="completedCount" label="完成数" width="80" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="font-bold">订单状态分布</span>
          </template>
          <el-table :data="orderStatusData" stripe>
            <el-table-column prop="label" label="状态" />
            <el-table-column prop="value" label="数量" width="80" />
            <el-table-column label="占比" width="100">
              <template #default="{ row }">
                <el-progress 
                  :percentage="getPercentage(row.value)" 
                  :stroke-width="10"
                  :show-text="false"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { User, Document, List, Money } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { getStatistics } from '@/api/admin'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
])

const chartType = ref('user')

const stats = ref<any>({
  users: { total: 0, workers: 0, employers: 0, todayNew: 0 },
  orders: { total: 0, completed: 0, totalTransactionAmount: 0 },
  tasks: { total: 0, open: 0 },
  activeUsers: { today: 0 },
  trends: { users: [], orders: [] },
  categories: [],
})

// 订单状态数据
const orderStatusData = computed(() => [
  { label: '待接单', value: stats.value.orders.pending || 0 },
  { label: '已接单', value: stats.value.orders.accepted || 0 },
  { label: '进行中', value: stats.value.orders.inProgress || 0 },
  { label: '已完成', value: stats.value.orders.completed || 0 },
  { label: '已取消', value: stats.value.orders.cancelled || 0 },
])

const totalOrders = computed(() => stats.value.orders.total || 1)

const getPercentage = (value: number) => {
  return Math.round((value / totalOrders.value) * 100) || 0
}

const formatMoney = (value: number) => {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

// 图表配置
const chartOption = computed(() => {
  const data = chartType.value === 'user' ? stats.value.trends.users : stats.value.trends.orders
  const reversedData = [...data].reverse()
  
  return {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: reversedData.map((item: any) => {
        const date = new Date(item.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      }),
    },
    yAxis: {
      type: 'value',
    },
    series: chartType.value === 'user' ? [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        data: reversedData.map((item: any) => item.newUsers),
        areaStyle: { opacity: 0.3 },
      },
      {
        name: '新工人',
        type: 'line',
        smooth: true,
        data: reversedData.map((item: any) => item.newWorkers),
      },
    ] : [
      {
        name: '新增订单',
        type: 'bar',
        data: reversedData.map((item: any) => item.newOrders),
      },
      {
        name: '完成订单',
        type: 'bar',
        data: reversedData.map((item: any) => item.completedOrders),
      },
    ],
  }
})

const pieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
  },
  legend: {
    bottom: '5%',
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: true,
        position: 'inner',
        formatter: '{b}: {c}',
      },
      data: [
        { value: stats.value.users.workers, name: '工人', itemStyle: { color: '#409EFF' } },
        { value: stats.value.users.employers, name: '雇主', itemStyle: { color: '#67C23A' } },
      ],
    },
  ],
}))

onMounted(async () => {
  try {
    const data = await getStatistics()
    stats.value = data
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.3s;
}
.stat-card:hover {
  transform: translateY(-4px);
}
</style>
