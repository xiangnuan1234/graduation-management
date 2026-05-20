<template>
  <div class="proposals">
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
              @click="openFile(row.file_path)"
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
import { getProposalList, submitProposal, reviewProposal } from '@/api/proposal'
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

onMounted(() => { loadData() })

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
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  const res = await submitProposal(formData)
  if (res.code === 200) {
    ElMessage.success('提交成功')
    uploadVisible.value = false
    loadData()
  }
}

function openFile(path) {
  window.open('/' + path)
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
</style>