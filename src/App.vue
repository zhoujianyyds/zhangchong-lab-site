<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { LogIn, LogOut, Moon, RefreshCw, Sun, User, UserPlus } from 'lucide-vue-next'
import { useLabStore } from './stores/labStore'

const store = useLabStore()
const router = useRouter()

const baseNavItems = [
  { label: '研究方向', to: { path: '/', hash: '#research' } },
  { label: '成员', to: { path: '/', hash: '#people' } },
  { label: '成果', to: { path: '/', hash: '#outputs' } },
  { label: '工具', to: { path: '/', hash: '#tools' }, adminOnly: true },
  { label: '联系', to: { path: '/', hash: '#contact' } },
]

const theme = ref('dark')
const isDark = computed(() => theme.value === 'dark')
const navItems = computed(() => baseNavItems.filter((item) => !item.adminOnly || store.isSuperAdmin()))
const authMenuOpen = ref(false)
const userMenuOpen = ref(false)
const passwordModalOpen = ref(false)
const passwordForm = reactive({ oldPassword: '', newPassword: '', captcha: '' })
const passwordMessage = ref('')
const passwordCaptchaCode = ref(createCaptcha())

function createCaptcha() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function refreshPasswordCaptcha() {
  passwordCaptchaCode.value = createCaptcha()
  passwordForm.captcha = ''
}

function submitPassword() {
  passwordMessage.value = ''
  if (passwordForm.captcha !== passwordCaptchaCode.value) {
    passwordMessage.value = '验证码不正确'
    refreshPasswordCaptcha()
    return
  }
  const result = store.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
  passwordMessage.value = result.ok ? '密码已更新' : result.message
  if (result.ok) {
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
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
  passwordForm.captcha = ''
  passwordMessage.value = ''
  refreshPasswordCaptcha()
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

onMounted(() => {
  setTheme('dark')
  store.syncSharedState()
})
</script>

<template>
  <div class="site-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/" aria-label="回到首页">
        <span class="brand-mark">LAB</span>
        <span>
          <strong>{{ store.state.site.groupName }}</strong>
          <small>{{ store.state.site.brandTagline }}</small>
        </span>
      </RouterLink>

      <nav class="nav-links" aria-label="主导航">
        <RouterLink v-for="item in navItems" :key="item.label" :to="item.to">{{ item.label }}</RouterLink>
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

    <div v-if="passwordModalOpen" class="modal-overlay" @click.self="closePasswordModal">
      <div class="modal-panel user-password-modal">
        <div class="modal-head">
          <h2>修改密码</h2>
          <button class="modal-close" type="button" @click="closePasswordModal">×</button>
        </div>
        <form class="user-password-form" @submit.prevent="submitPassword">
          <label>
            <span>旧密码</span>
            <input v-model="passwordForm.oldPassword" type="password" autocomplete="current-password" />
          </label>
          <label>
            <span>新密码</span>
            <input v-model="passwordForm.newPassword" type="password" minlength="4" autocomplete="new-password" />
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
  </div>
</template>
