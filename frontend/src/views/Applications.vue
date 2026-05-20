<template>
  <div class="applications">
    <el-card>
      <template #header>
        <span>选题审核</span>
      </template>
      <el-table :data="applications" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="student_name" label="学生姓名" />
        <el-table-column prop="topic_title" label="申请课题" />
        <el-table-column prop="priority" label="志愿" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="warning">待审核</el-tag>
            <el-tag v-else-if="row.status === 'pass'" type="success">已通过</el-tag>
            <el-tag v-else type="danger">已拒绝</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="apply_time" label="申请时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              size="small"
              type="success"
              @click="handleApprove(row.id, 'pass')"
            >通过</el-button>
            <el-button
              v-if="row.status === 'pending'"
              size="small"
              type="danger"
              @click="handleApprove(row.id, 'reject')"
            >拒绝</el-button>
            <el-button
              v-if="row.status === 'pending'"
              size="small"
              @click="handleApprove(row.id, 'pending')"
            >待定</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getApplicationList, approveApplication } from '@/api/application'
import { ElMessage } from 'element-plus'

const applications = ref([])

onMounted(() => { loadData() })

async function loadData() {
  const res = await getApplicationList()
  if (res.code === 200) {
    applications.value = res.data
  }
}

async function handleApprove(id, status) {
  const res = await approveApplication(id, status)
  if (res.code === 200) {
    ElMessage.success('审核成功')
    loadData()
  }
}
</script>