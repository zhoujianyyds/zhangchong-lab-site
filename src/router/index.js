import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MembersView from '../views/MembersView.vue'
import OutputsView from '../views/OutputsView.vue'
import PersonalSpaceView from '../views/PersonalSpaceView.vue'
import RegisterView from '../views/RegisterView.vue'

export const routes = [
  { path: '/', name: 'home', component: HomeView, alias: ['/402zhangchong', '/home'] },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/personal-space', name: 'personal-space', component: PersonalSpaceView },
  { path: '/tools/members', name: 'members', component: MembersView },
  { path: '/tools/outputs', name: 'outputs', component: OutputsView },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 80 }
    return { top: 0 }
  },
})
