<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowUpRight,
  Bot,
  Cpu,
  FileText,
  Mail,
  Network,
  Download,
  ExternalLink,
  Info,
  Plus,
  Trash2,
  X,
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
}

const toolLinkMap = {
  members: '/tools/members',
  outputs: '/tools/outputs',
}

const tools = computed(() =>
  store.state.site.toolCards.filter((tool) => tool.key !== 'site').map((tool) => ({
    ...tool,
    icon: toolIconMap[tool.key] || FileText,
    to: toolLinkMap[tool.key] || '/tools/outputs',
  })),
)

const teachers = computed(() => store.siteMembers.value.filter((member) => member.role === 'teacher'))
const students = computed(() => store.siteMembers.value.filter((member) => member.role === 'student'))
const gradeGroups = computed(() => [
  {
    title: '研二',
    members: students.value.filter((member) => member.grade === '研二'),
  },
  {
    title: '研一',
    members: students.value.filter((member) => member.grade === '研一'),
  },
  {
    title: '博士生',
    members: students.value.filter((member) => member.grade === '博士'),
  },
  {
    title: '本科生',
    members: students.value.filter((member) => member.grade === '本科生'),
  },
  {
    title: '研三',
    members: students.value.filter((member) => member.grade === '研三'),
  },
])
const gradeColumns = computed(() => [
  gradeGroups.value.slice(1, 2),
  gradeGroups.value.slice(0, 1),
  gradeGroups.value.slice(4, 5),
  gradeGroups.value.slice(2, 4),
])
const outputCount = computed(
  () => store.sortedPublications.value.length + store.sortedProjects.value.length + store.sortedAwards.value.length,
)
const contactHref = computed(() => `mailto:${store.state.site.contactEmail}`)
const selectedOutput = ref(null)

function editableClass() {
  return { editable: store.isSuperAdmin() }
}

async function saveEditResult(action, successMessage = '保存成功', confirmMessage = '确定保存这项修改吗？') {
  if (confirmMessage && !(await window.appConfirm(confirmMessage, '确认保存'))) return
  const result = await (window.appRunBusy?.(action, '正在保存文字，请稍候') || action())
  window.alert(result.ok ? successMessage : result.message || '保存失败')
}

function editSiteField(field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, store.state.site[field] || '')
  if (next === null) return
  saveEditResult(() => store.updateSiteContent({
    ...store.state.site,
    [field]: next,
    researchLines: store.state.site.researchLines,
  }), '文字保存成功', `确定修改${label}吗？`)
}

function editResearchLine(index, field, label) {
  if (!store.isSuperAdmin()) return
  const lines = JSON.parse(JSON.stringify(store.state.site.researchLines))
  const next = window.prompt(`修改${label}`, lines[index][field] || '')
  if (next === null) return
  lines[index][field] = next
  saveEditResult(() => store.updateSiteContent({
    ...store.state.site,
    researchLines: lines,
  }), '研究方向保存成功', `确定修改${label}吗？`)
}

function addResearchLine() {
  if (!store.isSuperAdmin()) return
  const lines = JSON.parse(JSON.stringify(store.state.site.researchLines))
  const tones = ['jade', 'blue', 'moss', 'clay']
  lines.push({
    title: '新研究方向',
    tag: '研究方向',
    icon: 'network',
    tone: tones[lines.length % tones.length],
    text: '双击文字填写该方向的研究说明。',
  })
  saveEditResult(() => store.updateSiteContent({
    ...store.state.site,
    researchLines: lines,
  }), '研究方向添加成功', '确定添加一个新的研究方向吗？')
}

async function removeResearchLine(index) {
  if (!store.isSuperAdmin()) return
  const line = store.state.site.researchLines[index]
  if (!(await window.appConfirm(`确定删除“${line?.title || '该研究方向'}”吗？`, '删除研究方向'))) return
  const lines = JSON.parse(JSON.stringify(store.state.site.researchLines))
  lines.splice(index, 1)
  saveEditResult(() => store.updateSiteContent({
    ...store.state.site,
    researchLines: lines,
  }), '研究方向删除成功', '')
}

function editToolCard(index, field, label) {
  if (!store.isSuperAdmin()) return
  const toolCards = JSON.parse(JSON.stringify(store.state.site.toolCards))
  const next = window.prompt(`修改${label}`, toolCards[index][field] || '')
  if (next === null) return
  toolCards[index][field] = next
  saveEditResult(() => store.updateSiteContent({
    ...store.state.site,
    toolCards,
  }), '工具文字保存成功', `确定修改${label}吗？`)
}

function editMemberField(member, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, member[field] || '')
  if (next === null) return
  saveEditResult(() => store.upsertMember({
    ...JSON.parse(JSON.stringify(member)),
    [field]: next,
  }), '成员文字保存成功', `确定修改${label}吗？`)
}

function editPublication(item, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  saveEditResult(() => store.upsertOutput('publications', {
    ...JSON.parse(JSON.stringify(item)),
    [field]: field === 'pub_year' ? Number(next) || '' : next,
  }), '论文文字保存成功', `确定修改${label}吗？`)
}

function editProject(item, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  saveEditResult(() => store.upsertOutput('projects', {
    ...JSON.parse(JSON.stringify(item)),
    [field]: next,
  }), '项目文字保存成功', `确定修改${label}吗？`)
}

function editAward(item, field, label) {
  if (!store.isSuperAdmin()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  saveEditResult(() => store.upsertOutput('awards', {
    ...JSON.parse(JSON.stringify(item)),
    [field]: next,
  }), '获奖文字保存成功', `确定修改${label}吗？`)
}

function openOutput(item, kind) {
  selectedOutput.value = { ...item, kind }
}

function closeOutputDialog() {
  selectedOutput.value = null
}

function openPaperLink() {
  const link = selectedOutput.value?.paper_link?.trim()
  if (!link) return
  window.open(link, '_blank', 'noopener,noreferrer')
}

function openPublication(item) {
  const link = item?.paper_link?.trim()
  if (link) {
    window.open(link, '_blank', 'noopener,noreferrer')
    return
  }
  openOutput(item, 'publication')
}

function downloadAwardImage(item = selectedOutput.value) {
  const source = item?.image_data || item?.image_url
  if (!source) {
    window.alert('该获奖成果还没有上传图片')
    return
  }
  const link = document.createElement('a')
  link.href = source
  link.download = item.image_name || 'award-image'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  link.remove()
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
            查看成果
            <ArrowUpRight :size="17" />
          </a>
          <a class="button button-light" href="#contact">
            联系加入
            <Mail :size="17" />
          </a>
          <RouterLink class="button button-mentor" to="/mentor">
            导师信息
            <Info :size="17" />
          </RouterLink>
        </div>
      </div>

      <div class="hero-visual" aria-label="研究系统视觉">
        <img :src="heroImage" alt="研究系统抽象视觉" />
        <div class="visual-caption">
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
        <strong>{{ store.siteMembers.value.length }}</strong>
        <span :class="editableClass()" @dblclick="editSiteField('statMembersLabel', '统计标签')">{{ store.state.site.statMembersLabel }}</span>
      </div>
      <div>
        <strong>{{ outputCount }}</strong>
        <span :class="editableClass()" @dblclick="editSiteField('statOutputsLabel', '统计标签')">{{ store.state.site.statOutputsLabel }}</span>
      </div>
    </section>

    <section id="research" class="section">
      <div class="section-title title-center">
        <h2 :class="editableClass()" @dblclick="editSiteField('researchSectionTitle', '栏目标题')">{{ store.state.site.researchSectionTitle }}</h2>
      </div>

      <div v-if="store.isSuperAdmin()" class="research-admin-actions">
        <button class="button button-light" type="button" @click="addResearchLine">
          <Plus :size="16" />
          新增研究方向
        </button>
      </div>

      <div class="research-grid">
        <article v-for="(line, index) in researchLines" :key="`${line.title}-${index}`" class="research-card" :class="line.tone">
          <button
            v-if="store.isSuperAdmin()"
            class="research-card-remove"
            type="button"
            title="删除研究方向"
            @click.stop="removeResearchLine(index)"
          >
            <Trash2 :size="16" />
          </button>
          <div class="card-index">{{ String(index + 1).padStart(2, '0') }}</div>
          <component :is="line.icon" :size="30" />
          <p :class="editableClass()" @dblclick="editResearchLine(index, 'tag', '方向标签')">{{ line.tag }}</p>
          <h3 :class="editableClass()" @dblclick="editResearchLine(index, 'title', '方向名称')">{{ line.title }}</h3>
          <span :class="editableClass()" @dblclick="editResearchLine(index, 'text', '方向说明')">{{ line.text }}</span>
        </article>
        <div v-if="researchLines.length === 0" class="research-empty">暂无研究方向</div>
      </div>
    </section>

    <section id="people" class="section people-section">
      <div class="section-title compact title-center">
        <h2 :class="editableClass()" @dblclick="editSiteField('peopleSectionTitle', '栏目标题')">{{ store.state.site.peopleSectionTitle }}</h2>
        <p :class="editableClass()" @dblclick="editSiteField('peopleIntro', '成员区说明')">{{ store.state.site.peopleIntro }}</p>
      </div>

      <article id="mentor" class="pi-panel">
        <RouterLink class="pi-avatar" to="/mentor" title="查看导师信息">
          <img :src="teachers[0]?.photo || heroImage" alt="导师照片" />
        </RouterLink>
        <div class="pi-copy">
          <h3><RouterLink class="public-profile-link" to="/mentor" title="查看导师资料">{{ teachers[0]?.name || '负责人姓名' }}</RouterLink></h3>
          <p :class="editableClass()" @dblclick="editSiteField('piIntro', '导师简介')">{{ store.state.site.piIntro }}</p>
        </div>
      </article>

      <div class="member-groups">
        <div v-for="(column, columnIndex) in gradeColumns" :key="columnIndex" class="member-group-column">
        <article v-for="group in column" :key="group.title" class="member-group">
          <h3>{{ group.title }}</h3>
          <div v-for="member in group.members" :key="member.id" class="member-row">
            <div class="member-row-main">
              <div class="member-row-copy">
                <div class="member-row-head">
                  <RouterLink
                    class="public-profile-link"
                    :to="{ name: 'member-profile', params: { id: member.id } }"
                    :title="`查看${member.name}的个人资料`"
                  >
                    <strong>{{ member.name }}</strong>
                  </RouterLink>
                </div>
              </div>
              <RouterLink
                class="site-member-avatar member-row-photo"
                :to="{ name: 'member-profile', params: { id: member.id } }"
                :title="`查看${member.name}的个人资料`"
              >
                <img v-if="member.photo" :src="member.photo" alt="成员照片" />
              </RouterLink>
            </div>
          </div>
        </article>
        </div>
      </div>
    </section>

    <section id="outputs" class="section outputs-section">
      <div class="section-title title-center">
        <h2 :class="editableClass()" @dblclick="editSiteField('outputsSectionTitle', '栏目标题')">{{ store.state.site.outputsSectionTitle }}</h2>
      </div>

      <div class="output-groups">
        <section class="output-group">
          <div class="output-group-head">
            <h3>论文</h3>
            <RouterLink class="output-more-link" :to="{ name: 'public-outputs', hash: '#publications' }">
              查看更多
              <ArrowUpRight :size="15" />
            </RouterLink>
          </div>
          <div class="output-list">
            <article
              v-for="item in store.homePublications.value.slice(0, 8)"
              :key="item.id"
              class="output-item output-item-interactive"
              tabindex="0"
              role="button"
              @click="openPublication(item)"
              @keydown.enter.prevent="openPublication(item)"
            >
              <div>
                <h3>{{ item.title }}</h3>
                <p>
                  <span>{{ item.journal }}</span>
                  ·
                  <span>{{ item.pub_year || '待录入' }}</span>
                </p>
                <small>{{ item.authors }}</small>
              </div>
            </article>
            <div v-if="store.homePublications.value.length === 0" class="output-empty-state">
              暂无公开论文成果
            </div>
          </div>
        </section>

        <section class="output-group">
          <div class="output-group-head">
            <h3>获奖</h3>
            <RouterLink class="output-more-link" :to="{ name: 'public-outputs', hash: '#awards' }">
              查看更多
              <ArrowUpRight :size="15" />
            </RouterLink>
          </div>
          <div class="output-list">
            <article
              v-for="item in store.homeAwards.value.slice(0, 8)"
              :key="item.id"
              class="output-item output-item-interactive"
              tabindex="0"
              role="button"
              @click="downloadAwardImage(item)"
              @keydown.enter.prevent="downloadAwardImage(item)"
            >
              <div>
                <h3>{{ item.title }}</h3>
                <p>
                  {{ store.state.site.awardWinnerPrefix }}{{ item.winner || store.state.site.awardEmptyWinner }}
                </p>
                <small>{{ store.state.site.awardNote }}</small>
              </div>
            </article>
            <div v-if="store.homeAwards.value.length === 0" class="output-empty-state">
              暂无公开获奖成果
            </div>
          </div>
        </section>

        <section class="output-group">
          <div class="output-group-head">
            <h3>专利</h3>
            <RouterLink class="output-more-link" :to="{ name: 'public-outputs', hash: '#patents' }">
              查看更多
              <ArrowUpRight :size="15" />
            </RouterLink>
          </div>
          <div class="output-list">
            <article v-for="item in store.sortedProjects.value.slice(0, 8)" :key="item.id" class="output-item">
              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.patent_no || '专利号待录入' }}</p>
                <small>{{ item.authors || '发明人待录入' }}</small>
              </div>
            </article>
            <div v-if="store.sortedProjects.value.length === 0" class="output-empty-state">暂无专利成果</div>
          </div>
        </section>

      </div>
    </section>

    <section v-if="store.isSuperAdmin()" id="tools" class="section">
      <div class="section-title compact title-center">
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
        <h2 :class="editableClass()" @dblclick="editSiteField('contactSectionTitle', '联系标题')">{{ store.state.site.contactSectionTitle }}</h2>
        <p :class="editableClass()" @dblclick="editSiteField('contactText', '联系说明')">{{ store.state.site.contactText }}</p>
      </div>
      <a class="button button-dark" :href="contactHref">
        {{ store.state.site.contactEmail }}
        <Mail :size="17" />
      </a>
    </section>
  </main>

  <footer class="footer">
    <span :class="editableClass()" @dblclick="editSiteField('groupName', '网站名称')">© 2026 {{ store.state.site.groupName }}</span>
  </footer>

  <div v-if="selectedOutput" class="modal-overlay output-detail-overlay" role="presentation">
    <section class="modal-panel output-detail-modal" role="dialog" aria-modal="true" :aria-label="selectedOutput.title">
      <div class="modal-head">
        <h2>{{ selectedOutput.kind === 'award' ? '获奖成果' : '论文成果' }}</h2>
        <button class="modal-close" type="button" title="关闭" @click="closeOutputDialog">
          <X :size="18" />
        </button>
      </div>

      <div v-if="selectedOutput.kind === 'award'" class="output-detail-content">
        <h3>{{ selectedOutput.title }}</h3>
        <p v-if="selectedOutput.winner">{{ store.state.site.awardWinnerPrefix }}{{ selectedOutput.winner }}</p>
        <img
          v-if="selectedOutput.image_data || selectedOutput.image_url"
          class="award-detail-image"
          :src="selectedOutput.image_data || selectedOutput.image_url"
          :alt="selectedOutput.title"
        />
        <div v-else class="asset-empty-state">管理员尚未上传该获奖图片</div>
        <button v-if="selectedOutput.image_data || selectedOutput.image_url" class="button button-dark" type="button" @click="downloadAwardImage">
          <Download :size="16" />
          下载图片
        </button>
      </div>

      <div v-else class="output-detail-content">
        <h3>{{ selectedOutput.title }}</h3>
        <p>{{ [selectedOutput.authors, selectedOutput.journal, selectedOutput.pub_year].filter(Boolean).join(' · ') || '论文信息待补充' }}</p>
        <p v-if="selectedOutput.note" class="output-detail-note">{{ selectedOutput.note }}</p>
        <button v-if="selectedOutput.paper_link" class="button button-dark" type="button" @click="openPaperLink">
          <ExternalLink :size="16" />
          打开论文链接
        </button>
        <div v-else class="asset-empty-state">管理员尚未添加论文链接</div>
      </div>
    </section>
  </div>

</template>
