<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowUpRight,
  Bot,
  Cpu,
  DatabaseZap,
  FileText,
  GraduationCap,
  Mail,
  Network,
  UsersRound,
} from 'lucide-vue-next'
import heroImage from '../assets/hero.png'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()

const iconMap = {
  network: Network,
  cpu: Cpu,
  bot: Bot,
}

const researchLines = computed(() =>
  store.state.site.researchLines.map((line) => ({
    ...line,
    icon: iconMap[line.icon] || Network,
  })),
)

const toolIconMap = {
  members: UsersRound,
  outputs: FileText,
  site: DatabaseZap,
}

const toolLinkMap = {
  members: '/tools/members',
  outputs: '/tools/outputs',
  site: '/tools/outputs',
}

const tools = computed(() =>
  store.state.site.toolCards.map((tool) => ({
    ...tool,
    icon: toolIconMap[tool.key] || DatabaseZap,
    to: toolLinkMap[tool.key] || '/tools/outputs',
  })),
)

const teachers = computed(() => store.siteMembers.value.filter((member) => member.role === 'teacher'))
const students = computed(() => store.siteMembers.value.filter((member) => member.role === 'student'))
const gradeGroups = computed(() => [
  {
    title: '研二研究成员',
    members: students.value.filter((member) => member.grade === '研二'),
  },
  {
    title: '研一空位',
    members: students.value.filter((member) => member.grade === '研一'),
  },
])
const outputCount = computed(
  () => store.state.publications.length + store.state.projects.length + store.state.awards.length,
)
const contactHref = computed(() => `mailto:${store.state.site.contactEmail}`)

function editableClass() {
  return { editable: store.isSuperAdmin() }
}

function editSiteField(field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, store.state.site[field] || '')
  if (next === null) return
  store.updateSiteContent({
    ...store.state.site,
    [field]: next,
    researchLines: store.state.site.researchLines,
  })
}

function editResearchLine(index, field, label) {
  if (!store.isSuperAdmin()) return
  const lines = JSON.parse(JSON.stringify(store.state.site.researchLines))
  const next = window.prompt(`修改${label}`, lines[index][field] || '')
  if (next === null) return
  lines[index][field] = next
  store.updateSiteContent({
    ...store.state.site,
    researchLines: lines,
  })
}

function editToolCard(index, field, label) {
  if (!store.isSuperAdmin()) return
  const toolCards = JSON.parse(JSON.stringify(store.state.site.toolCards))
  const next = window.prompt(`修改${label}`, toolCards[index][field] || '')
  if (next === null) return
  toolCards[index][field] = next
  store.updateSiteContent({
    ...store.state.site,
    toolCards,
  })
}

function editMemberField(member, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, member[field] || '')
  if (next === null) return
  store.upsertMember({
    ...JSON.parse(JSON.stringify(member)),
    [field]: next,
  })
}

function editPublication(item, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  store.upsertOutput('publications', {
    ...JSON.parse(JSON.stringify(item)),
    [field]: field === 'pub_year' ? Number(next) || '' : next,
  })
}

function editProject(item, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  store.upsertOutput('projects', {
    ...JSON.parse(JSON.stringify(item)),
    [field]: next,
  })
}

function editAward(item, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  store.upsertOutput('awards', {
    ...JSON.parse(JSON.stringify(item)),
    [field]: next,
  })
}
</script>

<template>
  <main id="top">
    <section class="hero section-frame">
      <div class="hero-copy">
        <h1 :class="editableClass()" @dblclick="editSiteField('heroTitle', '首页标题')">{{ store.state.site.heroTitle }}</h1>
        <p class="hero-lede" :class="editableClass()" @dblclick="editSiteField('heroLede', '首页介绍')">
          {{ store.state.site.heroLede }}
        </p>
        <div class="hero-actions">
          <a class="button button-dark" href="#outputs">
            <span :class="editableClass()" @dblclick.prevent="editSiteField('heroPrimaryButton', '首屏按钮')">{{ store.state.site.heroPrimaryButton }}</span>
            <ArrowUpRight :size="17" />
          </a>
          <a class="button button-light" href="#contact">
            <span :class="editableClass()" @dblclick.prevent="editSiteField('heroSecondaryButton', '首屏按钮')">{{ store.state.site.heroSecondaryButton }}</span>
            <Mail :size="17" />
          </a>
        </div>
      </div>

      <div class="hero-visual" aria-label="研究系统视觉">
        <img :src="heroImage" alt="研究系统抽象视觉" />
        <div class="visual-caption">
          <span :class="editableClass()" @dblclick="editSiteField('visualLabel', '视觉标签')">{{ store.state.site.visualLabel }}</span>
          <strong :class="editableClass()" @dblclick="editSiteField('visualStack', '视觉说明')">{{ store.state.site.visualStack }}</strong>
        </div>
      </div>
    </section>

    <section class="stats-strip" aria-label="课题组概览">
      <div>
        <strong>{{ researchLines.length }}</strong>
        <span :class="editableClass()" @dblclick="editSiteField('statResearchLabel', '统计标签')">{{ store.state.site.statResearchLabel }}</span>
      </div>
      <div>
        <strong>{{ students.length }}</strong>
        <span :class="editableClass()" @dblclick="editSiteField('statMembersLabel', '统计标签')">{{ store.state.site.statMembersLabel }}</span>
      </div>
      <div>
        <strong>{{ outputCount }}</strong>
        <span :class="editableClass()" @dblclick="editSiteField('statOutputsLabel', '统计标签')">{{ store.state.site.statOutputsLabel }}</span>
      </div>
    </section>

    <section id="research" class="section">
      <div class="section-title title-center">
        <span :class="editableClass()" @dblclick="editSiteField('researchSectionLabel', '栏目小字')">{{ store.state.site.researchSectionLabel }}</span>
        <h2 :class="editableClass()" @dblclick="editSiteField('researchSectionTitle', '栏目标题')">{{ store.state.site.researchSectionTitle }}</h2>
      </div>

      <div class="research-grid">
        <article v-for="(line, index) in researchLines" :key="line.title" class="research-card" :class="line.tone">
          <div class="card-index">{{ String(index + 1).padStart(2, '0') }}</div>
          <component :is="line.icon" :size="30" />
          <p :class="editableClass()" @dblclick="editResearchLine(index, 'tag', '方向标签')">{{ line.tag }}</p>
          <h3 :class="editableClass()" @dblclick="editResearchLine(index, 'title', '方向名称')">{{ line.title }}</h3>
          <span :class="editableClass()" @dblclick="editResearchLine(index, 'text', '方向说明')">{{ line.text }}</span>
        </article>
      </div>
    </section>

    <section id="people" class="section people-section">
      <div class="section-title compact title-center">
        <span :class="editableClass()" @dblclick="editSiteField('peopleSectionLabel', '栏目小字')">{{ store.state.site.peopleSectionLabel }}</span>
        <h2 :class="editableClass()" @dblclick="editSiteField('peopleSectionTitle', '栏目标题')">{{ store.state.site.peopleSectionTitle }}</h2>
        <p :class="editableClass()" @dblclick="editSiteField('peopleIntro', '成员区说明')">{{ store.state.site.peopleIntro }}</p>
      </div>

      <article class="pi-panel">
        <div class="pi-avatar">
          <img v-if="teachers[0]?.photo" :src="teachers[0].photo" alt="导师照片" />
          <GraduationCap v-else :size="30" />
        </div>
        <div>
          <span :class="editableClass()" @dblclick="editSiteField('piLabel', '导师标签')">{{ store.state.site.piLabel }}</span>
          <h3 :class="editableClass()" @dblclick="teachers[0] && editMemberField(teachers[0], 'name', '导师姓名')">{{ teachers[0]?.name || '负责人姓名' }}</h3>
          <p :class="editableClass()" @dblclick="editSiteField('piIntro', '导师简介')">{{ store.state.site.piIntro }}</p>
        </div>
      </article>

      <div class="member-groups">
        <article v-for="group in gradeGroups" :key="group.title" class="member-group">
          <h3>{{ group.title }}</h3>
          <div v-for="member in group.members" :key="member.id" class="member-row">
            <div class="member-row-main">
              <div class="site-member-avatar">
                <img v-if="member.photo" :src="member.photo" alt="成员照片" />
                <span v-else>{{ member.name?.slice(0, 1) || '人' }}</span>
              </div>
              <div class="member-row-copy">
                <div class="member-row-head">
                  <strong :class="editableClass()" @dblclick="editMemberField(member, 'name', '成员姓名')">{{ member.name }}</strong>
                  <span :class="editableClass()" @dblclick="editMemberField(member, 'grade', '成员年级')">{{ member.grade || '研究生' }}</span>
                </div>
                <p :class="editableClass()" @dblclick="editMemberField(member, 'direction', '研究方向')">{{ member.direction }}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section id="outputs" class="section outputs-section">
      <div class="section-title title-center">
        <span :class="editableClass()" @dblclick="editSiteField('outputsSectionLabel', '栏目小字')">{{ store.state.site.outputsSectionLabel }}</span>
        <h2 :class="editableClass()" @dblclick="editSiteField('outputsSectionTitle', '栏目标题')">{{ store.state.site.outputsSectionTitle }}</h2>
      </div>

      <div class="output-list">
        <article v-for="item in store.sortedPublications.value" :key="item.id" class="output-item">
          <span>{{ item.pub_type }}</span>
          <div>
            <h3 :class="editableClass()" @dblclick="editPublication(item, 'title', '论文标题')">{{ item.title }}</h3>
            <p>
              <span :class="editableClass()" @dblclick="editPublication(item, 'journal', '期刊/会议')">{{ item.journal }}</span>
              ·
              <span :class="editableClass()" @dblclick="editPublication(item, 'pub_year', '年份')">{{ item.pub_year || '待录入' }}</span>
            </p>
            <small :class="editableClass()" @dblclick="editPublication(item, 'authors', '作者')">{{ item.authors }}</small>
          </div>
        </article>
        <article v-for="item in store.sortedProjects.value" :key="item.id" class="output-item">
          <span :class="editableClass()" @dblclick="editSiteField('projectTypeLabel', '项目标签')">{{ store.state.site.projectTypeLabel }}</span>
          <div>
            <h3 :class="editableClass()" @dblclick="editProject(item, 'title', '项目标题')">{{ item.title }}</h3>
            <p :class="editableClass()" @dblclick="editProject(item, 'category', '项目类别')">{{ item.category }}</p>
            <small :class="editableClass()" @dblclick="editSiteField('projectNote', '项目说明')">{{ store.state.site.projectNote }}</small>
          </div>
        </article>
        <article v-for="item in store.sortedAwards.value" :key="item.id" class="output-item">
          <span :class="editableClass()" @dblclick="editSiteField('awardTypeLabel', '获奖标签')">{{ store.state.site.awardTypeLabel }}</span>
          <div>
            <h3 :class="editableClass()" @dblclick="editAward(item, 'title', '获奖标题')">{{ item.title }}</h3>
            <p :class="editableClass()" @dblclick="editAward(item, 'winner', '获奖人')">
              {{ store.state.site.awardWinnerPrefix }}{{ item.winner || store.state.site.awardEmptyWinner }}
            </p>
            <small :class="editableClass()" @dblclick="editSiteField('awardNote', '获奖说明')">{{ store.state.site.awardNote }}</small>
          </div>
        </article>
      </div>
    </section>

    <section v-if="store.isSuperAdmin()" id="tools" class="section">
      <div class="section-title compact title-center">
        <span :class="editableClass()" @dblclick="editSiteField('toolsSectionLabel', '栏目小字')">{{ store.state.site.toolsSectionLabel }}</span>
        <h2 :class="editableClass()" @dblclick="editSiteField('toolsSectionTitle', '栏目标题')">{{ store.state.site.toolsSectionTitle }}</h2>
        <p :class="editableClass()" @dblclick="editSiteField('toolsIntro', '工具区说明')">{{ store.state.site.toolsIntro }}</p>
      </div>

      <div class="tool-grid">
        <RouterLink v-for="(tool, index) in tools" :key="tool.key" class="tool-card tool-card-anchor" :to="tool.to">
          <component :is="tool.icon" :size="26" />
          <h3 :class="editableClass()" @dblclick.prevent="editToolCard(index, 'title', '工具标题')">{{ tool.title }}</h3>
          <p :class="editableClass()" @dblclick.prevent="editToolCard(index, 'text', '工具说明')">{{ tool.text }}</p>
        </RouterLink>
      </div>
    </section>

    <section id="contact" class="contact-band contact-center">
      <div>
        <p class="eyebrow" :class="editableClass()" @dblclick="editSiteField('contactSectionLabel', '联系小字')">{{ store.state.site.contactSectionLabel }}</p>
        <h2 :class="editableClass()" @dblclick="editSiteField('contactSectionTitle', '联系标题')">{{ store.state.site.contactSectionTitle }}</h2>
        <p :class="editableClass()" @dblclick="editSiteField('contactText', '联系说明')">{{ store.state.site.contactText }}</p>
      </div>
      <a class="button button-dark" :href="contactHref" :class="editableClass()" @dblclick.prevent="editSiteField('contactEmail', '联系邮箱')">
        {{ store.state.site.contactEmail }}
        <Mail :size="17" />
      </a>
    </section>
  </main>

  <footer class="footer">
    <span :class="editableClass()" @dblclick="editSiteField('groupName', '网站名称')">© 2026 {{ store.state.site.groupName }}</span>
  </footer>
</template>
