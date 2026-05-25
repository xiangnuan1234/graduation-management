<template>
  <div class="proposals">
    <!-- R2 使用统计卡片 -->
    <el-card v-if="userStore.isStudent && storageStats" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>存储空间使用情况</span>
          <el-tag :type="storageStatusType">{{ storageStatusText }}</el-tag>
        </div>
      </template>
      <el-progress 
        :percentage="parseFloat(storageStats.storage?.usagePercent || 0)" 
        :color="storageProgressColor"
        :stroke-width="20"
      >
        <template #default="{ percentage }">
          <span class="percentage-label">{{ storageStats.storage?.usedFormatted }} / {{ storageStats.storage?.limitFormatted }} ({{ percentage }}%)</span>
        </template>
      </el-progress>
      <div class="storage-info">
        <el-alert 
          v-if="!storageStats.uploadAllowed" 
          title="存储空间不足" 
          type="error" 
          :closable="false"
          show-icon
        >
          <p>R2 存储空间已接近免费额度上限（10GB），为避免产生额外费用，已暂停文件上传功能。</p>
        </el-alert>
        <el-alert 
          v-else-if="storageStats.status === 'warning'" 
          title="存储空间警告" 
          type="warning" 
          :closable="false"
          show-icon
        >
          <p>存储空间使用已超过 85%，请注意控制文件大小。当前最大允许上传：{{ storageStats.maxFileSizeFormatted }}</p>
        </el-alert>
        <el-alert 
          v-else
          title="存储状态正常" 
          type="success" 
          :closable="false"
          show-icon
        >
          <p>当前最大允许上传文件大小：{{ storageStats.maxFileSizeFormatted }}</p>
        </el-alert>
      </div>
    </el-card>

    <el-card v-if="userStore.isStudent">
      <template #header>
        <div class="card-header">
          <span>开题报告</span>
          <el-button v-if="canSubmit" type="primary" @click="handleUpload">提交开题报告</el-button>
        </div>
      </template>
      <el-descriptions v-if="myProposal" :column="2" border>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType">{{ statusText }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ myProposal.created_at }}</el-descriptions-item>
        <el-descriptions-item label="评分" v-if="myProposal.score">{{ myProposal.score }}</el-descriptions-item>
        <el-descriptions-item label="评审意见" :span="2" v-if="myProposal.comment">{{ myProposal.comment }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="您还未提交开题报告" />
    </el-card>

    <el-card v-if="userStore.isTeacher" style="margin-top: 20px">
      <template #header>
        <span>学生开题报告</span>
      </template>
      <el-table :data="proposals" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="student_name" label="学生姓名" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pass'" type="success">通过</el-tag>
            <el-tag v-else-if="row.status === 'fail'" type="danger">未通过</el-tag>
            <el-tag v-else-if="row.status === 'submitted' || row.status === 'reviewing'" type="warning">待评阅</el-tag>
            <el-tag v-else type="info">待提交</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" />
        <el-table-column prop="score" label="评分" width="80" />
        <el-table-column prop="comment" label="评审意见" show-overflow-tooltip />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              v-if="row.file_path && row.status !== 'pass'"
              size="small"
              type="primary"
              @click="openFile(row.id)"
            >查看文件</el-button>
            <el-button
              v-if="row.file_path && row.status !== 'pass'"
              size="small"
              type="success"
              @click="openReviewDialog(row)"
            >评阅</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="uploadVisible" title="提交开题报告" width="500px">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        accept=".pdf,.doc,.docx"
        action="#"
      >
        <el-button type="primary">选择文件</el-button>
        <template #tip>
          <div class="upload-tip">支持PDF、Word格式，文件大小不超过20MB</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFile">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewVisible" title="评阅开题报告" width="600px">
      <el-form :model="reviewForm" ref="reviewFormRef" label-width="80px">
        <el-form-item label="评审结果">
          <el-radio-group v-model="reviewForm.status">
            <el-radio label="pass">通过</el-radio>
            <el-radio label="fail">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="评分">
          <el-input-number v-model="reviewForm.score" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="评审意见">
          <el-input v-model="reviewForm.comment" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getProposalList, submitProposal, reviewProposal, downloadProposalFile } from '@/api/proposal'
import { getStorageUsage } from '@/api/storage'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const proposals = ref([])
const myProposal = ref(null)
const uploadVisible = ref(false)
const reviewVisible = ref(false)
const uploadRef = ref()
const reviewFormRef = ref()
const selectedFile = ref(null)
const reviewId = ref(null)
const reviewForm = reactive({
  status: 'pass',
  score: 0,
  comment: ''
})
const storageStats = ref(null)

// 计算存储状态类型
const storageStatusType = computed(() => {
  if (!storageStats.value) return 'info'
  switch (storageStats.value.status) {
    case 'critical': return 'danger'
    case 'warning': return 'warning'
    case 'notice': return ''
    default: return 'success'
  }
})

// 计算存储状态文本
const storageStatusText = computed(() => {
  if (!storageStats.value) return '未知'
  switch (storageStats.value.status) {
    case 'critical': return '严重 - 已停止上传'
    case 'warning': return '警告 - 空间紧张'
    case 'notice': return '注意 - 使用较多'
    default: return '正常'
  }
})

// 计算进度条颜色
const storageProgressColor = computed(() => {
  if (!storageStats.value) return '#67c23a'
  const percent = parseFloat(storageStats.value.storage?.usagePercent || 0)
  if (percent >= 95) return '#f56c6c'
  if (percent >= 85) return '#e6a23c'
  if (percent >= 70) return '#409eff'
  return '#67c23a'
})

const canSubmit = computed(() => !myProposal.value || myProposal.value.status === 'pending' || myProposal.value.status === 'fail')
const statusText = computed(() => {
  if (!myProposal.value) return '待提交'
  const map = { pending: '待提交', submitted: '待评阅', reviewing: '待评阅', pass: '已通过', fail: '未通过' }
  return map[myProposal.value.status] || '待提交'
})
const statusType = computed(() => {
  if (!myProposal.value) return 'info'
  const map = { pending: 'info', submitted: 'warning', reviewing: 'warning', pass: 'success', fail: 'danger' }
  return map[myProposal.value.status] || 'info'
})

onMounted(() => { 
  loadData()
  loadStorageStats()
})

async function loadStorageStats() {
  try {
    const res = await getStorageUsage()
    if (res.code === 200) {
      storageStats.value = res.data
    }
  } catch (error) {
    console.error('Failed to load storage stats:', error)
  }
}

async function loadData() {
  if (userStore.isStudent) {
    const res = await getProposalList()
    if (res.code === 200 && res.data.length > 0) {
      myProposal.value = res.data[0]
    }
  } else if (userStore.isTeacher) {
    const res = await getProposalList({ status: 'submitted' })
    if (res.code === 200) {
      proposals.value = res.data
    }
  }
}

function handleUpload() {
  uploadVisible.value = true
}

function handleFileChange(file) {
  selectedFile.value = file.raw
}

async function submitFile() {
  if (!selectedFile.value) {
    return ElMessage.warning('请选择文件')
  }

  // 检查是否允许上传
  if (storageStats.value && !storageStats.value.uploadAllowed) {
    return ElMessage.error('存储空间不足，无法上传文件')
  }

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  const res = await submitProposal(formData)
  if (res.code === 200) {
    ElMessage.success('提交成功')
    uploadVisible.value = false
    loadData()
    loadStorageStats() // 重新加载存储统计
  }
}

async function openFile(id) {
  try {
    const blob = await downloadProposalFile(id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proposal_${id}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    ElMessage.error('文件下载失败')
  }
}

function openReviewDialog(row) {
  reviewId.value = row.id
  Object.assign(reviewForm, { status: 'pass', score: row.score || 0, comment: row.comment || '' })
  reviewVisible.value = true
}

async function submitReview() {
  const res = await reviewProposal(reviewId.value, reviewForm)
  if (res.code === 200) {
    ElMessage.success('评阅成功')
    reviewVisible.value = false
    loadData()
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.upload-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}
.percentage-label {
  font-size: 14px;
  font-weight: bold;
}
.storage-info {
  margin-top: 15px;
}
.storage-info p {
  margin: 5px 0 0 0;
  font-size: 13px;
}
</style>