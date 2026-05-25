<template>
  <div class="notifications">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知中心</span>
          <el-button v-if="userStore.isAdmin || userStore.isTeacher" type="primary" @click="handleSend">发送通知</el-button>
        </div>
      </template>
      <el-form inline :model="query">
        <el-form-item label="状态">
          <el-select v-model="query.is_read" placeholder="请选择" clearable @change="loadData">
            <el-option label="未读" value="false" />
            <el-option label="已读" value="true" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="markAllRead">全部已读</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="notifications" border @row-click="handleRowClick">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column prop="is_read" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_read ? 'info' : 'danger'">{{ row.is_read ? '已读' : '未读' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" />
      </el-table>
    </el-card>

    <el-dialog v-model="sendVisible" title="发送通知" width="500px">
      <el-form :model="form" ref="formRef" label-width="80px">
        <el-form-item label="接收者" prop="user_id">
          <el-select v-model="form.user_id" placeholder="请选择接收者" clearable>
            <el-option v-for="u in users" :key="u.id" :label="u.real_name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="群发">
          <el-checkbox v-model="form.broadcast">发送给所有学生</el-checkbox>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNotification">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { useUserStore } from '@/store/user'
import { getNotificationList, sendNotification, broadcastNotification, markAsRead, markAllAsRead } from '@/api/notification'
import { getUserList } from '@/api/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const notifications = ref([])
const users = ref([])
const sendVisible = ref(false)
const formRef = ref()
const form = reactive({
  user_id: '',
  broadcast: false,
  title: '',
  content: ''
})
const query = reactive({ is_read: '' })
const refreshUnreadCount = inject('refreshUnreadCount', () => {})

onMounted(() => { loadData() })

async function loadData() {
  const res = await getNotificationList(query)
  if (res.code === 200) {
    notifications.value = res.data.list
  }
}

async function handleRowClick(row) {
  if (!row.is_read) {
    await markAsRead(row.id)
    row.is_read = true
    refreshUnreadCount()
  }
}

async function markAllRead() {
  await markAllAsRead()
  ElMessage.success('已全部标记为已读')
  loadData()
  refreshUnreadCount()
}

async function handleSend() {
  users.value = []
  form.user_id = ''
  form.broadcast = false
  form.title = ''
  form.content = ''
  sendVisible.value = true
  const res = await getUserList({ role: 'student' })
  if (res.code === 200) {
    users.value = res.data.list
  }
}

async function submitNotification() {
  if (!form.title) return ElMessage.warning('请输入标题')
  if (form.broadcast) {
    const res = await broadcastNotification({ title: form.title, content: form.content, role: 'student' })
    if (res.code === 200) {
      ElMessage.success('发送成功')
      sendVisible.value = false
    }
  } else {
    if (!form.user_id) return ElMessage.warning('请选择接收者')
    const res = await sendNotification(form)
    if (res.code === 200) {
      ElMessage.success('发送成功')
      sendVisible.value = false
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>