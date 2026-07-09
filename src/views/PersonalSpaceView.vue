<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RefreshCw, Save } from 'lucide-vue-next'
import AuthGate from '../components/AuthGate.vue'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()
const feedback = ref('')
const directionOptions = ['油气井', '嵌入式', 'Agent']
const form = reactive({
  name: '',
  grade: '',
  direction: '',
  phone: '',
  email: '',
  wechat: '',
  qq: '',
  photo: '',
  bio: '',
})

const currentMember = store.currentMember
const isSystemAdmin = computed(() => currentMember.value?.staff_id === 'admin')
const lockStudyInfo = computed(() => ['admin', 'zhangchong'].includes(currentMember.value?.staff_id))
const identityText = computed(() => {
  const member = currentMember.value
  if (!member) return ''
  const base = member.staff_id === 'zhangchong' || member.role === 'teacher' ? '教师' : '学生'
  return store.isSuperAdmin(member) ? `${base}兼超管` : base
})

watch(
  currentMember,
  (member) => {
    if (!member) return
    form.name = member.name || ''
    form.grade = member.grade || ''
    form.direction = member.direction || ''
    form.phone = member.phone || ''
    form.email = member.email || ''
    form.wechat = member.wechat || ''
    form.qq = member.qq || ''
    form.photo = member.photo || ''
    form.bio = member.bio || ''
  },
  { immediate: true },
)

function setPhotoFromFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    window.alert('请选择图片文件')
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    form.photo = String(reader.result || '')
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function clearPhoto() {
  form.photo = ''
}

async function submitProfile() {
  const member = currentMember.value
  if (!member || isSystemAdmin.value) return
  const nextGrade = lockStudyInfo.value ? '' : form.grade
  const nextDirection = lockStudyInfo.value ? '' : form.direction
  const result = await store.upsertMember({
    ...JSON.parse(JSON.stringify(member)),
    name: form.name.trim(),
    grade: nextGrade,
    direction: nextDirection,
    phone: form.phone,
    email: form.email,
    wechat: form.wechat,
    qq: form.qq,
    photo: form.photo,
    bio: form.bio,
  })
  if (!result.ok) {
    window.alert(result.message || '保存失败')
    return
  }
  feedback.value = '修改成功'
  window.alert(feedback.value)
}
</script>

<template>
  <AuthGate tool-id="profile" title="Personal Space" subtitle="查看和编辑自己的个人资料。">
    <datalist id="space-direction-options">
      <option v-for="direction in directionOptions" :key="direction" :value="direction">{{ direction }}</option>
    </datalist>

    <section v-if="isSystemAdmin" class="tool-empty">
      <p>系统超管账号不使用个人空间</p>
    </section>

    <form v-else class="tool-form personal-space-form" @submit.prevent>
      <div class="tool-page-title-row">
        <div>
          <h2 class="panel-title">个人空间</h2>
          <p class="form-note">{{ identityText }}</p>
        </div>
      </div>
      <div v-if="feedback" class="form-success">{{ feedback }}</div>

      <div class="profile-photo-row">
        <div class="member-photo-preview">
          <img v-if="form.photo" :src="form.photo" alt="成员照片" />
          <span v-else>照片</span>
        </div>
        <div class="photo-actions">
          <label class="button button-light">
            上传照片
            <input class="photo-input" type="file" accept="image/*" @change="setPhotoFromFile" />
          </label>
          <button class="button button-light" type="button" @click="clearPhoto">
            <RefreshCw :size="16" />
            移除照片
          </button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="space-name">姓名</label>
          <input id="space-name" v-model="form.name" type="text" />
        </div>
        <div class="form-field">
          <label for="space-staff-id">账号</label>
          <input id="space-staff-id" :value="currentMember?.staff_id" type="text" disabled />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="space-grade">年级</label>
          <select id="space-grade" v-model="form.grade" class="filter-select" :disabled="lockStudyInfo">
            <option value="">无</option>
            <option value="研一">研一</option>
            <option value="研二">研二</option>
            <option value="研三">研三</option>
            <option value="博士">博士</option>
          </select>
        </div>
        <div class="form-field">
          <label for="space-direction">研究方向</label>
          <input
            id="space-direction"
            v-model="form.direction"
            class="filter-select"
            list="space-direction-options"
            type="text"
            placeholder="选择或输入研究方向"
            :disabled="lockStudyInfo"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="space-phone">电话</label>
          <input id="space-phone" v-model="form.phone" type="tel" />
        </div>
        <div class="form-field">
          <label for="space-email">邮箱</label>
          <input id="space-email" v-model="form.email" type="email" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="space-wechat">微信</label>
          <input id="space-wechat" v-model="form.wechat" type="text" />
        </div>
        <div class="form-field">
          <label for="space-qq">QQ</label>
          <input id="space-qq" v-model="form.qq" type="text" />
        </div>
      </div>

      <div class="form-field">
        <label for="space-bio">个人简介</label>
        <textarea id="space-bio" v-model="form.bio" rows="5"></textarea>
      </div>

      <button class="button button-dark" type="button" @click="submitProfile">
        <Save :size="16" />
        保存个人空间
      </button>
    </form>
  </AuthGate>
</template>
