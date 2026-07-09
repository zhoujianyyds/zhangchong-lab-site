<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Check, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import AuthGate from '../components/AuthGate.vue'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()
const editingId = ref('')
const keyword = ref('')
const feedback = ref('')
const profileFeedback = ref('')
const memberFormOpen = ref(false)
const toolLabels = {
  members: '成员管理',
  outputs: '成果管理',
}
const directionOptions = ['油气井', '嵌入式', 'Agent']

const form = reactive(createEmptyForm())
const profileForm = reactive(createProfileForm())

const filteredMembers = computed(() =>
  store.state.members.filter((item) => {
    const text = `${item.name} ${item.staff_id} ${item.direction}`.toLowerCase()
    return text.includes(keyword.value.trim().toLowerCase())
  }),
)
const pendingRegistrations = computed(() => store.state.pendingRegistrations || [])

const visibleCount = computed(() => store.state.members.filter((item) => item.visible_on_site).length)
const superAdminCount = computed(() => store.state.members.filter((item) => store.isSuperAdmin(item)).length)
const isEditingAdmin = computed(() => editingId.value === 'm-admin' || form.staff_id === 'admin')
const isEditingZhangChong = computed(() => editingId.value === 'm-teacher' || form.staff_id === 'zhangchong')
const isLockedStudyInfo = computed(() => isEditingAdmin.value || isEditingZhangChong.value)
const disableGrade = computed(() => isLockedStudyInfo.value)
const disableDirection = computed(() => isLockedStudyInfo.value)
const editingMember = computed(() => store.state.members.find((item) => item.id === editingId.value) || null)
const canSetMemberPassword = computed(() => store.currentMember.value?.staff_id === 'admin')

watch(
  () => store.currentMember.value,
  (member) => {
    if (!member) return
    profileForm.name = member.name || ''
    profileForm.grade = member.grade || ''
    profileForm.direction = member.direction || ''
    profileForm.phone = member.phone || ''
    profileForm.email = member.email || ''
    profileForm.wechat = member.wechat || ''
    profileForm.qq = member.qq || ''
    profileForm.photo = member.photo || ''
    profileForm.bio = member.bio || ''
  },
  { immediate: true },
)

function createProfileForm() {
  return {
    name: '',
    grade: '',
    direction: '',
    phone: '',
    email: '',
    wechat: '',
    qq: '',
    photo: '',
    bio: '',
  }
}

function createEmptyForm() {
  return {
    name: '',
    staff_id: '',
    role: 'student',
    grade: '研一',
    direction: '',
    phone: '',
    email: '',
    wechat: '',
    qq: '',
    photo: '',
    bio: '',
    newPassword: '',
    status: 'active',
    visible_on_site: true,
    permissions: {
      can_manage_members: false,
      can_view_all: false,
      can_export: false,
      can_delete_others: false,
      tool_access: [],
      password_required_tools: [],
    },
  }
}

function resetForm() {
  editingId.value = ''
  Object.assign(form, createEmptyForm())
}

function closeMemberForm() {
  resetForm()
  memberFormOpen.value = false
}

function openCreateForm() {
  resetForm()
  feedback.value = ''
  memberFormOpen.value = true
}

function editMember(member) {
  memberFormOpen.value = true
  feedback.value = ''
  editingId.value = member.id
  Object.assign(form, {
    name: member.name,
    staff_id: member.staff_id,
    role: member.role,
    grade: member.grade,
    direction: member.direction,
    phone: member.phone || '',
    email: member.email || '',
    wechat: member.wechat || '',
    qq: member.qq || '',
    photo: member.photo || '',
    bio: member.bio || '',
    newPassword: member.password || '',
    status: member.status,
    visible_on_site: member.visible_on_site,
    permissions: JSON.parse(JSON.stringify(member.permissions)),
  })
  if (member.id === 'm-admin' || member.id === 'm-teacher' || member.staff_id === 'admin' || member.staff_id === 'zhangchong') {
    form.grade = ''
    form.direction = ''
  }
  if (member.staff_id === 'admin') form.role = 'superadmin'
  if (member.staff_id === 'zhangchong') form.role = 'teacher'
  if (member.staff_id === '202522000755' || member.name === '周健') form.role = 'student'
}

async function submitMember() {
  if (!form.name.trim() || !form.staff_id.trim()) return
  const isEditing = Boolean(editingId.value)
  if (isLockedStudyInfo.value) {
    form.grade = ''
    form.direction = ''
  }
  if (form.staff_id === 'admin') form.role = 'superadmin'
  if (form.staff_id === 'zhangchong') form.role = 'teacher'
  if (form.staff_id === '202522000755' || form.name === '周健') form.role = 'student'
  if (form.staff_id === 'admin') {
    form.permissions.tool_access = [...store.toolIds]
    form.permissions.password_required_tools = [...store.toolIds]
    form.permissions.can_view_all = true
    form.permissions.can_export = true
    form.permissions.can_delete_others = true
    form.permissions.can_manage_members = true
  } else {
    form.permissions = {
      can_manage_members: false,
      can_view_all: false,
      can_export: false,
      can_delete_others: false,
      tool_access: [],
      password_required_tools: [],
    }
  }
  const result = await store.upsertMember({
    id: editingId.value,
    ...JSON.parse(JSON.stringify(form)),
  })
  if (!result.ok) {
    window.alert(result.message || '保存失败')
    return
  }
  resetForm()
  memberFormOpen.value = false
  feedback.value = isEditing ? '修改成功' : '添加成功'
  window.alert(feedback.value)
}

async function toggleMemberVisibility(member) {
  if (member.staff_id === 'admin') return
  const result = await store.upsertMember({
    ...JSON.parse(JSON.stringify(member)),
    visible_on_site: !member.visible_on_site,
  })
  if (!result.ok) {
    window.alert(result.message || '保存失败')
    return
  }
  feedback.value = '修改成功'
  window.alert(feedback.value)
}

function toggleArrayValue(list, value) {
  const index = list.indexOf(value)
  if (index >= 0) list.splice(index, 1)
  else list.push(value)
}

function setPhotoFromFile(event, target) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    window.alert('请选择图片文件')
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    target.photo = String(reader.result || '')
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function clearPhoto(target) {
  target.photo = ''
}

function roleLabel(member) {
  if (member.staff_id === 'admin') return '超管'
  if (member.staff_id === 'zhangchong' || member.name === '张翀') return '教师'
  if (member.staff_id === '202522000755' || member.name === '周健') return '学生'
  if (member.role === 'superadmin') return '超管'
  if (member.role === 'teacher') return '教师'
  return '学生'
}

function approveRegistration(record) {
  const result = store.approveRegistration(record.id)
  if (result.ok) {
    window.alert('审批通过，注册成功')
  } else {
    window.alert(result.message)
  }
}

function rejectRegistration(record) {
  store.rejectRegistration(record.id)
  window.alert('已拒绝注册申请')
}

async function submitProfile() {
  const member = store.currentMember.value
  if (!member || store.isSuperAdmin()) return
  const result = await store.upsertMember({
    ...JSON.parse(JSON.stringify(member)),
    name: profileForm.name.trim(),
    grade: profileForm.grade,
    direction: profileForm.direction,
    phone: profileForm.phone,
    email: profileForm.email,
    wechat: profileForm.wechat,
    qq: profileForm.qq,
    photo: profileForm.photo,
    bio: profileForm.bio,
  })
  if (!result.ok) {
    window.alert(result.message || '保存失败')
    return
  }
  profileFeedback.value = '修改成功'
  window.alert(profileFeedback.value)
}
</script>

<template>
  <AuthGate tool-id="profile" title="成员管理" subtitle="录入和管理实验室成员，设置权限与网站展示。">
    <datalist id="member-direction-options">
      <option v-for="direction in directionOptions" :key="direction" :value="direction"></option>
    </datalist>

    <form v-if="!store.isSuperAdmin()" class="tool-form" @submit.prevent>
      <div class="tool-page-title-row">
        <h2 class="panel-title">个人信息</h2>
      </div>
      <div v-if="profileFeedback" class="form-success">{{ profileFeedback }}</div>
      <div class="profile-photo-row">
        <div class="member-photo-preview">
          <img v-if="profileForm.photo" :src="profileForm.photo" alt="成员照片" />
          <span v-else>照片</span>
        </div>
        <div class="photo-actions">
          <label class="button button-light">
            上传照片
            <input class="photo-input" type="file" accept="image/*" @change="setPhotoFromFile($event, profileForm)" />
          </label>
          <button class="button button-light" type="button" @click="clearPhoto(profileForm)">移除照片</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="profile-name">姓名</label>
          <input id="profile-name" v-model="profileForm.name" type="text" />
        </div>
        <div class="form-field">
          <label for="profile-staff-id">账号</label>
          <input id="profile-staff-id" :value="store.currentMember.value?.staff_id" type="text" disabled />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="profile-grade">年级</label>
          <select id="profile-grade" v-model="profileForm.grade" class="filter-select">
            <option value="">无</option>
            <option value="研一">研一</option>
            <option value="研二">研二</option>
            <option value="研三">研三</option>
            <option value="博士">博士</option>
          </select>
        </div>
        <div class="form-field">
          <label for="profile-direction">研究方向</label>
          <input
            id="profile-direction"
            v-model="profileForm.direction"
            class="filter-select"
            list="member-direction-options"
            type="text"
            placeholder="选择或输入研究方向"
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="profile-phone">电话</label>
          <input id="profile-phone" v-model="profileForm.phone" type="tel" />
        </div>
        <div class="form-field">
          <label for="profile-email">邮箱</label>
          <input id="profile-email" v-model="profileForm.email" type="email" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="profile-wechat">微信</label>
          <input id="profile-wechat" v-model="profileForm.wechat" type="text" />
        </div>
        <div class="form-field">
          <label for="profile-qq">QQ</label>
          <input id="profile-qq" v-model="profileForm.qq" type="text" />
        </div>
      </div>
      <div class="form-field">
        <label for="profile-bio">个人简介</label>
        <textarea id="profile-bio" v-model="profileForm.bio" rows="4"></textarea>
      </div>
      <button class="button button-dark" type="button" @click="submitProfile">保存个人信息</button>
    </form>

    <template v-else>
    <div class="member-stats">
      <div class="stat-item">
        <strong>{{ store.state.members.length }}</strong>
        <span>总人数</span>
      </div>
      <div class="stat-item stat-active">
        <span class="stat-dot"></span>
        <strong>{{ visibleCount }}</strong>
        <span>网站显示</span>
      </div>
      <div class="stat-item stat-gone">
        <span class="stat-dot"></span>
        <strong>{{ superAdminCount }}</strong>
        <span>超管</span>
      </div>
    </div>

    <section class="tool-form">
      <div class="tool-page-title-row">
        <h2 class="panel-title">注册审批</h2>
        <span class="status-tag">待审批 {{ pendingRegistrations.length }}</span>
      </div>
      <div v-if="pendingRegistrations.length" class="member-table-wrap">
        <table class="member-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>工号/学号</th>
              <th>年级</th>
              <th>方向</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in pendingRegistrations" :key="record.id">
              <td><strong>{{ record.name }}</strong></td>
              <td class="mono">{{ record.staff_id }}</td>
              <td>{{ record.grade }}</td>
              <td>{{ record.direction }}</td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn vis-on" type="button" title="通过" @click="approveRegistration(record)">
                    <Check :size="14" />
                  </button>
                  <button class="icon-btn icon-btn-danger" type="button" title="拒绝" @click="rejectRegistration(record)">
                    <X :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="inline-empty">暂无待审批注册申请</div>
    </section>

    <div v-if="memberFormOpen" class="modal-overlay member-modal-overlay" @click.self="closeMemberForm">
    <form class="tool-form modal-panel member-modal member-edit-form" @submit.prevent>
      <div class="tool-page-title-row">
        <h2 class="panel-title">{{ editingId ? '编辑成员' : '添加成员' }}</h2>
        <button class="button button-light" type="button" @click="resetForm">
          <Plus :size="16" />
          新建
        </button>
        <button class="modal-close" type="button" @click="closeMemberForm">
          <X :size="16" />
        </button>
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
            <input class="photo-input" type="file" accept="image/*" @change="setPhotoFromFile($event, form)" />
          </label>
          <button class="button button-light" type="button" @click="clearPhoto(form)">移除照片</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="member-name">姓名 *</label>
          <input id="member-name" v-model="form.name" type="text" placeholder="填写姓名" />
        </div>
        <div class="form-field">
          <label for="staff-id">工号/学号 *</label>
          <input id="staff-id" v-model="form.staff_id" type="text" placeholder="2024xxxx" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="role">身份</label>
          <select id="role" v-model="form.role" class="filter-select">
            <option value="student">学生</option>
            <option value="teacher">教师</option>
            <option value="superadmin">超管</option>
          </select>
        </div>
        <div class="form-field">
          <label for="grade">年级</label>
          <select id="grade" v-model="form.grade" class="filter-select" :disabled="disableGrade">
            <option value="">无</option>
            <option value="研一">研一</option>
            <option value="研二">研二</option>
            <option value="研三">研三</option>
            <option value="博士">博士</option>
          </select>
        </div>
      </div>
      <div class="form-field">
        <label for="direction">研究方向</label>
        <input
          id="direction"
          v-model="form.direction"
          class="filter-select"
          list="member-direction-options"
          type="text"
          placeholder="选择或输入研究方向"
          :disabled="disableDirection"
        />
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="member-phone">电话</label>
          <input id="member-phone" v-model="form.phone" type="tel" />
        </div>
        <div class="form-field">
          <label for="member-email">邮箱</label>
          <input id="member-email" v-model="form.email" type="email" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="member-wechat">微信</label>
          <input id="member-wechat" v-model="form.wechat" type="text" />
        </div>
        <div class="form-field">
          <label for="member-qq">QQ</label>
          <input id="member-qq" v-model="form.qq" type="text" />
        </div>
      </div>
      <div class="form-field">
        <label for="member-bio">个人简介</label>
        <textarea id="member-bio" v-model="form.bio" rows="4"></textarea>
      </div>
      <div v-if="canSetMemberPassword" class="form-field">
        <label for="member-new-password">{{ editingId ? '查看 / 修改密码' : '登录密码' }}</label>
        <input
          id="member-new-password"
          v-model="form.newPassword"
          type="text"
          autocomplete="new-password"
          :placeholder="editingId ? '直接查看或输入新密码' : '留空则默认 123456'"
        />
      </div>

      <label class="checkbox-label">
        <input v-model="form.visible_on_site" type="checkbox" />
        <span>在网站首页显示该成员</span>
      </label>

      <div class="permission-grid">
        <label class="checkbox-label checkbox-sa">
          <input v-model="form.permissions.can_manage_members" type="checkbox" />
          <span>超级管理员（授予全部权限）</span>
        </label>
        <label class="checkbox-label">
          <input v-model="form.permissions.can_view_all" type="checkbox" />
          <span>查看所有数据</span>
        </label>
        <label class="checkbox-label">
          <input v-model="form.permissions.can_export" type="checkbox" />
          <span>导出数据</span>
        </label>
        <label class="checkbox-label">
          <input v-model="form.permissions.can_delete_others" type="checkbox" />
          <span>删除他人记录</span>
        </label>
      </div>

      <div class="permission-group">
        <strong>可见工具</strong>
        <p>控制成员是否能进入对应工具。</p>
        <label v-for="toolId in store.toolIds" :key="toolId" class="checkbox-label">
          <input
            :checked="form.permissions.tool_access.includes(toolId)"
            type="checkbox"
            @change="toggleArrayValue(form.permissions.tool_access, toolId)"
          />
          <span>{{ toolLabels[toolId] }}</span>
        </label>
      </div>

      <div class="permission-group">
        <strong>需要密码登录的工具</strong>
        <p>演示版统一通过工具页登录；正式版可做更细的二次验证。</p>
        <label v-for="toolId in store.toolIds" :key="toolId" class="checkbox-label">
          <input
            :checked="form.permissions.password_required_tools.includes(toolId)"
            type="checkbox"
            @change="toggleArrayValue(form.permissions.password_required_tools, toolId)"
          />
          <span>{{ toolLabels[toolId] }}</span>
        </label>
      </div>

      <button class="button button-dark" type="button" @click="submitMember">{{ editingId ? '保存' : '添加成员' }}</button>
      </form>
    </div>

    <div class="filter-bar member-list-filter">
      <h2 class="panel-title">所有成员</h2>
      <input v-model="keyword" class="filter-input" type="search" placeholder="按姓名、工号、方向筛选" />
      <button class="button button-dark" type="button" @click="openCreateForm">
        <Plus :size="16" />
        添加成员
      </button>
    </div>

    <div class="member-table-wrap member-list-wrap">
      <table class="member-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>工号/学号</th>
            <th>身份</th>
            <th>密码</th>
            <th>年级</th>
            <th>方向</th>
            <th>网站显示</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in filteredMembers" :key="member.id">
            <td>
              <strong>{{ member.name }}</strong>
              <span v-if="store.isSuperAdmin(member)" class="admin-badge">超管</span>
            </td>
            <td class="mono">{{ member.staff_id }}</td>
            <td>{{ roleLabel(member) }}</td>
            <td class="mono">{{ member.password || '' }}</td>
            <td>{{ member.grade || '' }}</td>
            <td>{{ member.direction || '' }}</td>
            <td>
              <button
                class="vis-btn"
                :class="member.visible_on_site ? 'vis-on' : 'vis-off'"
                type="button"
                :disabled="member.staff_id === 'admin'"
                @click="toggleMemberVisibility(member)"
              >
                <Eye v-if="member.visible_on_site" :size="14" />
                <EyeOff v-else :size="14" />
                {{ member.visible_on_site ? '显示' : '隐藏' }}
              </button>
            </td>
            <td>
              <div class="row-actions">
                <button class="icon-btn" type="button" @click="editMember(member)">
                  <Pencil :size="14" />
                </button>
                <button class="icon-btn icon-btn-danger" type="button" @click="store.removeMember(member.id)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </template>
  </AuthGate>
</template>
