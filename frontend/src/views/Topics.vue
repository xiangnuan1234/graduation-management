<template>
  <div class="topics">
    <el-card v-if="userStore.isTeacher">
      <template #header>
        <div class="card-header">
          <span>我的课题</span>
          <el-button type="primary" @click="handleAdd">发布课题</el-button>
        </div>
      </template>
      <el-table :data="myTopics" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="课题名称" />
        <el-table-column prop="description" label="课题描述" show-overflow-tooltip />
        <el-table-column prop="max_students" label="限选人数" width="100" />
        <el-table-column prop="selected_count" label="已选人数" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'open' ? 'success' : 'info'">{{ row.status === 'open' ? '开放' : '已关闭' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" :type="row.status === 'open' ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 'open' ? '关闭' : '开放' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>{{ userStore.isTeacher ? '全部课题' : '选题中心' }}</span>
      </template>
      <el-form inline :model="query">
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="请选择" clearable>
            <el-option label="开放" value="open" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="topics" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="课题名称" />
        <el-table-column prop="teacher_name" label="导师" />
        <el-table-column prop="description" label="课题描述" show-overflow-tooltip />
        <el-table-column prop="max_students" label="限选人数" width="100" />
        <el-table-column prop="selected_count" label="已选人数" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'open' ? 'success' : 'info'">{{ row.status === 'open' ? '开放' : '已关闭' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑课题' : '发布课题'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="课题名称" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="课题描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="选题要求">
          <el-input v-model="form.requirements" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="限选人数">
          <el-input-number v-model="form.max_students" :min="1" :max="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="课题详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="课题名称">{{ currentTopic?.title }}</el-descriptions-item>
        <el-descriptions-item label="导师">{{ currentTopic?.teacher_name }}</el-descriptions-item>
        <el-descriptions-item label="课题描述">{{ currentTopic?.description }}</el-descriptions-item>
        <el-descriptions-item label="选题要求">{{ currentTopic?.requirements }}</el-descriptions-item>
        <el-descriptions-item label="限选人数">{{ currentTopic?.max_students }}</el-descriptions-item>
        <el-descriptions-item label="已选人数">{{ currentTopic?.selected_count }}</el-descriptions-item>
      </el-descriptions>
      <template #footer v-if="userStore.isStudent">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleApply">申请选题</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="applyVisible" title="申请课题" width="500px">
      <el-form label-width="80px">
        <el-form-item label="选择志愿">
          <el-checkbox-group v-model="selectedTopics">
            <el-checkbox :label="currentTopic?.id">{{ currentTopic?.title }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApplication">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getTopicList, getMyTopics, createTopic, updateTopic } from '@/api/topic'
import { applyTopic } from '@/api/application'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const topics = ref([])
const myTopics = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const applyVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const currentTopic = ref(null)
const selectedTopics = ref([])
const form = reactive({
  id: null,
  title: '',
  description: '',
  requirements: '',
  max_students: 1
})
const query = reactive({ status: '' })
const rules = {
  title: [{ required: true, message: '请输入课题名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入课题描述', trigger: 'blur' }]
}

onMounted(() => { loadData() })

async function loadData() {
  const res = await getTopicList(query)
  if (res.code === 200) {
    topics.value = res.data
  }
  if (userStore.isTeacher) {
    const myRes = await getMyTopics()
    if (myRes.code === 200) {
      myTopics.value = myRes.data
    }
  }
}

function handleAdd() {
  Object.assign(form, { id: null, title: '', description: '', requirements: '', max_students: 1 })
  isEdit.value = false
  dialogVisible.value = true
}

function handleEdit(row) {
  Object.assign(form, { ...row })
  isEdit.value = true
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    const res = isEdit.value ? await updateTopic(form.id, form) : await createTopic(form)
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '发布成功')
      dialogVisible.value = false
      loadData()
    }
  })
}

async function toggleStatus(row) {
  const status = row.status === 'open' ? 'closed' : 'open'
  const res = await updateTopic(row.id, { status })
  if (res.code === 200) {
    ElMessage.success(`课题已${status === 'open' ? '开放' : '关闭'}`)
    loadData()
  }
}

function showDetail(row) {
  currentTopic.value = row
  detailVisible.value = true
}

function handleApply() {
  detailVisible.value = false
  applyVisible.value = true
  selectedTopics.value = [currentTopic.value?.id]
}

async function submitApplication() {
  const res = await applyTopic(selectedTopics.value)
  if (res.code === 200) {
    ElMessage.success('申请成功')
    applyVisible.value = false
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