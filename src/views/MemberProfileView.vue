<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, BookOpen, GraduationCap, Mail, UserRound } from 'lucide-vue-next'
import { useLabStore } from '../stores/labStore'
import MemberAchievements from '../components/MemberAchievements.vue'

const route = useRoute()
const store = useLabStore()

const member = computed(() => {
  const memberId = String(route.params.id)
  if (store.isSuperAdmin()) return store.state.members.find((item) => item.id === memberId) || null
  return store.siteMembers.value.find((item) => item.id === memberId) || null
})

const identity = computed(() => {
  if (!member.value) return ''
  if (member.value.role === 'teacher') return '教师'
  return member.value.grade === '博士' ? '博士生' : member.value.grade || '学生'
})
</script>

<template>
  <main class="public-member-page section-frame">
    <RouterLink class="mentor-back" to="/#people">
      <ArrowLeft :size="16" />
      返回成员列表
    </RouterLink>

    <section v-if="member" class="public-member-card">
      <div class="public-member-photo">
        <img v-if="member.photo" :src="member.photo" :alt="`${member.name}的照片`" />
        <span v-else>{{ member.name?.slice(0, 1) || '人' }}</span>
      </div>

      <div class="public-member-content">
        <h1>{{ member.name }}</h1>

        <div class="public-member-meta">
          <span><GraduationCap :size="17" />{{ identity }}</span>
          <span v-if="member.direction"><BookOpen :size="17" />{{ member.direction }}</span>
        </div>

        <section class="public-member-bio">
          <h2><UserRound :size="19" />个人简介</h2>
          <p>{{ member.bio || '该成员暂未填写个人简介。' }}</p>
        </section>

        <a v-if="member.email" class="button button-dark public-member-email" :href="`mailto:${member.email}`">
          <Mail :size="16" />
          联系成员
        </a>
      </div>
    </section>

    <MemberAchievements v-if="member" :member="member" :editable="store.isSuperAdmin()" />

    <section v-else class="tool-empty public-member-missing">
      <p>没有找到该成员的公开资料</p>
      <RouterLink class="button button-light" to="/#people">返回成员列表</RouterLink>
    </section>
  </main>
</template>
