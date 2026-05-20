<template>
  <div class="profile">
    <el-card>
      <template #header>
        <span>个人中心</span>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户名">{{ userStore.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ userStore.user?.real_name }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-if="userStore.user?.role === 'student'" type="success">学生</el-tag>
          <el-tag v-else-if="userStore.user?.role === 'teacher'" type="warning">导师</el-tag>
          <el-tag v-else type="danger">管理员</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="专业">{{ userStore.user?.major || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>修改密码</span>
      </template>
      <el-form :model="passwordForm" :rules="rules" ref="formRef" label-width="100px" style="max-width: 400px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const formRef = ref()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const rules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请输入确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次密码输入不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

async function handleChangePassword() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    const res = await userStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      ElMessage.error(res.message)
    }
  })
}
</script>