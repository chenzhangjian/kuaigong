<template>
  <div>
    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <el-form :inline="true" class="mb-4">
        <el-form-item label="用户类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="工人" value="worker" />
            <el-option label="雇主" value="employer" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="已认证" value="verified" />
            <el-option label="未认证" value="unverified" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="昵称/手机号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchUsers">搜索</el-button>
          <el-button type="success" @click="handleExport">导出数据</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.userType === 'worker' ? 'primary' : 'success'" size="small">
              {{ row.userType === 'worker' ? '工人' : '雇主' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="认证" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isVerified ? 'success' : 'info'" size="small">
              {{ row.isVerified ? '已认证' : '未认证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评分" width="80">
          <template #default="{ row }">
            <span class="text-yellow-500">{{ row.rating?.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="completedOrders" label="完成订单" width="90" />
        <el-table-column prop="balance" label="余额" width="100">
          <template #default="{ row }">
            ¥{{ row.balance?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showUserDetail(row.id)">查看</el-button>
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
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="900px" destroy-on-close>
      <div v-if="detailLoading" class="flex justify-center py-10">
        <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      </div>
      
      <div v-else-if="userDetail" class="user-detail">
        <!-- 基本信息 -->
        <el-descriptions title="基本信息" :column="3" border class="mb-6">
          <el-descriptions-item label="用户ID">{{ userDetail.user.id }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ userDetail.user.phone }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ userDetail.user.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">
            <el-tag :type="userDetail.user.userType === 'worker' ? 'primary' : 'success'">
              {{ userDetail.user.userType === 'worker' ? '工人' : '雇主' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="认证状态">
            <el-tag :type="userDetail.user.isVerified ? 'success' : 'info'">
              {{ userDetail.user.isVerified ? '已认证' : '未认证' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="在线状态">
            <el-tag :type="userDetail.user.isOnline ? 'success' : 'info'">
              {{ userDetail.user.isOnline ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ userDetail.user.realName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ userDetail.user.idCard || '-' }}</el-descriptions-item>
          <el-descriptions-item label="在线状态">
            <el-tag :type="userDetail.user.isOnline ? 'success' : 'info'">
              {{ userDetail.user.isOnline ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="个人简介" :span="3">{{ userDetail.user.bio || '-' }}</el-descriptions-item>
          <el-descriptions-item label="技能标签" :span="3">
            <template v-if="userDetail.user.skills?.length">
              <el-tag v-for="skill in userDetail.user.skills" :key="skill" class="mr-1">{{ skill }}</el-tag>
            </template>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(userDetail.user.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(userDetail.user.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 账户信息 -->
        <el-descriptions title="账户信息" :column="3" border class="mb-6">
          <el-descriptions-item label="评分">
            <span class="text-yellow-500 text-lg">{{ userDetail.user.rating?.toFixed(1) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="总订单数">{{ userDetail.user.totalOrders }}</el-descriptions-item>
          <el-descriptions-item label="已完成订单">{{ userDetail.user.completedOrders }}</el-descriptions-item>
          <el-descriptions-item label="账户余额">
            <span class="text-lg text-green-600">¥{{ userDetail.user.balance?.toFixed(2) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 订单统计 -->
        <el-descriptions title="订单统计" :column="3" border class="mb-6">
          <el-descriptions-item label="作为雇主">{{ userDetail.orderStats.employerOrders }} 单</el-descriptions-item>
          <el-descriptions-item label="作为工人">{{ userDetail.orderStats.workerOrders }} 单</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ userDetail.orderStats.completedOrders }} 单</el-descriptions-item>
          <el-descriptions-item label="已取消">{{ userDetail.orderStats.cancelledOrders }} 单</el-descriptions-item>
          <el-descriptions-item label="总收入">
            <span class="text-green-600">¥{{ userDetail.orderStats.totalEarnings?.toFixed(2) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 任务统计（仅雇主） -->
        <el-descriptions v-if="userDetail.taskStats" title="任务统计（雇主）" :column="3" border class="mb-6">
          <el-descriptions-item label="发布任务">{{ userDetail.taskStats.totalTasks }} 个</el-descriptions-item>
          <el-descriptions-item label="待接单">{{ userDetail.taskStats.openTasks }} 个</el-descriptions-item>
          <el-descriptions-item label="已指派">{{ userDetail.taskStats.assignedTasks }} 个</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ userDetail.taskStats.completedTasks }} 个</el-descriptions-item>
          <el-descriptions-item label="已取消">{{ userDetail.taskStats.cancelledTasks }} 个</el-descriptions-item>
        </el-descriptions>

        <!-- 评价统计 -->
        <el-descriptions title="评价统计" :column="2" border class="mb-6">
          <el-descriptions-item label="收到评价">{{ userDetail.reviewStats.totalReviews }} 条</el-descriptions-item>
          <el-descriptions-item label="平均评分">
            <span class="text-yellow-500">{{ userDetail.reviewStats.avgRating?.toFixed(1) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 银行卡信息 -->
        <div class="mb-6">
          <h4 class="text-base font-bold mb-3">银行卡（{{ userDetail.bankCards?.length || 0 }} 张）</h4>
          <el-table v-if="userDetail.bankCards?.length" :data="userDetail.bankCards" size="small" border>
            <el-table-column prop="bankName" label="银行" width="120" />
            <el-table-column prop="bankCardNumber" label="卡号" width="120">
              <template #default="{ row }">**** **** **** {{ row.bankCardNumber }}</template>
            </el-table-column>
            <el-table-column prop="cardHolderName" label="持卡人" width="100" />
            <el-table-column label="默认" width="80">
              <template #default="{ row }">
                <el-tag :type="row.isDefault ? 'success' : 'info'" size="small">
                  {{ row.isDefault ? '默认' : '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'active' ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="绑定时间">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无银行卡" :image-size="60" />
        </div>

        <!-- 认证记录 -->
        <div v-if="userDetail.verification" class="mb-6">
          <h4 class="text-base font-bold mb-3">实名认证</h4>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="真实姓名">{{ userDetail.verification.realName }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ userDetail.verification.idCardNumber }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getVerificationStatusType(userDetail.verification.status)">
                {{ getVerificationStatusText(userDetail.verification.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatDate(userDetail.verification.submittedAt) }}</el-descriptions-item>
            <el-descriptions-item label="审核时间">{{ formatDate(userDetail.verification.reviewedAt) }}</el-descriptions-item>
            <el-descriptions-item v-if="userDetail.verification.rejectReason" label="拒绝原因">
              <span class="text-red-500">{{ userDetail.verification.rejectReason }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 证书列表（仅工人） -->
        <div v-if="userDetail.user.userType === 'worker'" class="mb-6">
          <h4 class="text-base font-bold mb-3">技术证书（{{ userDetail.certificates?.length || 0 }} 个）</h4>
          <el-table v-if="userDetail.certificates?.length" :data="userDetail.certificates" size="small" border>
            <el-table-column prop="certificateName" label="证书名称" min-width="150" />
            <el-table-column prop="certificateType" label="类型" width="100" />
            <el-table-column prop="issueDate" label="发证日期" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getCertStatusType(row.status)" size="small">
                  {{ getCertStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column v-if="row.status === 'rejected'" label="拒绝原因">
              <template #default="{ row }">
                <span class="text-red-500">{{ row.rejectReason }}</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无证书" :image-size="60" />
        </div>

        <!-- 最近交易记录 -->
        <div class="mb-6">
          <h4 class="text-base font-bold mb-3">最近交易（10 条）</h4>
          <el-table v-if="userDetail.transactions?.length" :data="userDetail.transactions" size="small" border>
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="getTransactionType(row.type).color" size="small">
                  {{ getTransactionType(row.type).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="100">
              <template #default="{ row }">
                <span :class="row.type === 'income' || row.type === 'recharge' ? 'text-green-600' : 'text-red-500'">
                  {{ row.type === 'income' || row.type === 'recharge' ? '+' : '-' }}¥{{ row.amount?.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="余额" width="100">
              <template #default="{ row }">¥{{ row.balanceAfter?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'completed' ? '完成' : '处理中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="150" />
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无交易记录" :image-size="60" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getUsers, getUserDetail, exportUsers } from '@/api/admin'
import { formatDateTime } from '@/utils/time'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const users = ref<any[]>([])

const searchForm = reactive({
  type: '',
  status: '',
  keyword: '',
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 用户详情
const detailVisible = ref(false)
const detailLoading = ref(false)
const userDetail = ref<any>(null)

const formatDate = (date: string) => {
  if (!date) return '-'
  return formatDateTime(date)
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers({
      page: pagination.page,
      limit: pagination.limit,
      type: searchForm.type || undefined,
      status: searchForm.status || undefined,
      keyword: searchForm.keyword || undefined,
    })
    users.value = res.users
    pagination.total = res.total
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

const showUserDetail = async (userId: string) => {
  detailVisible.value = true
  detailLoading.value = true
  userDetail.value = null
  
  try {
    const res = await getUserDetail(userId)
    userDetail.value = res
  } catch (error) {
    console.error('Failed to fetch user detail:', error)
  } finally {
    detailLoading.value = false
  }
}

const handleExport = async () => {
  try {
    const blob = await exportUsers({
      type: searchForm.type || undefined,
      status: searchForm.status || undefined,
    })
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `users_${Date.now()}.csv`
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

// 认证状态
const getVerificationStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return types[status] || 'info'
}

const getVerificationStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  }
  return texts[status] || status
}

// 证书状态
const getCertStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return types[status] || 'info'
}

const getCertStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  }
  return texts[status] || status
}

// 交易类型
const getTransactionType = (type: string) => {
  const types: Record<string, { label: string; color: string }> = {
    recharge: { label: '充值', color: 'success' },
    withdraw: { label: '提现', color: 'danger' },
    payment: { label: '支付', color: 'danger' },
    income: { label: '收入', color: 'success' },
    refund: { label: '退款', color: 'warning' },
  }
  return types[type] || { label: type, color: 'info' }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.mb-6 {
  margin-bottom: 24px;
}

.mr-1 {
  margin-right: 4px;
}

.text-lg {
  font-size: 18px;
}

.text-base {
  font-size: 14px;
}

.text-red-500 {
  color: #ef4444;
}

.text-green-600 {
  color: #16a34a;
}

.text-yellow-500 {
  color: #eab308;
}
</style>
