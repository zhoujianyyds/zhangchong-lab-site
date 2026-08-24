<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, Award, Download, ExternalLink, FileText, ImagePlus, Mail, Pencil } from 'lucide-vue-next'
import heroImage from '../assets/hero.png'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()

const mentor = computed(
  () =>
    store.state.members.find((member) => member.staff_id === 'zhangchong') ||
    store.siteMembers.value.find((member) => member.role === 'teacher') ||
    null,
)
const mentorPhoto = computed(() => mentor.value?.photo || heroImage)
const mentorName = computed(() => mentor.value?.name || '张翀')
const mentorEmail = computed(() => mentor.value?.email || store.state.site.contactEmail)
const mentorBio = computed(() => mentor.value?.bio || store.state.site.piIntro)
const mentorPublications = computed(() => store.sortedPublications.value)
const mentorAwards = computed(() => store.sortedAwards.value)
const mentorPatents = computed(() =>
  store.sortedProjects.value.filter((item) => item.category === '专利' || item.patent_no),
)

function editableClass() {
  return { editable: store.isSuperAdmin() }
}

async function saveResult(promise, successMessage) {
  const result = await (window.appRunBusy?.(() => promise, '正在保存导师信息，请稍候') || promise)
  window.alert(result.ok ? successMessage : result.message || '保存失败')
}

function editMentorField(field, label) {
  if (!store.isSuperAdmin() || !mentor.value) return
  const current = field === 'bio' ? mentorBio.value : mentor.value[field] || ''
  const next = window.prompt(`修改${label}`, current)
  if (next === null) return
  saveResult(
    store.upsertMember({
      ...JSON.parse(JSON.stringify(mentor.value)),
      [field]: next.trim(),
    }),
    '导师资料保存成功',
  )
}

function editSiteField(field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, store.state.site[field] || '')
  if (next === null) return
  saveResult(
    store.updateSiteContent({
      ...store.state.site,
      [field]: next,
      researchLines: store.state.site.researchLines,
    }),
    '页面文字保存成功',
  )
}

function editPublication(item, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  saveResult(
    store.upsertOutput('publications', {
      ...JSON.parse(JSON.stringify(item)),
      [field]: field === 'pub_year' ? Number(next) || '' : next.trim(),
    }),
    '论文信息保存成功',
  )
}

function editAward(item, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  saveResult(
    store.upsertOutput('awards', {
      ...JSON.parse(JSON.stringify(item)),
      [field]: next.trim(),
    }),
    '获奖信息保存成功',
  )
}

function editPatent(item, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  saveResult(
    store.upsertOutput('projects', {
      ...JSON.parse(JSON.stringify(item)),
      category: '专利',
      [field]: next.trim(),
    }),
    '专利信息保存成功',
  )
}

function openPaper(item) {
  const link = item.paper_link?.trim()
  if (link) window.open(link, '_blank', 'noopener,noreferrer')
}

function downloadAward(item) {
  const source = item.image_data || item.image_url
  if (!source) {
    window.alert('该获奖成果还没有上传图片')
    return
  }
  const link = document.createElement('a')
  link.href = source
  link.download = item.image_name || `${item.title || 'award'}.jpg`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function chooseMentorPhoto() {
  document.getElementById('mentor-photo-input')?.click()
}

function uploadMentorPhoto(event) {
  const file = event.target.files?.[0]
  if (!file || !mentor.value) return
  if (!file.type.startsWith('image/')) {
    window.alert('请选择图片文件')
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    saveResult(
      store.upsertMember({
        ...JSON.parse(JSON.stringify(mentor.value)),
        photo: String(reader.result || ''),
      }),
      '导师照片保存成功',
    )
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}
</script>

<template>
  <main class="mentor-page">
    <section class="mentor-hero section-frame">
      <div class="mentor-portrait">
        <img :src="mentorPhoto" alt="导师照片" />
        <button v-if="store.isSuperAdmin()" class="mentor-photo-btn" type="button" @click="chooseMentorPhoto">
          <ImagePlus :size="16" />
          更换照片
        </button>
        <input id="mentor-photo-input" class="photo-input" type="file" accept="image/*" @change="uploadMentorPhoto" />
      </div>

      <div class="mentor-hero-copy">
        <RouterLink class="mentor-back" to="/">
          <ArrowLeft :size="16" />
          返回首页
        </RouterLink>
        <p class="eyebrow" :class="editableClass()" @dblclick="editSiteField('piLabel', '导师标签')">
          {{ store.state.site.piLabel || '导师' }}
        </p>
        <h1 :class="editableClass()" @dblclick="editMentorField('name', '导师姓名')">{{ mentorName }}</h1>
        <p class="mentor-title">西南石油大学计算机与软件学院 · 特聘副研究员 / 硕士生导师</p>
        <p class="mentor-summary" :class="editableClass()" @dblclick="editMentorField('bio', '导师简介')">
          {{ mentorBio }}
        </p>
        <div class="mentor-contact-row">
          <a class="button button-dark" :href="`mailto:${mentorEmail}`">
            <Mail :size="16" />
            {{ mentorEmail }}
          </a>
          <RouterLink v-if="store.isSuperAdmin()" class="button button-light" to="/tools/members">
            <Pencil :size="16" />
            编辑导师资料
          </RouterLink>
          <RouterLink v-if="store.isSuperAdmin()" class="button button-light" to="/tools/outputs">
            <Pencil :size="16" />
            编辑成果
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="mentor-stats section">
      <article>
        <strong>{{ mentorPublications.length }}</strong>
        <span>论文成果</span>
      </article>
      <article>
        <strong>{{ mentorAwards.length }}</strong>
        <span>获奖成果</span>
      </article>
      <article>
        <strong>{{ mentorPatents.length }}</strong>
        <span>专利成果</span>
      </article>
    </section>

    <section class="mentor-content section">
      <div class="section-title title-center">
        <span>导师成果</span>
        <h2>Publications · Awards · Patents</h2>
      </div>

      <div class="mentor-output-layout">
        <section class="mentor-output-panel">
          <div class="mentor-output-head">
            <FileText :size="20" />
            <h3>论文</h3>
          </div>
          <article v-for="item in mentorPublications" :key="item.id" class="mentor-output-item">
            <button class="mentor-output-main" type="button" @click="openPaper(item)">
              <strong :class="editableClass()" @dblclick.stop="editPublication(item, 'title', '论文标题')">{{ item.title }}</strong>
              <span>{{ [item.journal, item.pub_year].filter(Boolean).join(' · ') }}</span>
              <small :class="editableClass()" @dblclick.stop="editPublication(item, 'authors', '作者')">{{ item.authors }}</small>
            </button>
            <button v-if="item.paper_link" class="icon-button" type="button" title="打开论文链接" @click="openPaper(item)">
              <ExternalLink :size="16" />
            </button>
          </article>
        </section>

        <section class="mentor-output-panel">
          <div class="mentor-output-head">
            <Award :size="20" />
            <h3>获奖</h3>
          </div>
          <article v-for="item in mentorAwards" :key="item.id" class="mentor-output-item">
            <button class="mentor-output-main" type="button" @click="downloadAward(item)">
              <strong :class="editableClass()" @dblclick.stop="editAward(item, 'title', '获奖标题')">{{ item.title }}</strong>
              <span :class="editableClass()" @dblclick.stop="editAward(item, 'winner', '获奖人')">{{ item.winner || '待录入' }}</span>
              <small>{{ item.image_data || item.image_url ? '点击下载获奖图片' : '暂未上传获奖图片' }}</small>
            </button>
            <button class="icon-button" type="button" title="下载获奖图片" @click="downloadAward(item)">
              <Download :size="16" />
            </button>
          </article>
        </section>

        <section class="mentor-output-panel">
          <div class="mentor-output-head">
            <Pencil :size="20" />
            <h3>专利</h3>
          </div>
          <article v-for="item in mentorPatents" :key="item.id" class="mentor-output-item">
            <button class="mentor-output-main" type="button">
              <strong :class="editableClass()" @dblclick.stop="editPatent(item, 'title', '专利标题')">{{ item.title }}</strong>
              <span :class="editableClass()" @dblclick.stop="editPatent(item, 'authors', '发明人')">{{ item.authors || '发明人待录入' }}</span>
              <small :class="editableClass()" @dblclick.stop="editPatent(item, 'patent_no', '专利号')">{{ item.patent_no || '专利号待录入' }}</small>
            </button>
          </article>
        </section>
      </div>
    </section>
  </main>
</template>
