<template>
  <div class="dashboard">
    <h2>欢迎回来，{{ userStore.user?.real_name }}</h2>
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon"><Reading /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ unreadCount }}</div>
              <div class="stat-label">待办事项</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ proposalStatus }}</div>
              <div class="stat-label">当前阶段</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon"><Calendar /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ midtermStatus }}</div>
              <div class="stat-label">中期检查</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon"><Folder /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ documentCount }}</div>
              <div class="stat-label">已上传文档</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近通知</span>
          </template>
          <el-empty v-if="notifications.length === 0" description="暂无通知" />
          <div v-else class="notification-list">
            <div v-for="item in notifications" :key="item.id" class="notification-item">
              <div class="notification-title">{{ item.title }}</div>
              <div class="notification-time">{{ item.created_at }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快捷入口</span>
          </template>
          <div class="quick-links">
            <el-button type="primary" @click="router.push('/topics')">选题中心</el-button>
            <el-button type="primary" @click="router.push('/proposals')">提交开题</el-button>
            <el-button type="primary" @click="router.push('/documents')">上传文档</el-button>
            <el-button type="primary" @click="router.push('/midterms')">中期检查</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getNotificationList } from '@/api/notification'
import { getProposalList } from '@/api/proposal'
import { getMidtermList } from '@/api/midterm'
import { getDocumentList } from '@/api/document'
import { Reading, Document, Calendar, Folder } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const unreadCount = ref(0)
const notifications = ref([])
const proposalStatus = ref('待提交')
const midtermStatus = ref('待填报')
const documentCount = ref(0)

onMounted(async () => {
  const notiRes = await getNotificationList()
  if (notiRes.code === 200) {
    unreadCount.value = notiRes.data.unreadCount
    notifications.value = notiRes.data.list.slice(0, 5)
  }

  if (userStore.isStudent) {
    const propRes = await getProposalList()
    if (propRes.code === 200 && propRes.data.length > 0) {
      const p = propRes.data[0]
      proposalStatus.value = p.status === 'pass' ? '已通过' : p.status === 'fail' ? '未通过' : p.status === 'submitted' ? '待评阅' : '待提交'
    }

    const midRes = await getMidtermList()
    if (midRes.code === 200 && midRes.data.length > 0) {
      const m = midRes.data[0]
      midtermStatus.value = m.status === 'pass' ? '已通过' : m.status === 'fail' ? '未通过' : m.status === 'submitted' ? '待检查' : '待填报'
    }

    const docRes = await getDocumentList()
    if (docRes.code === 200) {
      documentCount.value = docRes.data.length
    }
  }
})
</script>

<style scoped>
.dashboard h2 {
  margin: 0;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
}
.stat-icon {
  font-size: 40px;
  color: #409eff;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
}
.stat-label {
  color: #909399;
  font-size: 14px;
}
.notification-list {
  max-height: 300px;
  overflow-y: auto;
}
.notification-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}
.notification-title {
  font-size: 14px;
}
.notification-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>