<template>
  <div class="documents">
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
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getDocumentList, uploadDocument, updateDocumentStatus } from '@/api/document'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const documents = ref([])
const uploadVisible = ref(false)
const statusVisible = ref(false)
const uploadRef = ref()
const selectedFile = ref(null)
const statusDocId = ref(null)
const statusForm = reactive({ status: 'submitted' })

onMounted(() => { loadData() })

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
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  const res = await uploadDocument(formData)
  if (res.code === 200) {
    ElMessage.success('上传成功')
    uploadVisible.value = false
    loadData()
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
</style>