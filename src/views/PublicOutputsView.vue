<script setup>
import { Download, ExternalLink, FileText, Award, ArrowLeft, Pencil } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()
const route = useRoute()
const category = () => route.query.type || 'all'

function openPublication(item) {
  const source = item.paper_link?.trim()
  if (!source) {
    window.alert('该论文暂未添加跳转链接')
    return
  }
  window.open(source, '_blank', 'noopener,noreferrer')
}

function downloadAward(item) {
  const source = item.image_data || item.image_url
  if (!source) {
    window.alert('该获奖成果暂未上传可下载图片')
    return
  }
  const link = document.createElement('a')
  link.href = source
  link.download = item.image_name || `${item.title || '获奖成果'}.jpg`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
</script>

<template>
  <main class="public-outputs-page section-frame">
    <RouterLink class="mentor-back" to="/#outputs">
      <ArrowLeft :size="16" />
      返回首页成果
    </RouterLink>

    <header class="public-outputs-header">
      <h1>论文与获奖</h1>
      <p>浏览研究小组的全部论文和获奖成果。</p>
    </header>

    <section v-if="category() === 'all' || category() === 'publications'" id="publications" class="public-output-section">
      <div class="public-output-title">
        <FileText :size="22" />
        <div>
          <h2>全部论文</h2>
        </div>
        <span>{{ store.sortedPublications.value.length }}</span>
      </div>

      <div class="public-output-list">
        <button
          v-for="item in store.sortedPublications.value"
          :key="item.id"
          class="public-output-card"
          type="button"
          @click="openPublication(item)"
        >
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ [item.authors, item.journal, item.pub_year].filter(Boolean).join(' · ') || '论文信息待补充' }}</p>
            <small v-if="item.note">{{ item.note }}</small>
          </div>
          <span class="public-output-action"><ExternalLink :size="17" />打开链接</span>
        </button>
        <div v-if="store.sortedPublications.value.length === 0" class="output-empty-state">暂无论文成果</div>
      </div>
    </section>

    <section v-if="category() === 'all' || category() === 'awards'" id="awards" class="public-output-section">
      <div class="public-output-title">
        <Award :size="22" />
        <div>
          <h2>全部获奖</h2>
        </div>
        <span>{{ store.sortedAwards.value.length }}</span>
      </div>

      <div class="public-output-list">
        <button
          v-for="item in store.sortedAwards.value"
          :key="item.id"
          class="public-output-card"
          type="button"
          @click="downloadAward(item)"
        >
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.winner ? `${store.state.site.awardWinnerPrefix}${item.winner}` : store.state.site.awardEmptyWinner }}</p>
          </div>
          <span class="public-output-action"><Download :size="17" />下载图片</span>
        </button>
        <div v-if="store.sortedAwards.value.length === 0" class="output-empty-state">暂无获奖成果</div>
      </div>
    </section>

    <section v-if="category() === 'all' || category() === 'patents'" id="patents" class="public-output-section">
      <div class="public-output-title">
        <Pencil :size="22" />
        <div>
          <h2>全部专利</h2>
        </div>
        <span>{{ store.sortedProjects.value.filter((item) => item.category === '专利' || item.patent_no).length }}</span>
      </div>

      <div class="public-output-list">
        <article
          v-for="item in store.sortedProjects.value.filter((record) => record.category === '专利' || record.patent_no)"
          :key="item.id"
          class="public-output-card public-output-card-static"
        >
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.authors || '发明人待录入' }}</p>
            <small>{{ item.patent_no || '专利号待录入' }}</small>
          </div>
        </article>
        <div v-if="store.sortedProjects.value.filter((item) => item.category === '专利' || item.patent_no).length === 0" class="output-empty-state">暂无专利成果</div>
      </div>
    </section>

  </main>
</template>
