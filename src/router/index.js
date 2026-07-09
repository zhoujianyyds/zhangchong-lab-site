import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MembersView from '../views/MembersView.vue'
import OutputsView from '../views/OutputsView.vue'
import PersonalSpaceView from '../views/PersonalSpaceView.vue'
import RegisterView from '../views/RegisterView.vue'
import { useLabStore } from '../stores/labStore'

export const routes = [
  { path: '/', name: 'home', component: HomeView, alias: ['/402zhangchong', '/home'] },
  { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
  { path: '/personal-space', name: 'personal-space', component: PersonalSpaceView, meta: { requiresAuth: true, toolId: 'profile' } },
  { path: '/tools/members', name: 'members', component: MembersView, meta: { toolId: 'members', allowLogin: true, adminOnly: true } },
  { path: '/tools/outputs', name: 'outputs', component: OutputsView, meta: { toolId: 'outputs', allowLogin: true, adminOnly: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 80 }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const store = useLabStore()
  const member = store.currentMember.value

  if (to.meta.guestOnly && member) return { name: 'home' }
  if (!to.meta.requiresAuth && !to.meta.toolId) return true
  if (!member && to.meta.allowLogin) return true
  if (!member) return { name: 'members' }
  if (to.meta.adminOnly && !store.isSuperAdmin(member)) return { name: 'personal-space' }
  if (to.meta.toolId && !store.hasTool(to.meta.toolId, member)) return { name: 'home' }

  return true
})
