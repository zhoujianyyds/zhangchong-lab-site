<script setup>
import { computed, reactive, ref } from 'vue'
import { Download, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import AuthGate from '../components/AuthGate.vue'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()
const activeTab = ref('publications')
const editingId = ref('')
const tabs = [
  { key: 'publications', label: '论文' },
  { key: 'awards', label: '获奖' },
]

const form = reactive(createEmptyForm(activeTab.value))
const siteForm = reactive(cloneSiteForm())
const siteFeedback = ref('')
const editorOpen = ref(false)
const submittingOutput = ref(false)
const outputBusy = computed(() => submittingOutput.value)

const activeList = computed(() => {
  if (activeTab.value === 'publications') return store.sortedPublications.value
  return store.sortedAwards.value
})
const activeTabLabel = computed(() => tabs.find((tab) => tab.key === activeTab.value)?.label || '成果')

function cloneSiteForm() {
  return JSON.parse(JSON.stringify(store.state.site))
}

function nextSortOrder(tabKey = activeTab.value) {
  const list = tabKey === 'publications' ? store.sortedPublications.value : store.sortedAwards.value
  const maxOrder = Math.max(
    0,
    ...list.filter((item) => item.visible_on_home !== false).map((item) => Number(item.sort_order) || 0),
  )
  return maxOrder + 1
}

function createEmptyForm(tabKey = activeTab.value) {
  return {
    sort_order: nextSortOrder(tabKey),
    title: '',
    authors: '',
    journal: '',
    pub_year: '',
    volume_issue: '',
    pages: '',
    doi: '',
    paper_link: '',
    pub_type: '论文',
    note: '',
    winner: '',
    image_data: '',
    image_url: '',
    image_name: '',
    visible_on_home: true,
  }
}

function resetForm() {
  editingId.value = ''
  Object.assign(form, createEmptyForm(activeTab.value))
}

function closeOutputEditor(force = false) {
  if (submittingOutput.value && !force) return
  editorOpen.value = false
  resetForm()
}

function openOutputEditor(tab = activeTab.value, item = null) {
  if (outputBusy.value) return
  activeTab.value = tab
  if (item) {
    editingId.value = item.id
    Object.assign(form, createEmptyForm(tab), JSON.parse(JSON.stringify(item)))
  } else {
    editingId.value = ''
    Object.assign(form, createEmptyForm(tab))
  }
  editorOpen.value = true
}

function switchTab(tab) {
  if (submittingOutput.value) return
  activeTab.value = tab
  closeOutputEditor()
}

function successText(kind, action = '保存') {
  const label = kind === 'awards' ? '获奖' : '论文'
  return `${label}${action}成功`
}

async function submitOutput() {
  if (!form.title.trim()) {
    window.alert('请填写标题')
    return
  }
  if (submittingOutput.value) return
  submittingOutput.value = true
  let result = { ok: false, message: '保存失败' }
  const savingKind = activeTab.value
  const wasEditing = Boolean(editingId.value)
  const displayOrder = Number(form.sort_order) || nextSortOrder(activeTab.value)
  try {
    if (savingKind === 'publications') {
      result = await store.upsertOutput('publications', {
        id: editingId.value,
        title: form.title.trim(),
        authors: form.authors.trim(),
        journal: form.journal.trim(),
        pub_year: form.pub_year ? Number(form.pub_year) : '',
        volume_issue: form.volume_issue.trim(),
        pages: form.pages.trim(),
        doi: form.doi.trim(),
        paper_link: form.paper_link.trim(),
        pub_type: form.pub_type,
        note: form.note.trim(),
        visible_on_home: form.visible_on_home,
        sort_order: displayOrder,
      })
    }
    if (savingKind === 'awards') {
      result = await store.upsertOutput('awards', {
        id: editingId.value,
        title: form.title.trim(),
        winner: form.winner.trim(),
        image_data: form.image_data,
        image_url: form.image_url.trim(),
        image_name: form.image_name.trim(),
        visible_on_home: form.visible_on_home,
        sort_order: displayOrder,
      })
    }
    if (!result.ok) {
      window.alert(result.message || '保存失败')
      return
    }
    if (!editingId.value && result.id) editingId.value = result.id
    form.sort_order = displayOrder
    closeOutputEditor(true)
    window.alert(`${successText(savingKind, wasEditing ? '保存' : '添加')}，展示编号为 ${String(displayOrder).padStart(2, '0')}`)
  } finally {
    submittingOutput.value = false
  }
}

function resetSiteForm() {
  Object.assign(siteForm, cloneSiteForm())
}

async function submitSiteContent() {
  const result = await store.updateSiteContent(JSON.parse(JSON.stringify(siteForm)))
  if (!result.ok) {
    window.alert(result.message || '保存失败')
    return
  }
  siteFeedback.value = '保存成功'
  window.alert(siteFeedback.value)
}

async function removeOutput(kind, id) {
  if (outputBusy.value) return
  const item = store.state[kind]?.find((record) => record.id === id)
  const label = kind === 'awards' ? '获奖' : '论文'
  const name = item?.title ? `「${item.title}」` : `该${label}`
  if (!(await window.appConfirm(`确定删除${name}吗？删除后无法恢复。`, '删除确认'))) return
  submittingOutput.value = true
  try {
    const result = await store.removeOutput(kind, id)
    if (!result.ok) {
      window.alert(result.message || '保存失败')
      return
    }
    window.alert(`${label}删除成功`)
  } finally {
    submittingOutput.value = false
  }
}

function addResearchLine() {
  siteForm.researchLines.push({
    title: '新方向',
    tag: 'New Direction',
    icon: 'network',
    tone: 'jade',
    text: '请填写该方向的研究说明。',
  })
}

async function removeResearchLine(index) {
  if (outputBusy.value) return
  if (siteForm.researchLines.length <= 1) return
  if (!(await window.appConfirm('确定删除这个研究方向吗？保存站点内容后才会正式生效。', '删除方向'))) return
  siteForm.researchLines.splice(index, 1)
}

function tabCount(tabKey) {
  return store.state[tabKey].length
}

function itemMeta(item) {
  if (activeTab.value === 'publications') {
    return [item.authors, item.journal, item.pub_year, item.note].filter(Boolean).join(' · ') || '论文信息'
  }
  return item.winner ? `获奖人：${item.winner}` : '获奖信息'
}

function editItem(item) {
  openOutputEditor(activeTab.value, item)
}

async function toggleHomeVisibility(kind, item) {
  if (outputBusy.value) return
  submittingOutput.value = true
  try {
    const result = await store.upsertOutput(kind, {
      ...JSON.parse(JSON.stringify(item)),
      visible_on_home: item.visible_on_home === false,
    })
    if (!result.ok) window.alert(result.message || '保存失败')
  } finally {
    submittingOutput.value = false
  }
}

async function removeAwardImage() {
  if (outputBusy.value) return
  if (!(await window.appConfirm('确定删除这张获奖图片吗？保存成果后才会正式生效。', '删除图片'))) return
  form.image_data = ''
  form.image_url = ''
  form.image_name = ''
}

function downloadAwardImage() {
  const source = form.image_data || form.image_url
  if (!source) return
  const link = document.createElement('a')
  link.href = source
  link.download = form.image_name || 'award-image'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function chooseAwardImage() {
  document.getElementById('award-image-upload')?.click()
}

function handleAwardImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    window.alert('请上传图片文件')
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    form.image_data = String(reader.result || '')
    form.image_name = file.name
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}
</script>

<template>
  <AuthGate tool-id="outputs" title="成果管理" subtitle="统一管理论文和获奖信息，可选择哪些展示到主页。">
    <div class="output-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="output-tab"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tabCount(tab.key) }}</span>
      </button>
    </div>

    <form v-if="activeTab === 'site'" class="tool-form" @submit.prevent="submitSiteContent">
      <div class="tool-page-title-row">
        <h2 class="panel-title">站点内容</h2>
        <button class="button button-light" type="button" @click="resetSiteForm">撤销修改</button>
      </div>
      <div v-if="siteFeedback" class="form-success">{{ siteFeedback }}</div>

      <div class="form-row">
        <div class="form-field">
          <label for="group-name">网站名称</label>
          <input id="group-name" v-model="siteForm.groupName" type="text" />
        </div>
        <div class="form-field">
          <label for="brand-tagline">顶部副标题</label>
          <input id="brand-tagline" v-model="siteForm.brandTagline" type="text" />
        </div>
      </div>

      <div class="permission-group">
        <strong>顶部导航</strong>
        <p>修改顶部菜单显示文字。</p>
        <div class="form-row">
          <div class="form-field">
            <label for="nav-research">研究方向导航</label>
            <input id="nav-research" v-model="siteForm.navResearchLabel" type="text" />
          </div>
          <div class="form-field">
            <label for="nav-people">成员导航</label>
            <input id="nav-people" v-model="siteForm.navPeopleLabel" type="text" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="nav-outputs">成果导航</label>
            <input id="nav-outputs" v-model="siteForm.navOutputsLabel" type="text" />
          </div>
          <div class="form-field">
            <label for="nav-tools">工具导航</label>
            <input id="nav-tools" v-model="siteForm.navToolsLabel" type="text" />
          </div>
        </div>
        <div class="form-field">
          <label for="nav-contact">联系导航</label>
          <input id="nav-contact" v-model="siteForm.navContactLabel" type="text" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="hero-kicker">首屏小标题</label>
          <input id="hero-kicker" v-model="siteForm.heroKicker" type="text" />
        </div>
        <div class="form-field">
          <label for="hero-title">首屏主标题</label>
          <input id="hero-title" v-model="siteForm.heroTitle" type="text" />
        </div>
      </div>

      <div class="form-field">
        <label for="hero-lede">首屏介绍</label>
        <textarea id="hero-lede" v-model="siteForm.heroLede"></textarea>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="visual-label">视觉标签</label>
          <input id="visual-label" v-model="siteForm.visualLabel" type="text" />
        </div>
        <div class="form-field">
          <label for="visual-stack">视觉说明</label>
          <input id="visual-stack" v-model="siteForm.visualStack" type="text" />
        </div>
      </div>

      <div class="permission-group">
        <strong>统计与栏目标题</strong>
        <p>首页统计条和各区块标题。</p>
        <div class="form-row">
          <div class="form-field">
            <label for="stat-research">统计：研究方向</label>
            <input id="stat-research" v-model="siteForm.statResearchLabel" type="text" />
          </div>
          <div class="form-field">
            <label for="stat-members">统计：成员</label>
            <input id="stat-members" v-model="siteForm.statMembersLabel" type="text" />
          </div>
        </div>
        <div class="form-field">
          <label for="stat-outputs">统计：成果</label>
          <input id="stat-outputs" v-model="siteForm.statOutputsLabel" type="text" />
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="research-section-label">研究方向小字</label>
            <input id="research-section-label" v-model="siteForm.researchSectionLabel" type="text" />
          </div>
          <div class="form-field">
            <label for="research-section-title">研究方向大字</label>
            <input id="research-section-title" v-model="siteForm.researchSectionTitle" type="text" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="people-section-label">成员区小字</label>
            <input id="people-section-label" v-model="siteForm.peopleSectionLabel" type="text" />
          </div>
          <div class="form-field">
            <label for="people-section-title">成员区大字</label>
            <input id="people-section-title" v-model="siteForm.peopleSectionTitle" type="text" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="outputs-section-label">成果区小字</label>
            <input id="outputs-section-label" v-model="siteForm.outputsSectionLabel" type="text" />
          </div>
          <div class="form-field">
            <label for="outputs-section-title">成果区大字</label>
            <input id="outputs-section-title" v-model="siteForm.outputsSectionTitle" type="text" />
          </div>
        </div>
      </div>

      <div class="form-field">
        <label for="research-intro">研究方向说明</label>
        <textarea id="research-intro" v-model="siteForm.researchIntro"></textarea>
      </div>

      <div class="form-field">
        <label for="people-intro">成员区说明</label>
        <textarea id="people-intro" v-model="siteForm.peopleIntro"></textarea>
      </div>

      <div class="form-field">
        <label for="pi-intro">负责人简介</label>
        <textarea id="pi-intro" v-model="siteForm.piIntro"></textarea>
      </div>
      <div class="form-field">
        <label for="pi-label">负责人标签</label>
        <input id="pi-label" v-model="siteForm.piLabel" type="text" />
      </div>

      <div class="form-field">
        <label for="tools-intro">工具区说明</label>
        <textarea id="tools-intro" v-model="siteForm.toolsIntro"></textarea>
      </div>

      <div class="permission-group">
        <strong>成果与工具文字</strong>
        <p>首页成果列表中的固定说明，以及工具卡片标题和说明。</p>
        <div class="form-row">
          <div class="form-field">
            <label for="project-type-label">项目标签</label>
            <input id="project-type-label" v-model="siteForm.projectTypeLabel" type="text" />
          </div>
          <div class="form-field">
            <label for="project-note">项目说明</label>
            <input id="project-note" v-model="siteForm.projectNote" type="text" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="award-type-label">获奖标签</label>
            <input id="award-type-label" v-model="siteForm.awardTypeLabel" type="text" />
          </div>
          <div class="form-field">
            <label for="award-note">获奖说明</label>
            <input id="award-note" v-model="siteForm.awardNote" type="text" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="award-prefix">获奖人前缀</label>
            <input id="award-prefix" v-model="siteForm.awardWinnerPrefix" type="text" />
          </div>
          <div class="form-field">
            <label for="award-empty">获奖人空值</label>
            <input id="award-empty" v-model="siteForm.awardEmptyWinner" type="text" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="tools-section-label">工具区小字</label>
            <input id="tools-section-label" v-model="siteForm.toolsSectionLabel" type="text" />
          </div>
          <div class="form-field">
            <label for="tools-section-title">工具区大字</label>
            <input id="tools-section-title" v-model="siteForm.toolsSectionTitle" type="text" />
          </div>
        </div>
        <article v-for="(tool, index) in siteForm.toolCards" :key="tool.key" class="site-edit-card">
          <div class="form-field">
            <label :for="`tool-title-${index}`">工具标题</label>
            <input :id="`tool-title-${index}`" v-model="tool.title" type="text" />
          </div>
          <div class="form-field">
            <label :for="`tool-text-${index}`">工具说明</label>
            <textarea :id="`tool-text-${index}`" v-model="tool.text"></textarea>
          </div>
        </article>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="contact-title">联系区标题</label>
          <input id="contact-title" v-model="siteForm.contactTitle" type="text" />
        </div>
        <div class="form-field">
          <label for="contact-email">联系邮箱</label>
          <input id="contact-email" v-model="siteForm.contactEmail" type="email" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="contact-section-label">联系区小字</label>
          <input id="contact-section-label" v-model="siteForm.contactSectionLabel" type="text" />
        </div>
        <div class="form-field">
          <label for="contact-section-title">联系区大字</label>
          <input id="contact-section-title" v-model="siteForm.contactSectionTitle" type="text" />
        </div>
      </div>
      <div class="form-field">
        <label for="contact-text">联系区说明</label>
        <textarea id="contact-text" v-model="siteForm.contactText"></textarea>
      </div>

      <div class="permission-group">
        <div class="tool-page-title-row">
          <div>
            <strong>研究方向</strong>
            <p>首页研究方向卡片会按这里的顺序显示。</p>
          </div>
          <button class="button button-light" type="button" @click="addResearchLine">
            <Plus :size="16" />
            添加方向
          </button>
        </div>

        <article v-for="(line, index) in siteForm.researchLines" :key="index" class="site-edit-card">
          <div class="form-row">
            <div class="form-field">
              <label :for="`research-title-${index}`">方向名称</label>
              <input :id="`research-title-${index}`" v-model="line.title" type="text" />
            </div>
            <div class="form-field">
              <label :for="`research-tag-${index}`">英文/标签</label>
              <input :id="`research-tag-${index}`" v-model="line.tag" type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label :for="`research-icon-${index}`">图标</label>
              <select :id="`research-icon-${index}`" v-model="line.icon" class="filter-select">
                <option value="network">网络</option>
                <option value="cpu">芯片</option>
                <option value="bot">Agent</option>
              </select>
            </div>
            <div class="form-field">
              <label :for="`research-tone-${index}`">颜色</label>
              <select :id="`research-tone-${index}`" v-model="line.tone" class="filter-select">
                <option value="jade">绿色</option>
                <option value="blue">蓝色</option>
                <option value="clay">红色</option>
                <option value="moss">苔绿色</option>
              </select>
            </div>
          </div>
          <div class="form-field">
            <label :for="`research-text-${index}`">说明</label>
            <textarea :id="`research-text-${index}`" v-model="line.text"></textarea>
          </div>
          <button class="icon-btn icon-btn-danger" type="button" :disabled="outputBusy" @click="removeResearchLine(index)">
            <Trash2 :size="14" />
            删除方向
          </button>
        </article>
      </div>

      <button class="button button-dark" type="submit">保存站点内容</button>
    </form>

    <section v-else class="tool-form output-admin-toolbar">
      <div class="tool-page-title-row">
        <div>
          <h2 class="panel-title">{{ activeTabLabel }}管理</h2>
          <p class="field-hint">新增、编辑、排序和主页展示都在这里维护；展示编号可直接填写。</p>
        </div>
        <button class="button button-dark" type="button" :disabled="outputBusy" @click="openOutputEditor(activeTab)">
          <Plus :size="16" />
          新增{{ activeTabLabel }}
        </button>
      </div>
    </section>

    <div v-if="editorOpen && activeTab !== 'site'" class="modal-overlay output-editor-overlay" role="presentation">
      <form class="tool-form modal-panel output-editor-modal" :class="{ 'is-submitting': outputBusy }" @submit.prevent="submitOutput">
        <div class="tool-page-title-row output-editor-head">
          <div>
            <h2 class="panel-title">{{ editingId ? `编辑${activeTabLabel}` : `新增${activeTabLabel}` }}</h2>
            <p class="field-hint">点击右上角关闭才会退出编辑，点到弹窗外不会丢失已输入内容。</p>
          </div>
          <button class="modal-close" type="button" title="关闭" :disabled="outputBusy" @click="closeOutputEditor">
            <X :size="16" />
          </button>
        </div>

        <div class="form-row">
          <div class="form-field compact-field">
            <label for="output-sort-order">展示编号 *</label>
            <input
              id="output-sort-order"
              v-model.number="form.sort_order"
              type="number"
              min="1"
              step="1"
              placeholder="1"
            />
            <p class="field-hint">编号可独立填写；勾选主页展示后才会参与首页排序。</p>
          </div>
          <div class="form-field">
            <label for="output-title">标题 *</label>
            <input id="output-title" v-model="form.title" type="text" placeholder="标题" />
          </div>
        </div>
        <label class="checkbox-line">
          <input v-model="form.visible_on_home" type="checkbox" />
          <span>在主页展示</span>
        </label>

        <template v-if="activeTab === 'publications'">
          <div class="form-field">
            <label for="authors">作者</label>
            <input id="authors" v-model="form.authors" type="text" placeholder="Zhang A, Li B, et al." />
          </div>
          <div class="form-field">
            <label for="journal">期刊/会议</label>
            <input id="journal" v-model="form.journal" type="text" placeholder="Journal / Conference" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label for="pub-year">年份</label>
              <input id="pub-year" v-model="form.pub_year" type="number" placeholder="2026" />
            </div>
            <div class="form-field">
              <label for="pub-type">类型</label>
              <select id="pub-type" v-model="form.pub_type" class="filter-select">
                <option value="论文">论文</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label for="volume">卷/期</label>
              <input id="volume" v-model="form.volume_issue" type="text" />
            </div>
            <div class="form-field">
              <label for="pages">页码</label>
              <input id="pages" v-model="form.pages" type="text" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label for="doi">DOI</label>
              <input id="doi" v-model="form.doi" type="text" />
            </div>
            <div class="form-field">
              <label for="note">备注</label>
              <input id="note" v-model="form.note" type="text" placeholder="SCI一区，一作" />
            </div>
          </div>
          <div class="form-field">
            <label for="paper-link">论文链接</label>
            <input
              id="paper-link"
              v-model="form.paper_link"
              type="url"
              inputmode="url"
              placeholder="https://..."
            />
          </div>
        </template>

        <template v-if="activeTab === 'awards'">
          <div class="form-field">
            <label for="winner">获奖人（可选）</label>
            <input id="winner" v-model="form.winner" type="text" placeholder="研究小组" />
          </div>
          <div class="form-field">
            <label>获奖图片</label>
            <input
              id="award-image-upload"
              class="visually-hidden"
              type="file"
              accept="image/*"
              @change="handleAwardImage"
            />
            <button class="button button-light award-upload-button" type="button" @click="chooseAwardImage">
              <ImagePlus :size="16" />
              上传获奖图片
            </button>
          </div>
          <div v-if="form.image_data || form.image_url" class="award-upload-preview">
            <img :src="form.image_data || form.image_url" :alt="form.title || '获奖图片预览'" />
            <div class="award-upload-actions">
              <span>{{ form.image_name || '已上传获奖图片' }}</span>
              <button class="icon-btn" type="button" title="下载图片" @click="downloadAwardImage">
                <Download :size="15" />
              </button>
              <button class="icon-btn icon-btn-danger" type="button" title="删除图片" :disabled="outputBusy" @click="removeAwardImage">
                <X :size="15" />
              </button>
            </div>
          </div>
          <div class="form-field">
            <label for="image-url">图片备份链接（可选）</label>
            <input
              id="image-url"
              v-model="form.image_url"
              type="text"
              placeholder="可留空"
            />
          </div>
          <div class="form-field">
            <label for="image-name">图片文件名（可选）</label>
            <input id="image-name" v-model="form.image_name" type="text" placeholder="award-2025-kjjb-1.jpg" />
          </div>
        </template>

        <div class="output-editor-actions">
          <button class="button button-light" type="button" :disabled="outputBusy" @click="closeOutputEditor">取消</button>
          <button class="button button-dark" type="submit" :disabled="outputBusy">{{ editingId ? '保存' : '添加' }}</button>
        </div>
      </form>
    </div>

    <div v-if="activeTab !== 'site'" class="output-admin-list">
      <article v-for="(item, index) in activeList" :key="item.id" class="output-admin-item">
        <span class="output-order-badge">展示 #{{ String(item.sort_order || index + 1).padStart(2, '0') }}</span>
        <div class="output-admin-body">
          <strong>{{ item.title }}</strong>
          <div class="output-admin-meta">
            <span>{{ itemMeta(item) }}</span>
            <span v-if="activeTab === 'awards' && (item.image_data || item.image_url)" class="asset-status">已关联图片</span>
            <span v-if="activeTab === 'publications' && item.paper_link" class="asset-status">已添加链接</span>
            <span class="home-visibility-pill" :class="{ off: item.visible_on_home === false }">
              {{ item.visible_on_home === false ? '不在主页展示' : '主页展示' }}
            </span>
          </div>
        </div>
        <div class="row-actions">
          <button class="icon-btn" type="button" :disabled="outputBusy" @click="toggleHomeVisibility(activeTab, item)">
            {{ item.visible_on_home === false ? '展示到主页' : '取消主页' }}
          </button>
          <button class="icon-btn" type="button" :disabled="outputBusy" @click="editItem(item)">
            <Pencil :size="14" />
          </button>
          <button class="icon-btn icon-btn-danger" type="button" :disabled="outputBusy" @click="removeOutput(activeTab, item.id)">
            <Trash2 :size="14" />
          </button>
        </div>
      </article>
      <div v-if="activeList.length === 0" class="tool-empty inline-empty">
        <p>暂无数据</p>
      </div>
    </div>
  </AuthGate>
</template>
