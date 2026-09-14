<script setup>
import { computed, reactive, ref } from 'vue'
import { ExternalLink, Pencil, Plus, Trash2, Trophy, X } from 'lucide-vue-next'
import { useLabStore } from '../stores/labStore'

const props = defineProps({
  member: { type: Object, required: true },
  editable: { type: Boolean, default: false },
})

const store = useLabStore()
const editorOpen = ref(false)
const selectedAchievement = ref(null)
const busy = ref(false)
const editingId = ref('')
const form = reactive(emptyForm())
const achievements = computed(() => props.member.achievements || [])

function emptyForm() {
  return { title: '', type: '', year: '', description: '', link: '' }
}

function openDetail(item) {
  selectedAchievement.value = item
}

function closeDetail() {
  selectedAchievement.value = null
}

function openEditor(item = null) {
  editingId.value = item?.id || ''
  Object.assign(form, emptyForm(), item ? JSON.parse(JSON.stringify(item)) : {})
  editorOpen.value = true
}

function closeEditor() {
  if (busy.value) return
  editorOpen.value = false
  editingId.value = ''
  Object.assign(form, emptyForm())
}

async function saveAchievement() {
  if (busy.value) return
  if (!form.title.trim()) {
    window.alert('请填写成果名称')
    return
  }
  const editing = Boolean(editingId.value)
  if (!(await window.appConfirm(
    editing ? `确定保存成果「${form.title.trim()}」的修改吗？` : `确定添加成果「${form.title.trim()}」吗？`,
    editing ? '确认修改成果' : '确认添加成果',
  ))) return
  busy.value = true
  const release = window.appFreeze?.('正在保存个人成果，请稍候')
  let result
  try {
    result = await store.upsertMemberAchievement(props.member.id, {
      id: editingId.value,
      ...JSON.parse(JSON.stringify(form)),
    })
  } finally {
    release?.()
    busy.value = false
  }
  if (result?.ok) closeEditor()
  window.alert(result?.ok ? (editing ? '成果修改成功' : '成果添加成功') : result?.message || '成果保存失败')
}

async function deleteAchievement(item) {
  if (busy.value) return
  if (!(await window.appConfirm(`确定删除成果「${item.title}」吗？删除后无法恢复。`, '确认删除成果'))) return
  busy.value = true
  const release = window.appFreeze?.('正在删除个人成果，请稍候')
  let result
  try {
    result = await store.removeMemberAchievement(props.member.id, item.id)
  } finally {
    release?.()
    busy.value = false
  }
  window.alert(result?.ok ? '成果删除成功' : result?.message || '成果删除失败')
}

function openLink(item) {
  if (item.link) window.open(item.link, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <section class="member-achievements">
    <div class="member-achievements-head">
      <div>
        <p class="eyebrow">Achievements</p>
        <h2><Trophy :size="20" />个人成果</h2>
      </div>
      <button v-if="editable" class="button button-light" type="button" :disabled="busy" @click="openEditor()">
        <Plus :size="16" />添加成果
      </button>
    </div>

    <div class="member-achievement-list">
      <article
        v-for="item in achievements"
        :key="item.id"
        class="member-achievement-item member-achievement-summary"
        tabindex="0"
        role="button"
        @click="openDetail(item)"
        @keydown.enter.prevent="openDetail(item)"
      >
        <div>
          <h3>{{ item.title }}</h3>
          <p>点击查看成果详情</p>
        </div>
        <div v-if="editable" class="row-actions" @click.stop>
          <button class="icon-btn" type="button" title="修改成果" :disabled="busy" @click.stop="openEditor(item)"><Pencil :size="14" /></button>
          <button class="icon-btn icon-btn-danger" type="button" title="删除成果" :disabled="busy" @click.stop="deleteAchievement(item)"><Trash2 :size="14" /></button>
        </div>
      </article>
      <div v-if="achievements.length === 0" class="output-empty-state">暂未添加个人成果</div>
    </div>

    <div v-if="editorOpen" class="modal-overlay">
      <form class="tool-form modal-panel achievement-editor" @submit.prevent="saveAchievement">
        <div class="modal-head">
          <h2>{{ editingId ? '修改个人成果' : '添加个人成果' }}</h2>
          <button class="modal-close" type="button" :disabled="busy" @click="closeEditor"><X :size="17" /></button>
        </div>
        <div class="form-field"><label>成果标题 *</label><input v-model="form.title" type="text" placeholder="填写一个标题即可" /></div>
        <div class="form-row">
          <div class="form-field"><label>成果类型</label><input v-model="form.type" type="text" placeholder="可自定义，例如：论文、项目" /></div>
          <div class="form-field"><label>年份</label><input v-model="form.year" type="text" placeholder="例如：2026" /></div>
        </div>
        <div class="form-field"><label>成果说明</label><textarea v-model="form.description" rows="4"></textarea></div>
        <div class="form-field"><label>成果链接</label><input v-model="form.link" type="url" placeholder="https://" /></div>
        <button class="button button-dark" type="submit" :disabled="busy">{{ editingId ? '确定修改' : '确定添加' }}</button>
      </form>
    </div>

    <div v-if="selectedAchievement" class="modal-overlay" @click.self="closeDetail">
      <section class="modal-panel achievement-detail" role="dialog" aria-modal="true" :aria-label="selectedAchievement.title">
        <div class="modal-head">
          <h2>成果详情</h2>
          <button class="modal-close" type="button" @click="closeDetail"><X :size="17" /></button>
        </div>
        <h3>{{ selectedAchievement.title }}</h3>
        <div v-if="selectedAchievement.type || selectedAchievement.year" class="member-achievement-meta">
          <span v-if="selectedAchievement.type">{{ selectedAchievement.type }}</span>
          <span v-if="selectedAchievement.year">{{ selectedAchievement.year }}</span>
        </div>
        <p>{{ selectedAchievement.description || '该成果暂未填写详细内容。' }}</p>
        <button v-if="selectedAchievement.link" class="button button-dark" type="button" @click="openLink(selectedAchievement)">
          <ExternalLink :size="16" />打开成果链接
        </button>
      </section>
    </div>
  </section>
</template>
