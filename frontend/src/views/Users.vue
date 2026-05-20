<template>
  <div class="users">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleAdd">新增用户</el-button>
        </div>
      </template>
      <el-form inline :model="query">
        <el-form-item label="角色">
          <el-select v-model="query.role" placeholder="请选择" clearable>
            <el-option label="学生" value="student" />
            <el-option label="导师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业">
          <el-input v-model="query.major" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="list" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="real_name" label="真实姓名" />
        <el-table-column prop="role" label="角色">
          <template #default="{ row }">
            <el-tag v-if="row.role === 'student'" type="success">学生</el-tag>
            <el-tag v-else-if="row.role === 'teacher'" type="warning">导师</el-tag>
            <el-tag v-else type="danger">管理员</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="major" label="专业" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="handleReset(row.id)">重置密码</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="form.real_name" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role">
            <el-option label="学生" value="student" />
            <el-option label="导师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业">
          <el-input v-model="form.major" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUserList, createUser, updateUser, deleteUser, resetPassword } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive({
  id: null,
  username: '',
  password: '',
  real_name: '',
  role: 'student',
  major: '',
  email: ''
})
const query = reactive({
  role: '',
  major: '',
  page: 1,
  pageSize: 10
})
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

onMounted(() => { loadData() })

async function loadData() {
  const res = await getUserList(query)
  if (res.code === 200) {
    list.value = res.data.list
    total.value = res.data.total
  }
}

function handleAdd() {
  Object.assign(form, { id: null, username: '', password: '', real_name: '', role: 'student', major: '', email: '' })
  isEdit.value = false
  dialogVisible.value = true
}

function handleEdit(row) {
  Object.assign(form, { ...row, password: '' })
  isEdit.value = true
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    const res = isEdit.value ? await updateUser(form.id, form) : await createUser(form)
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadData()
    }
  })
}

async function handleReset(id) {
  await ElMessageBox.confirm('确定要重置密码吗？', '提示', { type: 'warning' })
  const res = await resetPassword(id)
  if (res.code === 200) {
    ElMessage.success('密码已重置为123456')
  }
}

async function handleDelete(id) {
  await ElMessageBox.confirm('确定要删除该用户吗？', '提示', { type: 'warning' })
  const res = await deleteUser(id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
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
</style>