<template>
  <div class="verifications-container">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="审核状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchVerifications">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="verifications" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" width="200">
          <template #default="{ row }">
            <div>
              <div>{{ row.user.nickname || '未设置昵称' }}</div>
              <div class="text-gray">{{ row.user.phone }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.user.userType === 'employer' ? 'primary' : 'success'">
              {{ row.user.userType === 'employer' ? '雇主' : '工人' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="真实姓名" width="100" />
        <el-table-column prop="idCardNumber" label="身份证号" width="180" />
        <el-table-column label="身份证照片" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="showImages(row)">
              查看照片
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submittedAt" label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.submittedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="拒绝原因" min-width="150">
          <template #default="{ row }">
            <span v-if="row.rejectReason" class="text-red">{{ row.rejectReason }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" size="small" @click="handleApprove(row)">
                通过
              </el-button>
              <el-button type="danger" size="small" @click="showRejectDialog(row)">
                拒绝
              </el-button>
            </template>
            <span v-else class="text-gray">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchVerifications"
          @current-change="fetchVerifications"
        />
      </div>
    </el-card>

    <!-- 查看身份证照片对话框 -->
    <el-dialog v-model="imageDialogVisible" title="身份证照片" width="800px">
      <div class="image-container" v-if="currentVerification">
        <div class="image-item">
          <div class="image-label">身份证正面</div>
          <el-image
            :src="getImageUrl(currentVerification.frontImageKey)"
            fit="contain"
            style="width: 100%; max-height: 300px"
            :preview-src-list="[getImageUrl(currentVerification.frontImageKey)]"
          />
        </div>
        <div class="image-item">
          <div class="image-label">身份证背面</div>
          <el-image
            :src="getImageUrl(currentVerification.backImageKey)"
            fit="contain"
            style="width: 100%; max-height: 300px"
            :preview-src-list="[getImageUrl(currentVerification.backImageKey)]"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 拒绝对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="500px">
      <el-form>
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getVerifications, reviewVerification } from '@/api/admin'
import { formatBeijingTime } from '@/utils/time'

interface Verification {
  id: number
  realName: string
  idCardNumber: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
  frontImageKey: string
  backImageKey: string
  submittedAt: string
  reviewedAt?: string
  user: {
    nickname: string
    phone: string
    userType: 'employer' | 'worker'
  }
}

const loading = ref(false)
const verifications = ref<Verification[]>([])
const filterForm = reactive({
  status: '',
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

const imageDialogVisible = ref(false)
const currentVerification = ref<Verification | null>(null)
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const rejectingVerification = ref<Verification | null>(null)

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  }
  return map[status] || status
}

const formatDate = (date: string) => {
  return formatBeijingTime(date, 'YYYY-MM-DD HH:mm:ss')
}

const getImageUrl = (key: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return `${baseUrl}/api/v1/storage/view/${key}`
}

const fetchVerifications = async () => {
  loading.value = true
  try {
    const res = await getVerifications({
      page: pagination.page,
      limit: pagination.limit,
      status: filterForm.status || undefined,
    })
    verifications.value = res.verifications
    pagination.total = res.total
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '获取认证列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.status = ''
  pagination.page = 1
  fetchVerifications()
}

const showImages = (verification: Verification) => {
  currentVerification.value = verification
  imageDialogVisible.value = true
}

const handleApprove = async (verification: Verification) => {
  try {
    await ElMessageBox.confirm(
      `确认通过 ${verification.realName} 的实名认证申请？`,
      '审核确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'success',
      }
    )
    
    await reviewVerification({
      verificationId: verification.id,
      status: 'approved',
    })
    
    ElMessage.success('审核通过')
    fetchVerifications()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '审核失败')
    }
  }
}

const showRejectDialog = (verification: Verification) => {
  rejectingVerification.value = verification
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const handleReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  
  try {
    await reviewVerification({
      verificationId: rejectingVerification.value!.id,
      status: 'rejected',
      rejectReason: rejectReason.value,
    })
    
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    fetchVerifications()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '操作失败')
  }
}

onMounted(() => {
  fetchVerifications()
})
</script>

<style scoped>
.verifications-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.text-gray {
  color: #909399;
  font-size: 12px;
}

.text-red {
  color: #f56c6c;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.image-container {
  display: flex;
  gap: 20px;
}

.image-item {
  flex: 1;
}

.image-label {
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}
</style>
