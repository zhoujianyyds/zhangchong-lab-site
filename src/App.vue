<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { Eye, EyeOff, LogIn, LogOut, Moon, RefreshCw, Sun, User, UserPlus } from 'lucide-vue-next'
import { useLabStore } from './stores/labStore'

const store = useLabStore()
const router = useRouter()

const theme = ref('light')
const isDark = computed(() => theme.value === 'dark')
const navItems = computed(() =>
  [
    { field: 'navResearchLabel', label: store.state.site.navResearchLabel, to: { path: '/', hash: '#research' } },
    { field: 'navPeopleLabel', label: store.state.site.navPeopleLabel, to: { path: '/', hash: '#people' } },
    { field: 'navOutputsLabel', label: store.state.site.navOutputsLabel, to: { path: '/', hash: '#outputs' } },
    { field: 'navToolsLabel', label: store.state.site.navToolsLabel, to: { path: '/', hash: '#tools' }, adminOnly: true },
    { field: 'navContactLabel', label: store.state.site.navContactLabel, to: { path: '/', hash: '#contact' } },
  ].filter((item) => !item.adminOnly || store.isSuperAdmin()),
)
const authMenuOpen = ref(false)
const userMenuOpen = ref(false)
const passwordModalOpen = ref(false)
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '', captcha: '' })
const passwordMessage = ref('')
const passwordCaptchaCode = ref(createCaptcha())
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const globalDialog = reactive({
  open: false,
  type: 'alert',
  title: '',
  message: '',
  resolve: null,
})
let sharedSyncTimer = 0
let globalDialogTimer = 0
let nativeAlert = null

function closeGlobalDialog(value = false) {
  window.clearTimeout(globalDialogTimer)
  const resolve = globalDialog.resolve
  globalDialog.open = false
  globalDialog.resolve = null
  if (resolve) resolve(value)
}

function showGlobalAlert(message, title = '提示') {
  window.clearTimeout(globalDialogTimer)
  globalDialog.type = 'alert'
  globalDialog.title = title
  globalDialog.message = String(message || '')
  globalDialog.open = true
  globalDialog.resolve = null
  globalDialogTimer = window.setTimeout(() => closeGlobalDialog(true), 3000)
}

function showGlobalConfirm(message, title = '确认操作') {
  window.clearTimeout(globalDialogTimer)
  globalDialog.type = 'confirm'
  globalDialog.title = title
  globalDialog.message = String(message || '')
  globalDialog.open = true
  return new Promise((resolve) => {
    globalDialog.resolve = resolve
    globalDialogTimer = window.setTimeout(() => closeGlobalDialog(false), 3000)
  })
}

function createCaptcha() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function refreshPasswordCaptcha() {
  passwordCaptchaCode.value = createCaptcha()
  passwordForm.captcha = ''
}

async function submitPassword() {
  passwordMessage.value = ''
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordMessage.value = '两次新密码不一致'
    refreshPasswordCaptcha()
    return
  }
  if (passwordForm.captcha !== passwordCaptchaCode.value) {
    passwordMessage.value = '验证码不正确'
    refreshPasswordCaptcha()
    return
  }
  const result = await store.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
  passwordMessage.value = result.ok ? '密码已更新' : result.message
  if (result.ok) {
    window.alert('密码修改成功，请重新登录')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    refreshPasswordCaptcha()
    passwordModalOpen.value = false
    store.logout()
    router.push('/tools/members')
  }
}

function openPasswordModal() {
  userMenuOpen.value = false
  passwordMessage.value = ''
  passwordModalOpen.value = true
}

function toggleAuthMenu() {
  authMenuOpen.value = !authMenuOpen.value
  userMenuOpen.value = false
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
  authMenuOpen.value = false
}

function closePasswordModal() {
  passwordModalOpen.value = false
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordForm.captcha = ''
  passwordMessage.value = ''
  showOldPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
  refreshPasswordCaptcha()
}

function editableClass() {
  return { editable: store.isSuperAdmin() }
}

async function saveEditResult(promise, successMessage = '保存成功') {
  const result = await promise
  window.alert(result.ok ? successMessage : result.message || '保存失败')
}

function editSiteField(field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, store.state.site[field] || '')
  if (next === null) return
  saveEditResult(store.updateSiteContent({
    ...store.state.site,
    [field]: next,
  }), '文字保存成功')
}

function logout() {
  userMenuOpen.value = false
  passwordModalOpen.value = false
  store.logout()
}

function setTheme(nextTheme) {
  theme.value = nextTheme
  document.documentElement.dataset.theme = nextTheme
  window.localStorage.setItem('lab-theme', nextTheme)
}

function toggleTheme() {
  setTheme(isDark.value ? 'light' : 'dark')
}

function refreshSharedState() {
  store.syncSharedState()
}

function refreshSharedStateWhenVisible() {
  if (!document.hidden) refreshSharedState()
}

onMounted(() => {
  nativeAlert = window.alert
  window.alert = (message) => showGlobalAlert(message)
  window.appConfirm = (message, title) => showGlobalConfirm(message, title)
  setTheme('light')
  refreshSharedState()
  sharedSyncTimer = window.setInterval(refreshSharedState, 8000)
  window.addEventListener('focus', refreshSharedState)
  document.addEventListener('visibilitychange', refreshSharedStateWhenVisible)
})

onBeforeUnmount(() => {
  window.clearInterval(sharedSyncTimer)
  window.clearTimeout(globalDialogTimer)
  if (nativeAlert) window.alert = nativeAlert
  delete window.appConfirm
  window.removeEventListener('focus', refreshSharedState)
  document.removeEventListener('visibilitychange', refreshSharedStateWhenVisible)
})
</script>

<template>
  <div class="site-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/" aria-label="回到首页">
        <span class="brand-mark">LAB</span>
        <span>
          <strong :class="editableClass()" @dblclick.prevent="editSiteField('groupName', '网站名称')">{{ store.state.site.groupName }}</strong>
        </span>
      </RouterLink>

      <nav class="nav-links" aria-label="主导航">
        <RouterLink v-for="item in navItems" :key="item.field" :to="item.to">
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="topbar-utils">
        <div
          v-if="!store.currentMember.value"
          class="user-menu"
          @mouseenter="authMenuOpen = true"
          @mouseleave="authMenuOpen = false"
        >
          <button class="icon-button user-menu-trigger" type="button" title="账号" @click.stop="toggleAuthMenu">
            <User :size="17" />
          </button>
          <div v-if="authMenuOpen" class="user-menu-panel auth-menu-panel">
            <RouterLink class="menu-action-btn" to="/tools/members" @click="authMenuOpen = false">
              <LogIn :size="15" />
              登录
            </RouterLink>
            <RouterLink class="menu-action-btn" to="/register" @click="authMenuOpen = false">
              <UserPlus :size="15" />
              注册
            </RouterLink>
          </div>
        </div>
        <div
          v-if="store.currentMember.value"
          class="user-menu"
          @mouseenter="userMenuOpen = true"
          @mouseleave="userMenuOpen = false"
        >
          <button class="login-chip user-menu-trigger" type="button" @click.stop="toggleUserMenu">
            <User :size="15" />
            <span class="user-name">{{ store.currentMember.value.name }}</span>
          </button>
          <div v-if="userMenuOpen" class="user-menu-panel">
            <RouterLink
              v-if="store.currentMember.value.staff_id !== 'admin'"
              class="menu-action-btn"
              to="/personal-space"
              @click="userMenuOpen = false"
            >
              <User :size="15" />
              个人空间
            </RouterLink>
            <button class="menu-action-btn" type="button" @click="openPasswordModal">修改密码</button>
            <button class="logout-menu-btn" type="button" @click="logout">
              <LogOut :size="14" />
              退出登录
            </button>
          </div>
        </div>
        <button class="icon-button" type="button" :title="isDark ? '切换到浅色' : '切换到深色'" @click="toggleTheme">
          <Sun v-if="isDark" :size="17" />
          <Moon v-else :size="17" />
        </button>
      </div>
    </header>

    <div v-if="passwordModalOpen" class="modal-overlay">
      <div class="modal-panel user-password-modal" @click.stop>
        <div class="modal-head">
          <h2>修改密码</h2>
          <button class="modal-close" type="button" @click="closePasswordModal">×</button>
        </div>
        <form class="user-password-form" @submit.prevent="submitPassword">
          <label>
            <span>旧密码</span>
            <div class="password-input-row">
              <input
                v-model="passwordForm.oldPassword"
                :type="showOldPassword ? 'text' : 'password'"
                autocomplete="current-password"
              />
              <button
                class="password-eye-btn"
                type="button"
                :title="showOldPassword ? '隐藏密码' : '显示密码'"
                @mousedown.prevent
                @click.prevent.stop="showOldPassword = !showOldPassword"
              >
                <EyeOff v-if="showOldPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </label>
          <label>
            <span>新密码</span>
            <div class="password-input-row">
              <input
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                minlength="4"
                autocomplete="new-password"
              />
              <button
                class="password-eye-btn"
                type="button"
                :title="showNewPassword ? '隐藏密码' : '显示密码'"
                @mousedown.prevent
                @click.prevent.stop="showNewPassword = !showNewPassword"
              >
                <EyeOff v-if="showNewPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </label>
          <label>
            <span>确认新密码</span>
            <div class="password-input-row">
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                minlength="4"
                autocomplete="new-password"
              />
              <button
                class="password-eye-btn"
                type="button"
                :title="showConfirmPassword ? '隐藏密码' : '显示密码'"
                @mousedown.prevent
                @click.prevent.stop="showConfirmPassword = !showConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </label>
          <label>
            <span>四位验证码</span>
            <div class="captcha-row">
              <input v-model="passwordForm.captcha" type="text" inputmode="numeric" maxlength="4" />
              <button class="captcha-code" type="button" title="刷新验证码" @click="refreshPasswordCaptcha">
                <span>{{ passwordCaptchaCode }}</span>
                <RefreshCw :size="14" />
              </button>
            </div>
          </label>
          <button class="button button-dark" type="submit">保存密码</button>
          <p v-if="passwordMessage" class="form-note">{{ passwordMessage }}</p>
        </form>
      </div>
    </div>

    <RouterView />

    <div v-if="globalDialog.open" class="modal-overlay global-dialog-overlay" role="presentation">
      <section class="modal-panel global-dialog-modal" role="dialog" aria-modal="true" :aria-label="globalDialog.title">
        <div class="modal-head global-dialog-head">
          <h2>{{ globalDialog.title }}</h2>
          <button class="modal-close" type="button" title="关闭" @click="closeGlobalDialog(false)">×</button>
        </div>
        <p class="global-dialog-text">{{ globalDialog.message }}</p>
        <div class="global-dialog-actions">
          <button
            v-if="globalDialog.type === 'confirm'"
            class="button button-light"
            type="button"
            @click="closeGlobalDialog(false)"
          >
            取消
          </button>
          <button class="button button-dark" type="button" @click="closeGlobalDialog(true)">
            确认
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
