<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, Award, Code2, Download, ExternalLink, FileText, ImagePlus, Mail, Pencil } from 'lucide-vue-next'
import heroImage from '../assets/hero.png'
import mentorPreviewImage from '../assets/mentor-preview.jpg'
import { useLabStore } from '../stores/labStore'

const previewMentorPhoto = mentorPreviewImage
const isLocalPreview = import.meta.env.DEV
const previewResearchDirections = [
  { title: '大模型搜索加速与高效推理', text: '面向检索增强生成（RAG）、智能体工具检索、长上下文搜索与搜索式推理，研究搜索空间压缩、检索与缓存优化、调度优化及软硬件协同加速，提高大模型的搜索与推理效率。' },
  { title: '计算机体系结构与高效智能系统', text: '围绕可重构计算、芯片级任务执行、冗余消除、AI 系统与加速架构，研究算法、系统与硬件的协同优化方法。' },
  { title: '低功耗物联网与无源智能系统', text: '研究能量采集、无源与间歇计算、微功耗电路、能量管理、反向散射通信及低功耗终端架构。' },
  { title: '边端智能感知与数据推理', text: '研究稀疏感知、虚拟传感、多模态融合、物理约束学习、边端协同推理及资源受限条件下的智能识别。' },
  { title: '计算机网络与应用安全', text: '研究物联网通信、数据完整性、轻量级可信机制、边端安全及资源受限系统的安全执行。' },
  { title: '工业智能与能源场景应用', text: '面向油气勘探开发、气井生产、测井、结构健康监测和智能检测等实际问题，开展算法研究、系统设计与原型验证。' },
]

const store = useLabStore()
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const mentor = computed(
  () =>
    store.state.members.find((member) => member.staff_id === 'zhangchong') ||
    store.siteMembers.value.find((member) => member.role === 'teacher') ||
    null,
)
const mentorPhoto = computed(() => isLocalPreview ? previewMentorPhoto : (mentor.value?.photo || heroImage))
const mentorName = computed(() => mentor.value?.name || '张翀')
const mentorTitle = computed(() => mentor.value?.mentor_title ?? '西南石油大学计算机与软件学院 · 特聘副研究员 / 硕士生导师')
const mentorEmail = computed(() => mentor.value?.email || store.state.site.contactEmail)
const mentorBio = computed(() => mentor.value?.bio ?? store.state.site.piIntro)
const mentorPublications = computed(() => store.sortedPublications.value)
const mentorAwards = computed(() => store.sortedAwards.value)
const mentorPatents = computed(() =>
  store.sortedPatents.value,
)
const mentorResearchProjects = computed(() => store.sortedResearchProjects.value)
const mentorSoftwareCopyrights = computed(() => store.sortedSoftwareCopyrights.value)
const previewPublications = computed(() => mentorPublications.value.filter((item) => item.visible_on_home !== false))
const previewAwards = computed(() => mentorAwards.value.filter((item) => item.visible_on_home !== false))
const previewPatents = computed(() => mentorPatents.value)
const previewSoftwareCopyrights = computed(() => mentorSoftwareCopyrights.value.filter((item) => item.visible_on_home !== false))

function editableClass() {
  return { editable: store.canEditMentorPage() }
}

async function saveResult(action, successMessage, confirmMessage = '确定保存这项修改吗？') {
  if (!(await window.appConfirm(confirmMessage, '确认保存'))) return
  const result = await (window.appRunBusy?.(action, '正在保存导师信息，请稍候') || action())
  window.alert(result.ok ? successMessage : result.message || '保存失败')
}

function editMentorField(field, label) {
  if (!store.canEditMentorPage() || !mentor.value) return
  const current = field === 'bio' ? mentorBio.value : field === 'mentor_title' ? mentorTitle.value : mentor.value[field] || ''
  const next = window.prompt(`修改${label}`, current)
  if (next === null) return
  saveResult(
    () => store.upsertMember({
      ...JSON.parse(JSON.stringify(mentor.value)),
      [field]: next.trim(),
    }),
    '导师资料保存成功', `确定修改${label}吗？`,
  )
}

function editPublication(item, field, label) {
  if (!store.canEditMentorPage()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  saveResult(
    () => store.upsertOutput('publications', {
      ...JSON.parse(JSON.stringify(item)),
      [field]: field === 'pub_year' ? Number(next) || '' : next.trim(),
    }),
    '论文信息保存成功', `确定修改${label}吗？`,
  )
}

function editAward(item, field, label) {
  if (!store.canEditMentorPage()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  saveResult(
    () => store.upsertOutput('awards', {
      ...JSON.parse(JSON.stringify(item)),
      [field]: next.trim(),
    }),
    '获奖信息保存成功', `确定修改${label}吗？`,
  )
}

function editPatent(item, field, label) {
  if (!store.canEditMentorPage()) return
  const next = window.prompt(`修改${label}`, item[field] || '')
  if (next === null) return
  saveResult(
    () => store.upsertOutput('projects', {
      ...JSON.parse(JSON.stringify(item)),
      category: '专利',
      [field]: next.trim(),
    }),
    '专利信息保存成功', `确定修改${label}吗？`,
  )
}

function openPaper(item, event) {
  if (store.canEditMentorPage() && event?.target?.closest('.editable')) return
  const link = item.paper_link?.trim()
  if (link) window.open(link, '_blank', 'noopener,noreferrer')
}

function downloadAward(item, event) {
  if (store.canEditMentorPage() && event?.target?.closest('.editable')) return
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
  if (!store.canEditMentorPage()) return
  document.getElementById('mentor-photo-input')?.click()
}

function uploadMentorPhoto(event) {
  if (!store.canEditMentorPage()) return
  const file = event.target.files?.[0]
  if (!file || !mentor.value) return
  if (!file.type.startsWith('image/')) {
    window.alert('请选择图片文件')
    event.target.value = ''
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    window.alert('图片不能超过 2 MB，请压缩后重新上传')
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    saveResult(
      () => store.upsertMember({
        ...JSON.parse(JSON.stringify(mentor.value)),
        photo: String(reader.result || ''),
      }),
      '导师照片保存成功', '确定上传并保存这张导师照片吗？',
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
        <button v-if="store.canEditMentorPage()" class="mentor-photo-btn" type="button" @click="chooseMentorPhoto">
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
        <h1 :class="editableClass()" @dblclick="editMentorField('name', '导师姓名')">{{ mentorName }}</h1>
        <p class="mentor-title" :class="editableClass()" @dblclick="editMentorField('mentor_title', '导师职称说明')">{{ mentorTitle || (store.canEditMentorPage() ? '双击添加职称说明' : '') }}</p>
        <p class="mentor-summary" :class="editableClass()" @dblclick="editMentorField('bio', '导师简介')">
          {{ mentorBio || (store.canEditMentorPage() ? '双击添加导师简介' : '') }}
        </p>
        <div class="mentor-contact-row">
          <a class="button button-dark" :href="`mailto:${mentorEmail}`">
            <Mail :size="16" />
            {{ mentorEmail }}
          </a>
          <RouterLink v-if="store.canEditMentorPage()" class="button button-light" :to="store.isSuperAdmin() ? '/tools/members' : '/personal-space'">
            <Pencil :size="16" />
            {{ store.isSuperAdmin() ? '编辑导师资料' : '编辑联系方式' }}
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
      <article>
        <strong>{{ mentorResearchProjects.length }}</strong>
        <span>科研与教改项目</span>
      </article>
      <article>
        <strong>{{ mentorSoftwareCopyrights.length }}</strong>
        <span>软著</span>
      </article>
    </section>

    <section class="mentor-content section mentor-profile-details">
      <div class="section-title title-center"><h2>主要研究方向</h2></div>
      <div class="mentor-direction-grid">
        <article v-for="(direction, index) in previewResearchDirections" :key="direction.title" class="mentor-direction-card">
          <span class="mentor-direction-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3>{{ direction.title }}</h3>
          <p>{{ direction.text }}</p>
        </article>
      </div>
      <div class="section-title title-center mentor-subsection-title"><h2>招生与科研条件</h2></div>
      <div class="mentor-detail-grid">
        <article class="mentor-detail-panel">
          <h3>招生与人才培养</h3>
          <p>面向计算机科学与技术、软件工程、电子信息等方向招收硕士研究生，欢迎具有较强学习能力和科研兴趣的优秀本科生提前参与科研。结合学生基础和研究兴趣开展科研训练，引导学生从实际问题出发，逐步掌握问题定义、方法设计、系统实现、实验验证和成果总结的方法。</p>
          <p>培养过程中注重学术研究与工程实践。学生可根据兴趣选择大模型与 AI 系统、计算机体系结构、低功耗物联网、边端智能感知、网络与安全或能源行业智能计算等方向。具备程序设计、算法建模、FPGA 与嵌入式开发、电路设计等任一方面基础的同学，均可在相应课题中逐步深入。支持优秀学生参与高水平论文投稿、国内外学术交流、科研项目和实际场景中的工程验证。</p>
          <p>研二暑期前，围绕论文选题、研究方法、实验设计与论文写作提供深入指导，带领学生形成研究成果。从研二暑期开始，学生可根据个人发展规划离开实验室，自主安排实习；有志于继续科研的同学也可留在实验室积累成果，并获得前往 985 高校攻读博士学位的推荐支持。</p>
          <p>有意报考或提前参与科研的同学，可发送邮件至 <a :href="`mailto:${mentorEmail}`">{{ mentorEmail }}</a>。来信建议附个人简历、成绩与排名、科研或竞赛经历，并说明感兴趣的研究方向。</p>
        </article>
        <article class="mentor-detail-panel">
          <h3>科研条件与合作</h3>
          <p>依托四川省油气勘探开发智能化工程研究中心，以及西南石油大学相关国家级、省部级科研平台，实验室具备 FPGA、嵌入式系统、PCB 设计与电路仿真、软件无线电、微功耗测试和 GPU 计算等实验条件，并可依托国家超级计算成都中心开展大规模计算与仿真。</p>
          <p>前期研究已形成低功耗 FPGA 原型、微能量管理电路和多类边端感知系统，可支持学生开展系统设计、算法验证与工程实践。与上海交通大学、浙江大学、北京大学等高校的相关团队保持科研合作，为学生参与跨团队交流与联合研究提供条件。</p>
        </article>
      </div>
    </section>

    <section class="mentor-content section">
      <div class="section-title title-center">
        <h2>论文 · 获奖 · 专利 · 科研与教改项目 · 软著</h2>
      </div>

      <div class="mentor-output-layout">
        <section class="mentor-output-panel">
          <div class="mentor-output-head">
            <FileText :size="20" />
            <h3>论文</h3>
          </div>
          <div class="mentor-output-items">
          <article v-for="item in previewPublications" :key="item.id" class="mentor-output-item">
            <button class="mentor-output-main" type="button" @click="openPaper(item, $event)">
              <strong :class="editableClass()" @dblclick.stop="editPublication(item, 'title', '论文标题')">{{ item.title }}</strong>
              <span>{{ [item.journal, item.pub_year].filter(Boolean).join(' · ') }}</span>
              <small :class="editableClass()" @dblclick.stop="editPublication(item, 'authors', '作者')">{{ item.authors }}</small>
            </button>
            <button v-if="item.paper_link" class="icon-button" type="button" title="打开论文链接" @click="openPaper(item)">
              <ExternalLink :size="16" />
            </button>
          </article>
          </div>
          <RouterLink class="mentor-output-more" :to="{ name: 'public-outputs', query: { type: 'publications' }, hash: '#publications' }">查看全部论文 <ExternalLink :size="15" /></RouterLink>
        </section>

        <section class="mentor-output-panel">
          <div class="mentor-output-head">
            <Award :size="20" />
            <h3>获奖</h3>
          </div>
          <div class="mentor-output-items">
          <article v-for="item in previewAwards" :key="item.id" class="mentor-output-item">
            <button class="mentor-output-main" type="button" @click="downloadAward(item, $event)">
              <strong :class="editableClass()" @dblclick.stop="editAward(item, 'title', '获奖标题')">{{ item.title }}</strong>
              <span :class="editableClass()" @dblclick.stop="editAward(item, 'winner', '获奖人')">{{ item.winner || '待录入' }}</span>
              <small>{{ item.image_data || item.image_url ? '点击下载获奖图片' : '暂未上传获奖图片' }}</small>
            </button>
            <button class="icon-button" type="button" title="下载获奖图片" @click="downloadAward(item)">
              <Download :size="16" />
            </button>
          </article>
          </div>
          <RouterLink class="mentor-output-more" :to="{ name: 'public-outputs', query: { type: 'awards' }, hash: '#awards' }">查看全部获奖 <ExternalLink :size="15" /></RouterLink>
        </section>

        <section class="mentor-output-panel">
          <div class="mentor-output-head">
            <Pencil :size="20" />
            <h3>专利</h3>
          </div>
          <div class="mentor-output-items">
          <article v-for="item in previewPatents" :key="item.id" class="mentor-output-item">
            <button class="mentor-output-main" type="button">
              <strong :class="editableClass()" @dblclick.stop="editPatent(item, 'title', '专利标题')">{{ item.title }}</strong>
              <span :class="editableClass()" @dblclick.stop="editPatent(item, 'authors', '发明人')">{{ item.authors || '发明人待录入' }}</span>
              <small :class="editableClass()" @dblclick.stop="editPatent(item, 'patent_no', '专利号')">{{ item.patent_no || '专利号待录入' }}</small>
            </button>
          </article>
          </div>
          <RouterLink class="mentor-output-more" :to="{ name: 'public-outputs', query: { type: 'patents' }, hash: '#patents' }">查看全部专利 <ExternalLink :size="15" /></RouterLink>
        </section>

        <section class="mentor-output-panel">
          <div class="mentor-output-head">
            <FileText :size="20" />
            <h3>科研与教改项目</h3>
          </div>
          <div class="mentor-output-items">
            <article v-for="item in mentorResearchProjects" :key="item.id" class="mentor-output-item">
              <div class="mentor-output-main">
                <strong>{{ item.title }}</strong>
                <span>{{ [item.source, item.project_no].filter(Boolean).join(' · ') }}</span>
                <small>{{ item.note }}</small>
              </div>
            </article>
          </div>
          <RouterLink class="mentor-output-more" :to="{ name: 'public-outputs', query: { type: 'researchProjects' }, hash: '#researchProjects' }">查看全部科研与教改项目 <ExternalLink :size="15" /></RouterLink>
        </section>

        <section class="mentor-output-panel">
          <div class="mentor-output-head"><Code2 :size="20" /><h3>软著</h3></div>
          <div class="mentor-output-items">
            <article v-for="item in previewSoftwareCopyrights" :key="item.id" class="mentor-output-item">
              <div class="mentor-output-main"><strong>{{ item.title }}</strong><span>{{ item.winner || item.authors || '软件著作权成果' }}</span><small>{{ item.patent_no || '登记号待录入' }}</small></div>
            </article>
          </div>
          <RouterLink class="mentor-output-more" :to="{ name: 'public-outputs', query: { type: 'softwareCopyrights' }, hash: '#softwareCopyrights' }">查看全部软著 <ExternalLink :size="15" /></RouterLink>
        </section>

      </div>
    </section>
  </main>
</template>
