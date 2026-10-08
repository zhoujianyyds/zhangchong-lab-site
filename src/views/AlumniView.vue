<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, ArrowUpRight } from 'lucide-vue-next'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()
const alumni = computed(() => store.siteMembers.value.filter((member) => member.role === 'alumni'))
</script>

<template>
  <main class="tool-page alumni-page">
    <header class="tool-page-header">
      <RouterLink class="back-link" to="/#people"><ArrowLeft :size="16" /> 返回成员列表</RouterLink>
      <h1>已毕业生</h1>
      <p>查看已毕业生的公开资料。</p>
    </header>

    <div v-if="alumni.length" class="alumni-list">
      <RouterLink
        v-for="member in alumni"
        :key="member.id"
        class="alumni-card"
        :to="{ name: 'member-profile', params: { id: member.id } }"
      >
        <span class="alumni-avatar">
          <img v-if="member.photo" :src="member.photo" :alt="`${member.name}的照片`" />
          <span v-else>{{ member.name?.slice(0, 1) || '人' }}</span>
        </span>
        <span class="alumni-card-copy">
          <strong>{{ member.name }}</strong>
          <small>{{ [member.graduation_year ? `${member.graduation_year} 年毕业` : '', member.direction].filter(Boolean).join(' · ') || '查看个人资料' }}</small>
        </span>
        <ArrowUpRight :size="18" />
      </RouterLink>
    </div>
    <div v-else class="tool-empty inline-empty"><p>暂无公开的已毕业生资料</p></div>
  </main>
</template>

<style scoped>
.back-link { display: inline-flex; align-items: center; gap: 6px; }
.alumni-list { display: grid; gap: 12px; }
.alumni-card { display: flex; align-items: center; gap: 16px; padding: 14px 18px; border: 1px solid var(--border-weak); background: var(--paper); color: var(--ink); text-decoration: none; }
.alumni-card:hover { border-color: var(--border-strong); background: var(--panel); }
.alumni-avatar { display: grid; place-items: center; width: 64px; height: 64px; flex: none; overflow: hidden; border: 1px solid var(--border-weak); color: var(--heading); background: var(--panel); font-weight: 800; }
.alumni-avatar img { width: 100%; height: 100%; object-fit: cover; }
.alumni-card-copy { display: grid; gap: 5px; flex: 1; min-width: 0; }
.alumni-card-copy strong { color: var(--heading); font-size: 1.05rem; }
.alumni-card-copy small { color: var(--muted); }
</style>
