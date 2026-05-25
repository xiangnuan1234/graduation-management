<template>
  <el-container class="layout-container">
    <el-aside :width="collapsed ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <span v-if="!collapsed">毕设管理系统</span>
        <span v-else>毕设</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="/topics" v-if="userStore.isStudent || userStore.isTeacher">
          <el-icon><Reading /></el-icon>
          <template #title>选题中心</template>
        </el-menu-item>
        <el-menu-item index="/applications" v-if="userStore.isTeacher">
          <el-icon><Checked /></el-icon>
          <template #title>选题审核</template>
        </el-menu-item>
        <el-menu-item index="/proposals" v-if="userStore.isStudent || userStore.isTeacher">
          <el-icon><Document /></el-icon>
          <template #title>开题报告</template>
        </el-menu-item>
        <el-menu-item index="/midterms" v-if="userStore.isStudent || userStore.isTeacher">
          <el-icon><Calendar /></el-icon>
          <template #title>中期检查</template>
        </el-menu-item>
        <el-menu-item index="/documents" v-if="userStore.isStudent || userStore.isTeacher">
          <el-icon><Folder /></el-icon>
          <template #title>文档管理</template>
        </el-menu-item>
        <el-menu-item index="/notifications">
          <el-icon><Bell /></el-icon>
          <template #title>
            通知中心
            <el-badge :value="unreadCount" :hidden="!unreadCount" />
          </template>
        </el-menu-item>
        <el-menu-item index="/statistics" v-if="userStore.isAdmin || userStore.isTeacher">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>统计报表</template>
        </el-menu-item>
        <el-menu-item index="/users" v-if="userStore.isAdmin">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><UserFilled /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <el-icon class="collapse-btn" @click="collapsed = !collapsed"><Fold /></el-icon>
        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="!unreadCount">
            <el-icon class="notification-btn" @click="router.push('/notifications')"><Bell /></el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.user?.real_name }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="switch">切换账户</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getNotificationList } from '@/api/notification'
import { ElMessage, ElMessageBox } from 'element-plus'
import { HomeFilled, Reading, Checked, Document, Calendar, Folder, Bell, DataAnalysis, User, UserFilled, Fold } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(false)
const unreadCount = ref(0)

async function loadUnreadCount() {
  const res = await getNotificationList()
  if (res.code === 200) {
    unreadCount.value = res.data.unreadCount
  }
}

onMounted(() => {
  loadUnreadCount()
})

provide('refreshUnreadCount', loadUnreadCount)

async function handleCommand(command) {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'switch') {
    await userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}
.sidebar {
  background: #304156;
  transition: width 0.3s;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background: #2b3a4a;
}
.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}
.collapse-btn {
  cursor: pointer;
  font-size: 20px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.notification-btn {
  cursor: pointer;
  font-size: 20px;
}
.user-dropdown {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
</style>