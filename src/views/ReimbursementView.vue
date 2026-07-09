<script setup>
import { computed, reactive, ref } from 'vue'
import { Download, ReceiptText, Trash2 } from 'lucide-vue-next'
import AuthGate from '../components/AuthGate.vue'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()
const form = reactive({ amount: '', reason: '', files: [] })
const statusFilter = ref('all')
const error = ref('')

const visibleRecords = computed(() => {
  let records = store.canViewAll()
    ? store.state.reimbursements
    : store.state.reimbursements.filter((item) => item.member_id === store.currentMember.value?.id)
  if (statusFilter.value !== 'all') records = records.filter((item) => item.status === statusFilter.value)
  return [...records].sort((a, b) => b.created_at.localeCompare(a.created_at))
})

const statusMap = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
}

function memberName(id) {
  return store.state.members.find((item) => item.id === id)?.name || '未知成员'
}

function fileChanged(event) {
  form.files = Array.from(event.target.files || [])
}

function submitReimbursement() {
  const result = store.addReimbursement({
    amount: form.amount,
    reason: form.reason,
    file_names: form.files.map((file) => file.name),
  })
  error.value = result.ok ? '' : result.message
  if (result.ok) {
    form.amount = ''
    form.reason = ''
    form.files = []
  }
}

function exportCsv() {
  const header = ['报销人', '金额', '事由', '状态', '凭证', '创建时间']
  const rows = visibleRecords.value.map((item) => [
    memberName(item.member_id),
    item.amount,
    item.reason,
    statusMap[item.status],
    item.file_names.join('|'),
    item.created_at,
  ])
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'reimbursements.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <AuthGate tool-id="reimbursement" title="报销上报" subtitle="提交报销申请，上传凭证文件名，管理员可处理状态并导出 CSV。">
    <form class="tool-form" @submit.prevent="submitReimbursement">
      <div class="form-row">
        <div class="form-field">
          <label for="amount">报销金额 *</label>
          <input id="amount" v-model="form.amount" type="number" min="0" step="0.01" placeholder="0.00" />
        </div>
        <div class="form-field">
          <label for="receipt">报销凭证</label>
          <input id="receipt" type="file" multiple accept="image/*,.pdf" @change="fileChanged" />
        </div>
      </div>
      <div class="form-field">
        <label for="reason">报销事由 *</label>
        <textarea id="reason" v-model="form.reason" placeholder="简述报销事由"></textarea>
      </div>
      <p class="form-note">前端演示版只保存文件名；正式上线时文件应上传到后端或对象存储。</p>
      <div v-if="error" class="form-error">{{ error }}</div>
      <button class="button button-dark" type="submit">
        <ReceiptText :size="16" />
        提交报销
      </button>
    </form>

    <div class="filter-bar">
      <select v-model="statusFilter" class="filter-select">
        <option value="all">全部状态</option>
        <option value="pending">待审批</option>
        <option value="approved">已通过</option>
        <option value="rejected">已驳回</option>
      </select>
      <button v-if="store.canExport()" class="button button-light export-btn" type="button" @click="exportCsv">
        <Download :size="16" />
        导出 CSV
      </button>
    </div>

    <div class="reimbursement-list">
      <article v-for="item in visibleRecords" :key="item.id" class="reimbursement-item">
        <div class="reimb-header">
          <div>
            <strong>{{ memberName(item.member_id) }}</strong>
            <span class="reimb-status" :class="`status-${item.status}`">{{ statusMap[item.status] }}</span>
          </div>
          <span class="reimb-amount">¥{{ Number(item.amount).toFixed(2) }}</span>
        </div>
        <p class="reimb-reason">{{ item.reason }}</p>
        <div class="reimb-images">
          <span v-for="file in item.file_names" :key="file" class="output-tag">{{ file }}</span>
        </div>
        <div class="reimb-meta">
          <span>{{ new Date(item.created_at).toLocaleString() }}</span>
          <div class="row-actions">
            <button v-if="store.canViewAll()" class="icon-btn" type="button" @click="store.updateReimbursementStatus(item.id, 'approved')">
              通过
            </button>
            <button v-if="store.canViewAll()" class="icon-btn" type="button" @click="store.updateReimbursementStatus(item.id, 'rejected')">
              驳回
            </button>
            <button class="icon-btn icon-btn-danger" type="button" @click="store.deleteReimbursement(item.id)">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </article>
      <div v-if="visibleRecords.length === 0" class="tool-empty inline-empty">
        <p>暂无报销记录</p>
        <span>点击「提交报销」开始提交。</span>
      </div>
    </div>
  </AuthGate>
</template>
