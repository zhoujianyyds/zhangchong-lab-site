<script setup>
import { nextTick, reactive, ref } from 'vue'
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
  grade: '',
  direction: '',
  captcha: '',
})
const message = ref('')
const captchaCode = ref(createCaptcha())
const directionOptions = ['油气井', '嵌入式', 'Agent']
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordInputRef = ref(null)
const confirmPasswordInputRef = ref(null)

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
  message.value = ''
  if (!form.name.trim() || !form.staffId.trim() || !form.password || !form.confirmPassword || !form.grade || !form.direction) {
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
  const result = await store.registerMember({
    name: form.name,
    staff_id: form.staffId,
    password: form.password,
    grade: form.grade,
    direction: form.direction,
  })
  if (!result.ok) {
    message.value = result.message
    clearSensitiveFields()
    return
  }
  window.alert('注册申请已提交，等待管理员审批')
  clearSensitiveFields()
  form.name = ''
  form.staffId = ''
  form.grade = ''
  form.direction = ''
  router.push('/tools/members')
}

function toggleRegisterPasswordVisibility(field) {
  const snapshot = {
    name: form.name,
    staffId: form.staffId,
    password: form.password,
    confirmPassword: form.confirmPassword,
    grade: form.grade,
    direction: form.direction,
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
  <main class="tool-page">
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
        <option v-for="direction in directionOptions" :key="direction" :value="direction"></option>
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
        <label for="register-grade">年级</label>
        <select id="register-grade" v-model="form.grade" class="filter-select">
          <option value="">请选择年级</option>
          <option value="研一">研一</option>
          <option value="研二">研二</option>
          <option value="研三">研三</option>
          <option value="博士">博士</option>
        </select>
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
      <button class="button button-dark" type="submit">
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
