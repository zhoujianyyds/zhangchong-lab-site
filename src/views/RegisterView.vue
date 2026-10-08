<script setup>
import { nextTick, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Eye, EyeOff, RefreshCw, UserPlus } from 'lucide-vue-next'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()
const router = useRouter()
const form = reactive({
  name: '',
  staffId: '',
  password: '',
  confirmPassword: '',
  role: 'student',
  grade: '',
  graduationYear: '',
  direction: '',
  email: '',
  bio: '',
  captcha: '',
})
const message = ref('')
const captchaCode = ref(createCaptcha())
const directionOptions = ['油气井', '嵌入式', 'Agent']
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordInputRef = ref(null)
const confirmPasswordInputRef = ref(null)
const registerBusy = ref(false)

watch(() => form.role, (role) => {
  if (role === 'alumni') form.grade = ''
  else form.graduationYear = ''
})

function createCaptcha() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function refreshCaptcha() {
  captchaCode.value = createCaptcha()
  form.captcha = ''
}

function clearSensitiveFields() {
  form.password = ''
  form.confirmPassword = ''
  refreshCaptcha()
}

async function submitRegister() {
  if (registerBusy.value) return
  message.value = ''
  if (!form.name.trim() || !form.staffId.trim() || !form.password || !form.confirmPassword || (form.role === 'student' && !form.grade) || (form.role === 'alumni' && !form.graduationYear) || !form.direction) {
    message.value = '请填写完整信息'
    clearSensitiveFields()
    return
  }
  if (form.password !== form.confirmPassword) {
    message.value = '两次密码不一致'
    clearSensitiveFields()
    return
  }
  if (form.captcha !== captchaCode.value) {
    message.value = '验证码不正确'
    clearSensitiveFields()
    return
  }
  if (!(await window.appConfirm(`确定提交「${form.name.trim()}」的注册申请吗？`, '确认注册'))) return
  registerBusy.value = true
  const release = window.appFreeze?.('正在提交注册申请，请稍候')
  try {
    const result = await store.registerMember({
      name: form.name,
      staff_id: form.staffId,
      password: form.password,
      role: form.role,
      grade: form.grade,
      graduation_year: form.graduationYear,
      direction: form.direction,
      email: form.email,
      bio: form.bio,
    })
    if (!result.ok) {
      message.value = result.message
      window.alert(result.message || '注册申请提交失败')
      clearSensitiveFields()
      return
    }
    window.alert('注册申请已提交，等待管理员审批')
    clearSensitiveFields()
    form.name = ''
    form.staffId = ''
    form.grade = ''
    form.graduationYear = ''
    form.direction = ''
    form.email = ''
    form.bio = ''
    form.role = 'student'
    router.push('/tools/members')
  } finally {
    release?.()
    registerBusy.value = false
  }
}

function toggleRegisterPasswordVisibility(field) {
  const snapshot = {
    name: form.name,
    staffId: form.staffId,
    password: form.password,
    confirmPassword: form.confirmPassword,
    role: form.role,
    grade: form.grade,
    graduationYear: form.graduationYear,
    direction: form.direction,
    email: form.email,
    bio: form.bio,
    captcha: form.captcha,
  }
  if (field === 'confirm') {
    showConfirmPassword.value = !showConfirmPassword.value
  } else {
    showPassword.value = !showPassword.value
  }
  nextTick(() => {
    Object.assign(form, snapshot)
    if (field === 'confirm') confirmPasswordInputRef.value?.focus()
    else passwordInputRef.value?.focus()
  })
}
</script>

<template>
  <main class="tool-page auth-page">
    <header class="tool-page-header">
      <RouterLink class="back-link" to="/">← 返回首页</RouterLink>
      <div class="tool-page-title-row">
        <div>
          <h1>Register</h1>
        </div>
      </div>
    </header>

    <form v-if="!store.currentMember.value" class="login-box register-box" @submit.prevent="submitRegister">
      <datalist id="register-direction-options">
        <option v-for="direction in directionOptions" :key="direction" :value="direction">{{ direction }}</option>
      </datalist>

      <div class="form-field">
        <label for="register-name">姓名</label>
        <input id="register-name" v-model="form.name" type="text" autocomplete="name" />
      </div>
      <div class="form-field">
        <label for="register-staff-id">工号/学号</label>
        <input id="register-staff-id" v-model="form.staffId" type="text" autocomplete="username" />
      </div>
      <div class="form-field">
        <label for="register-role">身份</label>
        <select id="register-role" v-model="form.role" class="filter-select">
          <option value="student">在读学生</option>
          <option value="alumni">已毕业生</option>
        </select>
      </div>
      <div v-if="form.role === 'student'" class="form-field">
        <label for="register-grade">年级</label>
        <select id="register-grade" v-model="form.grade" class="filter-select">
          <option value="">请选择年级</option>
          <option value="研一">研一</option>
          <option value="研二">研二</option>
          <option value="研三">研三</option>
          <option value="博士">博士</option>
          <option value="本科生">本科生</option>
        </select>
      </div>
      <div v-else class="form-field">
        <label for="register-graduation-year">毕业年份</label>
        <input id="register-graduation-year" v-model="form.graduationYear" class="filter-select" type="number" min="1900" :max="new Date().getFullYear()" placeholder="例如 2024" />
      </div>
      <div class="form-field">
        <label for="register-direction">研究方向</label>
        <input
          id="register-direction"
          v-model="form.direction"
          class="filter-select"
          list="register-direction-options"
          type="text"
          placeholder="选择或输入研究方向"
        />
      </div>
      <div class="form-field">
        <label for="register-email">邮箱（可选）</label>
        <input id="register-email" v-model="form.email" type="email" autocomplete="email" />
      </div>
      <div class="form-field">
        <label for="register-bio">个人简介（可选）</label>
        <textarea id="register-bio" v-model="form.bio" rows="3"></textarea>
      </div>
      <p v-if="form.role === 'alumni'" class="form-note">审批通过后，姓名、毕业年份、研究方向、简介及填写的邮箱会显示在独立的已毕业生资料页。</p>
      <div class="form-field">
        <label for="register-password">用户密码</label>
        <div class="password-input-row">
          <input
            id="register-password"
            ref="passwordInputRef"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            minlength="4"
            autocomplete="new-password"
          />
          <button
            class="password-eye-btn"
            type="button"
            :title="showPassword ? '隐藏密码' : '显示密码'"
            @mousedown.prevent
            @click.prevent.stop="toggleRegisterPasswordVisibility('password')"
          >
            <EyeOff v-if="showPassword" :size="16" />
            <Eye v-else :size="16" />
          </button>
        </div>
      </div>
      <div class="form-field">
        <label for="register-confirm-password">确认密码</label>
        <div class="password-input-row">
          <input
            id="register-confirm-password"
            ref="confirmPasswordInputRef"
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            minlength="4"
            autocomplete="new-password"
          />
          <button
            class="password-eye-btn"
            type="button"
            :title="showConfirmPassword ? '隐藏密码' : '显示密码'"
            @mousedown.prevent
            @click.prevent.stop="toggleRegisterPasswordVisibility('confirm')"
          >
            <EyeOff v-if="showConfirmPassword" :size="16" />
            <Eye v-else :size="16" />
          </button>
        </div>
      </div>
      <div class="form-field">
        <label for="register-captcha">四位验证码</label>
        <div class="captcha-row">
          <input id="register-captcha" v-model="form.captcha" type="text" inputmode="numeric" maxlength="4" />
          <button class="captcha-code" type="button" title="刷新验证码" @click="refreshCaptcha">
            <span>{{ captchaCode }}</span>
            <RefreshCw :size="14" />
          </button>
        </div>
      </div>
      <div v-if="message" class="form-error">{{ message }}</div>
      <button class="button button-dark" type="submit" :disabled="registerBusy">
        <UserPlus :size="16" />
        注册
      </button>
    </form>

    <section v-else class="tool-empty">
      <p>当前已登录</p>
      <RouterLink class="button button-light" to="/tools/members">进入成员管理</RouterLink>
    </section>
  </main>
</template>
