<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Eye, EyeOff, KeyRound, LogOut, RefreshCw } from 'lucide-vue-next'
import { useLabStore } from '../stores/labStore'

const props = defineProps({
  toolId: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

const store = useLabStore()
const router = useRouter()
const currentMember = store.currentMember
const form = reactive({ staffId: '', password: '', captcha: '' })
const error = ref('')
const captchaCode = ref(createCaptcha())
const showPassword = ref(false)
const passwordInputRef = ref(null)
const hasAccess = computed(() => store.hasTool(props.toolId))

function createCaptcha() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function refreshCaptcha() {
  captchaCode.value = createCaptcha()
  form.captcha = ''
}

function submitLogin() {
  if (form.captcha !== captchaCode.value) {
    error.value = '验证码不正确'
    refreshCaptcha()
    return
  }
  const result = store.login(form.staffId, form.password)
  error.value = result.ok ? '' : result.message
  if (result.ok) {
    form.password = ''
    refreshCaptcha()
    router.push('/home')
  } else {
    refreshCaptcha()
  }
}

function toggleLoginPasswordVisibility() {
  const snapshot = {
    staffId: form.staffId,
    password: form.password,
    captcha: form.captcha,
  }
  showPassword.value = !showPassword.value
  nextTick(() => {
    Object.assign(form, snapshot)
    passwordInputRef.value?.focus()
  })
}

</script>

<template>
  <main class="tool-page">
    <header class="tool-page-header">
      <RouterLink class="back-link" to="/">← 返回首页</RouterLink>
      <div class="tool-page-title-row">
        <div>
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
        <div v-if="currentMember" class="user-badge">
          <span class="user-role">{{ store.isSuperAdmin() ? '超级管理员' : '成员' }}</span>
          <span>{{ currentMember.name }}</span>
          <button class="logout-btn" type="button" title="退出登录" @click="store.logout">
            <LogOut :size="14" />
          </button>
        </div>
      </div>
    </header>

    <form v-if="!currentMember" class="login-box" @submit.prevent="submitLogin">
      <div class="form-field">
        <label for="staff-id">工号/学号</label>
        <input id="staff-id" v-model="form.staffId" type="text" autocomplete="username" />
      </div>
      <div class="form-field">
        <label for="password">用户密码</label>
        <div class="password-input-row">
          <input
            id="password"
            ref="passwordInputRef"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
          />
          <button
            class="password-eye-btn"
            type="button"
            :title="showPassword ? '隐藏密码' : '显示密码'"
            @mousedown.prevent
            @click.prevent.stop="toggleLoginPasswordVisibility"
          >
            <EyeOff v-if="showPassword" :size="16" />
            <Eye v-else :size="16" />
          </button>
        </div>
      </div>
      <div class="form-field">
        <label for="captcha">四位验证码</label>
        <div class="captcha-row">
          <input id="captcha" v-model="form.captcha" type="text" inputmode="numeric" maxlength="4" placeholder="输入验证码" />
          <button class="captcha-code" type="button" title="刷新验证码" @click="refreshCaptcha">
            <span>{{ captchaCode }}</span>
            <RefreshCw :size="14" />
          </button>
        </div>
      </div>
      <div v-if="error" class="form-error">{{ error }}</div>
      <button class="button button-dark" type="submit">
        <KeyRound :size="16" />
        登录
      </button>
    </form>

    <section v-else-if="!hasAccess" class="tool-empty">
      <p>暂无访问权限</p>
      <span>请联系超级管理员开通该工具。</span>
    </section>

    <section v-else class="tool-page-body">
      <slot />
    </section>
  </main>
</template>
