<template>
  <div class="documents">
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
          <span>文档管理</span>
          <el-button type="primary" @click="handleUpload">上传文档</el-button>
        </div>
      </template>
      <el-table :data="documents" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="file_name" label="文件名" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'draft'" type="info">草稿</el-tag>
            <el-tag v-else-if="row.status === 'submitted'" type="warning">已提交</el-tag>
            <el-tag v-else type="success">已批阅</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploaded_at" label="上传时间" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openFile(row.file_path)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="userStore.isTeacher" style="margin-top: 20px">
      <template #header>
        <span>学生论文</span>
      </template>
      <el-table :data="documents" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="student_name" label="学生姓名" />
        <el-table-column prop="file_name" label="文件名" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'draft'" type="info">草稿</el-tag>
            <el-tag v-else-if="row.status === 'submitted'" type="warning">已提交</el-tag>
            <el-tag v-else type="success">已批阅</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploaded_at" label="上传时间" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="openFile(row.file_path)">查看</el-button>
            <el-button size="small" type="primary" @click="openStatusDialog(row)">标记</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="uploadVisible" title="上传文档" width="500px">
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
        <el-button type="primary" @click="uploadFile">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusVisible" title="标记文档状态" width="400px">
      <el-form label-width="80px">
        <el-form-item label="状态">
          <el-radio-group v-model="statusForm.status">
            <el-radio label="draft">草稿</el-radio>
            <el-radio label="submitted">已提交</el-radio>
            <el-radio label="reviewed">已批阅</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStatus">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { getDocumentList, uploadDocument, updateDocumentStatus } from '@/api/document'
import { getStorageUsage } from '@/api/storage'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const documents = ref([])
const uploadVisible = ref(false)
const statusVisible = ref(false)
const uploadRef = ref()
const selectedFile = ref(null)
const statusDocId = ref(null)
const statusForm = reactive({ status: 'submitted' })
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
  const res = await getDocumentList()
  if (res.code === 200) {
    documents.value = res.data
  }
}

function handleUpload() {
  uploadVisible.value = true
}

function handleFileChange(file) {
  selectedFile.value = file.raw
}

async function uploadFile() {
  if (!selectedFile.value) {
    return ElMessage.warning('请选择文件')
  }

  // 检查是否允许上传
  if (storageStats.value && !storageStats.value.uploadAllowed) {
    return ElMessage.error('存储空间不足，无法上传文件')
  }

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  const res = await uploadDocument(formData)
  if (res.code === 200) {
    ElMessage.success('上传成功')
    uploadVisible.value = false
    loadData()
    loadStorageStats() // 重新加载存储统计
  }
}

function openFile(path) {
  window.open('/' + path)
}

function openStatusDialog(row) {
  statusDocId.value = row.id
  statusForm.status = row.status
  statusVisible.value = true
}

async function submitStatus() {
  const res = await updateDocumentStatus(statusDocId.value, statusForm.status)
  if (res.code === 200) {
    ElMessage.success('状态更新成功')
    statusVisible.value = false
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