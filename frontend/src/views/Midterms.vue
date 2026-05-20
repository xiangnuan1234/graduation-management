<template>
  <div class="midterms">
    <el-card v-if="userStore.isStudent">
      <template #header>
        <div class="card-header">
          <span>中期检查</span>
          <el-button v-if="canSubmit" type="primary" @click="handleSubmitForm">提交检查</el-button>
        </div>
      </template>
      <el-descriptions v-if="myMidterm" :column="2" border>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType">{{ statusText }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ myMidterm.created_at }}</el-descriptions-item>
        <el-descriptions-item label="评分" v-if="myMidterm.score">{{ myMidterm.score }}</el-descriptions-item>
      </el-descriptions>
      <el-descriptions v-if="myMidterm" :column="1" border style="margin-top: 20px">
        <el-descriptions-item label="研究进度">{{ myMidterm.progress }}</el-descriptions-item>
        <el-descriptions-item label="遇到的问题">{{ myMidterm.problems }}</el-descriptions-item>
        <el-descriptions-item label="后续计划">{{ myMidterm.plan }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="您还未提交中期检查" />
    </el-card>

    <el-card v-if="userStore.isTeacher" style="margin-top: 20px">
      <template #header>
        <span>学生中期检查</span>
      </template>
      <el-table :data="midterms" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="student_name" label="学生姓名" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pass'" type="success">通过</el-tag>
            <el-tag v-else-if="row.status === 'fail'" type="danger">未通过</el-tag>
            <el-tag v-else-if="row.status === 'submitted' || row.status === 'reviewing'" type="warning">待检查</el-tag>
            <el-tag v-else type="info">待填报</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" />
        <el-table-column prop="score" label="评分" width="80" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'submitted'"
              size="small"
              type="primary"
              @click="openDetailDialog(row)"
            >查看</el-button>
            <el-button
              v-if="row.status === 'submitted'"
              size="small"
              type="success"
              @click="openReviewDialog(row)"
            >评分</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="submitVisible" title="提交中期检查" width="600px">
      <el-form :model="form" ref="formRef" label-width="100px">
        <el-form-item label="研究进度" prop="progress">
          <el-input v-model="form.progress" type="textarea" :rows="4" placeholder="请描述已完成的工作" />
        </el-form-item>
        <el-form-item label="遇到的问题" prop="problems">
          <el-input v-model="form.problems" type="textarea" :rows="4" placeholder="请描述遇到的问题" />
        </el-form-item>
        <el-form-item label="后续计划" prop="plan">
          <el-input v-model="form.plan" type="textarea" :rows="4" placeholder="请描述后续计划" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMidtermData">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="中期检查详情" width="600px">
      <el-descriptions v-if="currentMidterm" :column="1" border>
        <el-descriptions-item label="学生姓名">{{ currentMidterm.student_name }}</el-descriptions-item>
        <el-descriptions-item label="研究进度">{{ currentMidterm.progress }}</el-descriptions-item>
        <el-descriptions-item label="遇到的问题">{{ currentMidterm.problems }}</el-descriptions-item>
        <el-descriptions-item label="后续计划">{{ currentMidterm.plan }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="openReviewDialog(currentMidterm)">评分</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewVisible" title="中期检查评分" width="500px">
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
import { getMidtermList, submitMidterm, reviewMidterm } from '@/api/midterm'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const midterms = ref([])
const myMidterm = ref(null)
const submitVisible = ref(false)
const detailVisible = ref(false)
const reviewVisible = ref(false)
const formRef = ref()
const reviewFormRef = ref()
const currentMidterm = ref(null)
const form = reactive({ progress: '', problems: '', plan: '' })
const reviewForm = reactive({ status: 'pass', score: 0 })
const reviewId = ref(null)

const canSubmit = computed(() => !myMidterm.value || myMidterm.value.status === 'pending' || myMidterm.value.status === 'fail')
const statusText = computed(() => {
  if (!myMidterm.value) return '待填报'
  const map = { pending: '待填报', submitted: '待检查', reviewing: '待检查', pass: '已通过', fail: '未通过' }
  return map[myMidterm.value.status] || '待填报'
})
const statusType = computed(() => {
  if (!myMidterm.value) return 'info'
  const map = { pending: 'info', submitted: 'warning', reviewing: 'warning', pass: 'success', fail: 'danger' }
  return map[myMidterm.value.status] || 'info'
})

onMounted(() => { loadData() })

async function loadData() {
  if (userStore.isStudent) {
    const res = await getMidtermList()
    if (res.code === 200 && res.data.length > 0) {
      myMidterm.value = res.data[0]
    }
  } else if (userStore.isTeacher) {
    const res = await getMidtermList({ status: 'submitted' })
    if (res.code === 200) {
      midterms.value = res.data
    }
  }
}

function handleSubmitForm() {
  Object.assign(form, { progress: '', problems: '', plan: '' })
  submitVisible.value = true
}

async function submitMidtermData() {
  const res = await submitMidterm(form)
  if (res.code === 200) {
    ElMessage.success('提交成功')
    submitVisible.value = false
    loadData()
  }
}

function openDetailDialog(row) {
  currentMidterm.value = row
  detailVisible.value = true
}

function openReviewDialog(row) {
  reviewId.value = row.id
  Object.assign(reviewForm, { status: 'pass', score: row.score || 0 })
  detailVisible.value = false
  reviewVisible.value = true
}

async function submitReview() {
  const res = await reviewMidterm(reviewId.value, reviewForm)
  if (res.code === 200) {
    ElMessage.success('评分成功')
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
</style>