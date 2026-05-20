<template>
  <div class="statistics">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">学生总数</div>
            <div class="stat-value">{{ overview?.users?.student || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">导师总数</div>
            <div class="stat-value">{{ overview?.users?.teacher || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">开放课题</div>
            <div class="stat-value">{{ overview?.openTopics || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">已选学生</div>
            <div class="stat-value">{{ overview?.selectedStudents || 0 }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>各阶段进度</span>
          </template>
          <div ref="progressChart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>选题热度排行</span>
          </template>
          <el-table :data="popularTopics" border>
            <el-table-column prop="id" label="排名" width="60">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="title" label="课题名称" show-overflow-tooltip />
            <el-table-column prop="teacher_name" label="导师" />
            <el-table-column prop="application_count" label="申请人数" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>导师指导学生数</span>
          </template>
          <div ref="teacherChart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>成绩分布</span>
          </template>
          <div ref="scoreChart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { getOverview, getTopicPopularity, getTeachersStats, getScores, getStagesProgress } from '@/api/statistics'

const overview = ref(null)
const popularTopics = ref([])

const progressChart = ref(null)
const teacherChart = ref(null)
const scoreChart = ref(null)

onMounted(async () => {
  const res1 = await getOverview()
  if (res1.code === 200) {
    overview.value = res1.data
  }

  const res2 = await getTopicPopularity()
  if (res2.code === 200) {
    popularTopics.value = res2.data
  }

  const res3 = await getStagesProgress()
  if (res3.code === 200) {
    initProgressChart(res3.data)
  }

  const res4 = await getTeachersStats()
  if (res4.code === 200) {
    initTeacherChart(res4.data)
  }

  const res5 = await getScores()
  if (res5.code === 200) {
    initScoreChart(res5.data)
  }
})

function initProgressChart(data) {
  const chart = echarts.init(progressChart.value)
  const option = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { name: '开题报告', value: data.proposal.submitted },
        { name: '中期检查', value: data.midterm.submitted },
        { name: '论文提交', value: data.document.submitted }
      ]
    }]
  }
  chart.setOption(option)
}

function initTeacherChart(data) {
  const chart = echarts.init(teacherChart.value)
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map(d => d.real_name) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: data.map(d => d.student_count) }]
  }
  chart.setOption(option)
}

function initScoreChart(data) {
  const chart = echarts.init(scoreChart.value)
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['0-60', '60-70', '70-80', '80-90', '90-100'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: [
        data.proposalScores.filter(s => s < 60).length,
        data.proposalScores.filter(s => s >= 60 && s < 70).length,
        data.proposalScores.filter(s => s >= 70 && s < 80).length,
        data.proposalScores.filter(s => s >= 80 && s < 90).length,
        data.proposalScores.filter(s => s >= 90).length
      ]
    }]
  }
  chart.setOption(option)
}
</script>

<style scoped>
.stat-item {
  text-align: center;
}
.stat-label {
  font-size: 14px;
  color: #909399;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 10px;
}
</style>