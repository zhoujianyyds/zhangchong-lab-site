import { computed, reactive } from 'vue'
import { fetchSharedState, saveSharedState, sharedStateEnabled } from '../lib/cloudState'

const STORAGE_KEY = 'lab-site-vue-store-v1'
const SESSION_KEY = 'lab-site-vue-session-v1'
const DATA_VERSION = 'member-persist-v1'
const ADMIN_PASSWORD = 'zj020206zj'
const ZHOU_JIAN_PASSWORD = 'zj020206zj'

const toolIds = ['members', 'outputs']

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

function defaultSiteContent() {
  return {
    groupName: '张翀研究小组',
    brandTagline: '油气井 · 嵌入式 · Agent',
    navResearchLabel: '研究方向',
    navPeopleLabel: '成员',
    navOutputsLabel: '成果',
    navToolsLabel: '工具',
    navContactLabel: '联系',
    heroKicker: '',
    heroTitle: '张翀研究小组',
    heroLede:
      '围绕油气井、嵌入式系统和 Agent 智能体开展研究与工程实践，面向真实工业场景构建可靠、可部署、可持续迭代的智能系统。',
    heroPrimaryButton: '查看成果',
    heroSecondaryButton: '联系加入',
    visualLabel: '研究方向',
    visualStack: '油气井 / 嵌入式 / Agent',
    statResearchLabel: '研究方向',
    statMembersLabel: '研究成员',
    statOutputsLabel: '论文项目获奖',
    researchSectionLabel: '研究方向',
    researchSectionTitle: 'Research',
    researchIntro: '',
    peopleSectionLabel: '团队成员',
    peopleSectionTitle: 'People',
    peopleIntro: '张翀老师负责指导，研究成员共 12 人；研二 6 人已确定，研一 6 个名额暂时保留。',
    piLabel: '导师',
    piIntro: '张翀老师负责研究小组，围绕油气井、嵌入式系统和 Agent 智能体方向开展研究与工程实践。',
    outputsSectionLabel: '代表成果',
    outputsSectionTitle: 'Outputs',
    projectTypeLabel: '项目',
    projectNote: '科研项目可在成果管理中维护排序。',
    awardTypeLabel: '获奖',
    awardWinnerPrefix: '获奖人：',
    awardEmptyWinner: '待录入',
    awardNote: '竞赛与荣誉展示。',
    toolsSectionLabel: '组内工具',
    toolsSectionTitle: 'Tools',
    toolsIntro: '所有工具都已经接入登录和权限判断。',
    toolCards: [
      { key: 'members', title: '成员管理', text: '管理实验室成员信息与权限。' },
      { key: 'outputs', title: '成果管理', text: '管理论文、专利、科研项目和获奖信息。' },
      { key: 'site', title: '站点内容', text: '修改首页标题、研究方向、联系邮箱和各区说明。' },
    ],
    contactSectionLabel: '联系',
    contactSectionTitle: 'Contact',
    contactTitle: '开放合作与学生加入',
    contactText: '如需交流合作或咨询加入研究小组，可通过张翀导师邮箱联系。',
    contactEmail: 'zhsngchong92@swpu.edu.cn',
    researchLines: [
      {
        title: '油气井',
        tag: '油气井',
        icon: 'network',
        tone: 'jade',
        text: '面向油气井生产、监测与诊断场景，研究井筒状态感知、数据建模和智能决策方法。',
      },
      {
        title: '嵌入式',
        tag: '嵌入式系统',
        icon: 'cpu',
        tone: 'blue',
        text: '围绕现场设备、边缘计算与实时控制，构建可部署、低功耗、稳定运行的嵌入式系统。',
      },
      {
        title: 'Agent',
        tag: '智能体',
        icon: 'bot',
        tone: 'clay',
        text: '探索智能体在实验规划、知识检索、代码生成、设备协同和组内工具自动化中的应用。',
      },
    ],
  }
}

function studentPermissions() {
  return {
    can_manage_members: false,
    can_view_all: false,
    can_export: false,
    can_delete_others: false,
    tool_access: [],
    password_required_tools: [],
  }
}

function superAdminPermissions() {
  return {
    can_manage_members: true,
    can_view_all: true,
    can_export: true,
    can_delete_others: true,
    tool_access: [...toolIds],
    password_required_tools: [...toolIds],
  }
}

function shouldKeepStudyInfoEmpty(member) {
  return (
    member?.id === 'm-admin' ||
    member?.id === 'm-teacher' ||
    member?.staff_id === 'admin' ||
    member?.staff_id === 'zhangchong'
  )
}

function normalizeStudyInfo(member) {
  if (!shouldKeepStudyInfoEmpty(member)) return
  member.grade = ''
  member.direction = ''
}

function memberProfileDefaults(member = {}) {
  return {
    phone: member.phone || '',
    email: member.email || '',
    wechat: member.wechat || '',
    qq: member.qq || '',
    photo: member.photo || '',
    bio: member.bio || '',
  }
}

function normalizeMemberProfile(member) {
  Object.assign(member, memberProfileDefaults(member))
}

function enforceCoreMemberIdentities(data) {
  const systemAdmin = data.members.find((item) => item.id === 'm-admin' || item.staff_id === 'admin')
  if (systemAdmin) {
    systemAdmin.name = 'admin'
    systemAdmin.staff_id = 'admin'
    if (!systemAdmin.password || systemAdmin.password === '666666' || systemAdmin.password === 'admin') {
      systemAdmin.password = ADMIN_PASSWORD
    }
    systemAdmin.role = 'superadmin'
    systemAdmin.grade = ''
    systemAdmin.direction = ''
    systemAdmin.visible_on_site = false
    systemAdmin.permissions = superAdminPermissions()
  }

  const zhangChong = data.members.find((item) => item.id === 'm-teacher' || item.name === '张翀' || item.staff_id === 'zhangchong')
  if (zhangChong) {
    zhangChong.name = '张翀'
    zhangChong.staff_id = 'zhangchong'
    if (!zhangChong.password) zhangChong.password = '666666'
    zhangChong.role = 'teacher'
    zhangChong.grade = ''
    zhangChong.direction = ''
    zhangChong.permissions = studentPermissions()
  }

  const zhouJian = data.members.find((item) => item.name === '周健' || item.staff_id === '202522000755')
  if (zhouJian) {
    zhouJian.name = '周健'
    zhouJian.staff_id = '202522000755'
    if (!zhouJian.password) zhouJian.password = ZHOU_JIAN_PASSWORD
    zhouJian.role = 'student'
    zhouJian.permissions = studentPermissions()
  }
}

function studentMember(id, name, staffId, grade, direction) {
  return {
    id,
    name,
    staff_id: staffId,
    password: '123456',
    role: 'student',
    grade,
    direction,
    status: 'active',
    visible_on_site: true,
    permissions: studentPermissions(),
    ...memberProfileDefaults(),
  }
}

function seedData() {
  const data = {
    meta: {
      dataVersion: DATA_VERSION,
      updatedAt: new Date().toISOString(),
    },
    site: defaultSiteContent(),
    rooms: [
      { id: 'room-a', name: 'A201 会议室', capacity: 12, enabled: true },
      { id: 'room-b', name: 'B305 讨论间', capacity: 6, enabled: true },
    ],
    members: [
      {
        id: 'm-admin',
        name: 'admin',
        staff_id: 'admin',
        password: ADMIN_PASSWORD,
        role: 'superadmin',
        grade: '',
        direction: '',
        status: 'active',
        visible_on_site: false,
        permissions: superAdminPermissions(),
        ...memberProfileDefaults(),
      },
      {
        id: 'm-teacher',
        name: '张翀',
        staff_id: 'zhangchong',
        password: '666666',
        role: 'teacher',
        grade: '',
        direction: '',
        status: 'active',
        visible_on_site: true,
        permissions: studentPermissions(),
        ...memberProfileDefaults(),
      },
      studentMember('m-student-zhoujian', '周健', '202522000755', '研二', '油气井'),
      studentMember('m-student-zhaodewei', '赵德伟', '20240002', '研二', '嵌入式'),
      studentMember('m-student-yanghuaiyu', '杨怀宇', '20240003', '研二', 'Agent'),
      studentMember('m-student-xiangyufei', '向与飞', '20240004', '研二', '油气井'),
      studentMember('m-student-wulingna', '巫玲娜', '20240005', '研二', '嵌入式'),
      studentMember('m-student-lihaifeng', '李海峰', '20240006', '研二', 'Agent'),
      studentMember('m-student-yanyi-01', '待定 01', '20250001', '研一', '待定'),
      studentMember('m-student-yanyi-02', '待定 02', '20250002', '研一', '待定'),
      studentMember('m-student-yanyi-03', '待定 03', '20250003', '研一', '待定'),
      studentMember('m-student-yanyi-04', '待定 04', '20250004', '研一', '待定'),
      studentMember('m-student-yanyi-05', '待定 05', '20250005', '研一', '待定'),
      studentMember('m-student-yanyi-06', '待定 06', '20250006', '研一', '待定'),
    ],
    pendingRegistrations: [],
    publications: [
      {
        id: 'pub-1',
        title: '工业视觉缺陷检测中的多尺度特征融合方法研究',
        authors: '负责人姓名, 研三成员, 研二成员',
        journal: 'Journal / Conference',
        pub_year: 2026,
        volume_issue: '12(3)',
        pages: '101-118',
        doi: '10.0000/demo.2026.001',
        pub_type: '论文',
        note: '代表性成果',
        sort_order: 1,
      },
      {
        id: 'pub-2',
        title: '面向多源工业数据的联邦学习系统',
        authors: '负责人姓名, 研二成员',
        journal: 'Engineering AI',
        pub_year: 2025,
        volume_issue: '',
        pages: '',
        doi: '',
        pub_type: '论文',
        note: '在研方向',
        sort_order: 2,
      },
    ],
    projects: [
      { id: 'proj-1', title: '面向能源现场的智能感知与预测系统', category: '纵向', sort_order: 1 },
      { id: 'proj-2', title: '工业设备视觉检测平台研发', category: '横向', sort_order: 2 },
    ],
    awards: [
      { id: 'award-1', title: '研究生创新实践竞赛一等奖', winner: '研究小组', sort_order: 1 },
    ],
    bookings: [
      {
        id: 'booking-1',
        room_id: 'room-a',
        member_id: 'm-student-zhoujian',
        date: todayString(),
        start_time: '09:00',
        end_time: '10:30',
        reason: '周会预演',
        created_at: new Date().toISOString(),
      },
    ],
    reimbursements: [
      {
        id: 'reimb-1',
        member_id: 'm-student-zhaodewei',
        amount: 268.5,
        reason: '实验耗材采购',
        file_names: ['receipt-demo.jpg'],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  }
  const zhouJian = data.members.find((item) => item.name === '周健')
  if (zhouJian) {
    zhouJian.staff_id = '202522000755'
    if (!zhouJian.password) zhouJian.password = ZHOU_JIAN_PASSWORD
    zhouJian.role = 'student'
    zhouJian.permissions = studentPermissions()
  }
  return data
}

function todayString() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

function migrateData(data) {
  const seeded = seedData()
  const needsUpgrade = Boolean(data.meta?.dataVersion && data.meta.dataVersion !== DATA_VERSION)
  data.site = {
    ...seeded.site,
    ...(data.site || {}),
    researchLines:
      Array.isArray(data.site?.researchLines) && data.site.researchLines.length > 0
        ? data.site.researchLines
        : seeded.site.researchLines,
  }
  for (const key of ['rooms', 'members', 'pendingRegistrations', 'publications', 'projects', 'awards', 'bookings', 'reimbursements']) {
    if (!Array.isArray(data[key])) data[key] = seeded[key]
  }
  for (const member of data.members) {
    const isAdminMember = member.role === 'superadmin' || member.permissions?.can_manage_members
    if (!member.password) member.password = isAdminMember ? '666666' : '123456'
    normalizeMemberProfile(member)
    normalizeStudyInfo(member)
  }
  enforceCoreMemberIdentities(data)
  if (needsUpgrade) {
    const systemAdmin = data.members.find((item) => item.id === 'm-admin' || item.staff_id === 'system-admin')
    if (systemAdmin) {
      systemAdmin.name = 'admin'
      systemAdmin.staff_id = 'admin'
      if (!systemAdmin.password || systemAdmin.password === '666666' || systemAdmin.password === 'admin') {
        systemAdmin.password = ADMIN_PASSWORD
      }
      systemAdmin.role = 'superadmin'
      systemAdmin.grade = ''
      systemAdmin.direction = ''
      systemAdmin.visible_on_site = false
      systemAdmin.permissions = superAdminPermissions()
    }
    if (
      data.site.groupName === '智能视觉与机器学习研究小组' ||
      data.site.groupName === '402张翀研究小组' ||
      data.site.groupName === '402zhangchong' ||
      !data.site.groupName
    ) {
      data.site.groupName = '张翀研究小组'
    }
    if (
      data.site.heroTitle === '智能视觉与机器学习研究小组' ||
      data.site.heroTitle === '402张翀研究小组' ||
      data.site.heroTitle === '402zhangchong' ||
      !data.site.heroTitle
    ) {
      data.site.heroTitle = '张翀研究小组'
    }
    if (
      data.site.heroLede?.startsWith('A compact research group') ||
      !data.site.heroLede
    ) {
      data.site.heroLede = seeded.site.heroLede
    }
    if (
      data.site.brandTagline === 'Oil & Gas Wells · Embedded · Agent' ||
      !data.site.brandTagline
    ) {
      data.site.brandTagline = seeded.site.brandTagline
    }
    if (
      data.site.visualLabel === 'Research Stack' ||
      !data.site.visualLabel
    ) {
      data.site.visualLabel = seeded.site.visualLabel
    }
    if (
      data.site.visualStack === 'Oil & Gas Wells / Embedded / Agent' ||
      !data.site.visualStack
    ) {
      data.site.visualStack = seeded.site.visualStack
    }
    if (
      data.site.researchIntro?.startsWith('Three focused directions') ||
      !data.site.researchIntro
    ) {
      data.site.researchIntro = seeded.site.researchIntro
    }
    if (
      data.site.peopleIntro === '教师及在读研究生按身份组织，成员状态和首页展示开关可在成员管理中维护。' ||
      data.site.peopleIntro?.startsWith('Led by Zhang Chong') ||
      !data.site.peopleIntro
    ) {
      data.site.peopleIntro = seeded.site.peopleIntro
    }
    if (
      data.site.piIntro === '请替换为真实导师简介、教育经历和主要研究方向。这里适合放 2 到 3 句话，简洁但有分量。' ||
      data.site.piIntro?.startsWith('Zhang Chong leads') ||
      !data.site.piIntro
    ) {
      data.site.piIntro = seeded.site.piIntro
    }
    if (
      data.site.toolsIntro?.startsWith('Internal tools') ||
      data.site.toolsIntro === '所有工具都已经接入登录和权限判断。默认演示账号为 admin / admin。' ||
      data.site.toolsIntro === '所有工具都已经接入登录和权限判断。张翀管理员账号为 admin / 666666。' ||
      !data.site.toolsIntro
    ) {
      data.site.toolsIntro = seeded.site.toolsIntro
    }
    if (
      data.site.contactTitle === 'Collaboration and Joining' ||
      !data.site.contactTitle
    ) {
      data.site.contactTitle = seeded.site.contactTitle
    }
    if (
      data.site.contactText?.startsWith('Contact information') ||
      data.site.contactText === '学院、办公室、邮箱和招生要求可以在这里替换为真实信息。上线前建议补充导师照片、团队合影和近三年代表性成果。' ||
      !data.site.contactText
    ) {
      data.site.contactText = seeded.site.contactText
    }
    if (
      data.site.contactEmail === 'lab@example.edu.cn' ||
      !data.site.contactEmail
    ) {
      data.site.contactEmail = seeded.site.contactEmail
    }
    if (data.site.researchLines?.some((item) => item.title === 'Oil & Gas Wells' || item.title === 'Embedded Systems')) {
      data.site.researchLines = seeded.site.researchLines
    }
    const targetNames = ['张翀', '周健', '赵德伟', '杨怀宇', '向与飞', '巫玲娜', '李海峰']
    const hasTargetMembers = targetNames.every((name) => data.members.some((item) => item.name === name))
    const visibleStudentCount = data.members.filter(
      (item) => item.role === 'student' && item.visible_on_site && item.status === 'active',
    ).length
    const hasEnglishMembers = data.members.some((item) =>
      ['Zhou Jian', 'Zhao Dewei', 'Yang Huaiyu', 'Xiang Yufei', 'Wu Lingna', 'Li Haifeng'].includes(item.name),
    )
    if (!hasTargetMembers || visibleStudentCount < 12 || hasEnglishMembers) {
      const seededMembers = seeded.members.filter((item) => item.id !== 'm-admin')
      data.members = [
        ...data.members.filter((item) => item.id === 'm-admin'),
        ...seededMembers,
      ]
      data.bookings = seeded.bookings
      data.reimbursements = seeded.reimbursements
    }
    for (const name of ['张翀', '周健']) {
      const member = data.members.find((item) => item.name === name)
      if (member) {
        if (name === '张翀') member.staff_id = 'zhangchong'
        if (name === '周健') member.staff_id = '202522000755'
        if (name === '张翀') normalizeStudyInfo(member)
        if (name === '周健') member.role = 'student'
        if (!member.password) member.password = name === '周健' ? ZHOU_JIAN_PASSWORD : '666666'
        member.permissions = studentPermissions()
      }
    }
  }
  enforceCoreMemberIdentities(data)
  data.meta = {
    ...(data.meta || {}),
    dataVersion: DATA_VERSION,
    updatedAt: data.meta?.updatedAt || '',
  }
  return data
}

function loadData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const data = raw ? migrateData(JSON.parse(raw)) : seedData()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return data
  } catch {
    return seedData()
  }
}

const state = reactive(loadData())
const session = reactive({
  memberId: window.localStorage.getItem(SESSION_KEY) || '',
})
const cloud = reactive({
  enabled: sharedStateEnabled,
  loading: false,
  ready: !sharedStateEnabled,
  error: '',
  lastSavedAt: '',
})

let cloudSaveTimer = 0

function save() {
  state.meta = {
    ...(state.meta || {}),
    dataVersion: DATA_VERSION,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  queueCloudSave()
}

function cloneState() {
  return JSON.parse(JSON.stringify(state))
}

function replaceState(nextData) {
  const migrated = migrateData(nextData)
  for (const key of Object.keys(state)) delete state[key]
  Object.assign(state, migrated)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  if (session.memberId && !state.members.some((item) => item.id === session.memberId)) {
    setSession('')
  }
}

function stateUpdatedTime(data, fallback = '') {
  return Date.parse(data?.meta?.updatedAt || fallback || '') || 0
}

function queueCloudSave() {
  if (!sharedStateEnabled || cloud.loading) return
  window.clearTimeout(cloudSaveTimer)
  cloudSaveTimer = window.setTimeout(async () => {
    const result = await saveSharedState(cloneState())
    if (result.ok) {
      cloud.error = ''
      cloud.lastSavedAt = new Date().toISOString()
    } else {
      cloud.error = result.message
    }
  }, 300)
}

function setSession(memberId) {
  session.memberId = memberId
  if (memberId) window.localStorage.setItem(SESSION_KEY, memberId)
  else window.localStorage.removeItem(SESSION_KEY)
}

function bySortOrder(a, b) {
  return (a.sort_order || 0) - (b.sort_order || 0)
}

export function useLabStore() {
  const currentMember = computed(() => state.members.find((item) => item.id === session.memberId) || null)
  const siteMembers = computed(() =>
    state.members.filter((item) => item.visible_on_site && item.status === 'active' && item.staff_id !== 'admin'),
  )
  const sortedPublications = computed(() => [...state.publications].sort(bySortOrder))
  const sortedProjects = computed(() => [...state.projects].sort(bySortOrder))
  const sortedAwards = computed(() => [...state.awards].sort(bySortOrder))

  async function syncSharedState() {
    if (!sharedStateEnabled || cloud.loading) return
    cloud.loading = true
    cloud.error = ''
    const result = await fetchSharedState()
    if (result.ok && result.data) {
      const localSnapshot = cloneState()
      const remoteData = migrateData(result.data)
      const localTime = stateUpdatedTime(localSnapshot)
      const remoteTime = stateUpdatedTime(remoteData, result.updatedAt)
      if (remoteTime > localTime) {
        replaceState(remoteData)
        const saveResult = await saveSharedState(cloneState())
        if (saveResult.ok) {
          cloud.error = ''
          cloud.lastSavedAt = new Date().toISOString()
        } else {
          cloud.error = saveResult.message
        }
      } else if (localTime > remoteTime) {
        const saveResult = await saveSharedState(localSnapshot)
        if (saveResult.ok) {
          cloud.error = ''
          cloud.lastSavedAt = new Date().toISOString()
        } else {
          cloud.error = saveResult.message
        }
      }
    } else if (result.ok && !result.data) {
      const seedResult = await saveSharedState(cloneState())
      if (!seedResult.ok) cloud.error = seedResult.message
    } else {
      cloud.error = result.message
    }
    cloud.loading = false
    cloud.ready = true
  }

  function login(staffId, password) {
    const member = state.members.find((item) => item.staff_id === staffId.trim())
    if (!member) return { ok: false, message: '账号或密码不正确' }
    if (member.password !== password) return { ok: false, message: '账号或密码不正确' }
    setSession(member.id)
    return { ok: true, member }
  }

  function logout() {
    setSession('')
  }

  function changePassword(oldPassword, newPassword) {
    if (!currentMember.value) return { ok: false, message: '请先登录' }
    if (currentMember.value.password !== oldPassword) return { ok: false, message: '旧密码不正确' }
    currentMember.value.password = newPassword
    save()
    return { ok: true }
  }

  function registerMember(payload) {
    const staffId = payload.staff_id.trim()
    if (state.members.some((item) => item.staff_id === staffId)) {
      return { ok: false, message: '账号已存在' }
    }
    if (state.pendingRegistrations.some((item) => item.staff_id === staffId)) {
      return { ok: false, message: '该账号正在等待审批' }
    }
    state.pendingRegistrations.push({
      id: uid('registration'),
      name: payload.name.trim(),
      staff_id: staffId,
      password: payload.password,
      grade: payload.grade,
      direction: payload.direction.trim(),
      created_at: new Date().toISOString(),
    })
    save()
    return { ok: true }
  }

  function approveRegistration(id) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无审批权限' }
    const index = state.pendingRegistrations.findIndex((item) => item.id === id)
    if (index < 0) return { ok: false, message: '申请不存在' }
    const record = state.pendingRegistrations[index]
    if (state.members.some((item) => item.staff_id === record.staff_id)) {
      state.pendingRegistrations.splice(index, 1)
      save()
      return { ok: false, message: '账号已存在' }
    }
    state.members.push({
      id: uid('member'),
      name: record.name,
      staff_id: record.staff_id,
      password: record.password,
      role: 'student',
      grade: record.grade,
      direction: record.direction,
      status: 'active',
      visible_on_site: false,
      permissions: studentPermissions(),
      ...memberProfileDefaults(record),
    })
    state.pendingRegistrations.splice(index, 1)
    save()
    return { ok: true }
  }

  function rejectRegistration(id) {
    if (!isSuperAdmin()) return
    const index = state.pendingRegistrations.findIndex((item) => item.id === id)
    if (index >= 0) {
      state.pendingRegistrations.splice(index, 1)
      save()
    }
  }

  function isSuperAdmin(member = currentMember.value) {
    return Boolean(member?.staff_id === 'admin' && member?.permissions?.can_manage_members)
  }

  function canManageSite() {
    return isSuperAdmin()
  }

  function hasTool(toolId, member = currentMember.value) {
    if (!member) return false
    if (toolId === 'profile') return true
    return isSuperAdmin(member) || member.permissions?.tool_access?.includes(toolId)
  }

  function canViewAll(member = currentMember.value) {
    return Boolean(isSuperAdmin(member) || member?.permissions?.can_view_all)
  }

  function canExport(member = currentMember.value) {
    return Boolean(isSuperAdmin(member) || member?.permissions?.can_export)
  }

  function canDeleteOthers(member = currentMember.value) {
    return Boolean(isSuperAdmin(member) || member?.permissions?.can_delete_others)
  }

  function addBooking(payload) {
    if (!currentMember.value) return { ok: false, message: '请先登录' }
    if (!payload.date || !payload.room_id || !payload.start_time || !payload.end_time || !payload.reason.trim()) {
      return { ok: false, message: '请填写所有必填字段' }
    }
    if (payload.end_time <= payload.start_time) return { ok: false, message: '结束时间必须大于开始时间' }
    const conflict = state.bookings.some(
      (item) =>
        item.room_id === payload.room_id &&
        item.date === payload.date &&
        payload.start_time < item.end_time &&
        payload.end_time > item.start_time,
    )
    if (conflict) return { ok: false, message: '该时段已有预约' }
    state.bookings.push({
      id: uid('booking'),
      room_id: payload.room_id,
      member_id: currentMember.value.id,
      date: payload.date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      reason: payload.reason.trim(),
      created_at: new Date().toISOString(),
    })
    save()
    return { ok: true }
  }

  function deleteBooking(id) {
    const index = state.bookings.findIndex((item) => item.id === id)
    if (index < 0) return
    const item = state.bookings[index]
    if (item.member_id !== currentMember.value?.id && !canDeleteOthers()) return
    state.bookings.splice(index, 1)
    save()
  }

  function addReimbursement(payload) {
    const amount = Number(payload.amount)
    if (!currentMember.value) return { ok: false, message: '请先登录' }
    if (!payload.reason.trim() || !amount || amount <= 0) return { ok: false, message: '请输入有效的报销金额和事由' }
    state.reimbursements.push({
      id: uid('reimb'),
      member_id: currentMember.value.id,
      amount,
      reason: payload.reason.trim(),
      file_names: payload.file_names || [],
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    save()
    return { ok: true }
  }

  function updateReimbursementStatus(id, status) {
    const item = state.reimbursements.find((record) => record.id === id)
    if (!item || !canViewAll()) return
    item.status = status
    item.updated_at = new Date().toISOString()
    save()
  }

  function deleteReimbursement(id) {
    const index = state.reimbursements.findIndex((item) => item.id === id)
    if (index < 0) return
    const item = state.reimbursements[index]
    if (item.member_id !== currentMember.value?.id && !canDeleteOthers()) return
    state.reimbursements.splice(index, 1)
    save()
  }

  function upsertMember(payload) {
    if (!currentMember.value) return { ok: false, message: '请先登录' }
    const existing = state.members.find((item) => item.id === payload.id)
    const isAdminEditing = isSuperAdmin()
    if (!isAdminEditing) {
      if (!existing || existing.id !== currentMember.value.id) return { ok: false, message: '暂无权限' }
      existing.name = payload.name?.trim() || existing.name
      if (!shouldKeepStudyInfoEmpty(existing)) {
        existing.grade = payload.grade || ''
        existing.direction = payload.direction?.trim() || ''
      }
      existing.phone = payload.phone?.trim() || ''
      existing.email = payload.email?.trim() || ''
      existing.wechat = payload.wechat?.trim() || ''
      existing.qq = payload.qq?.trim() || ''
      existing.photo = payload.photo || ''
      existing.bio = payload.bio?.trim() || ''
      save()
      return { ok: true }
    }
    const emptyStudyInfo = shouldKeepStudyInfoEmpty(payload)
    const base = {
      name: payload.name.trim(),
      staff_id: payload.staff_id.trim(),
      role: payload.role,
      grade: emptyStudyInfo ? '' : payload.grade,
      direction: emptyStudyInfo ? '' : payload.direction.trim(),
      status: payload.status,
      visible_on_site: Boolean(payload.visible_on_site),
      permissions: payload.permissions,
      phone: payload.phone?.trim() || '',
      email: payload.email?.trim() || '',
      wechat: payload.wechat?.trim() || '',
      qq: payload.qq?.trim() || '',
      photo: payload.photo || '',
      bio: payload.bio?.trim() || '',
    }
    if (base.staff_id !== 'admin') {
      if (base.role === 'superadmin') base.role = base.staff_id === 'zhangchong' ? 'teacher' : 'student'
      base.permissions = studentPermissions()
    }
    if (existing) {
      Object.assign(existing, base)
      if (currentMember.value?.staff_id === 'admin' && payload.newPassword?.trim()) {
        existing.password = payload.newPassword.trim()
      }
    } else {
      state.members.push({
        id: uid('member'),
        password: payload.newPassword?.trim() || '123456',
        ...memberProfileDefaults(),
        ...base,
      })
    }
    save()
    return { ok: true }
  }

  function removeMember(id) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    if (id === currentMember.value?.id) return
    const index = state.members.findIndex((item) => item.id === id)
    if (index >= 0) {
      state.members.splice(index, 1)
      save()
    }
    return { ok: true }
  }

  function upsertOutput(kind, payload) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    const list = state[kind]
    if (!Array.isArray(list)) return { ok: false, message: '数据类型不存在' }
    const existing = list.find((item) => item.id === payload.id)
    if (existing) {
      if (payload.sort_order === undefined) delete payload.sort_order
      Object.assign(existing, payload)
    } else {
      list.push({
        ...payload,
        id: uid(kind),
        sort_order: list.length + 1,
      })
    }
    save()
    return { ok: true }
  }

  function removeOutput(kind, id) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    const list = state[kind]
    if (!Array.isArray(list)) return { ok: false, message: '数据类型不存在' }
    const index = list.findIndex((item) => item.id === id)
    if (index >= 0) {
      list.splice(index, 1)
      list.forEach((item, order) => {
        item.sort_order = order + 1
      })
      save()
    }
    return { ok: true }
  }

  function moveOutputUp(kind, id) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    if (!Array.isArray(state[kind])) return { ok: false, message: '数据类型不存在' }
    const list = state[kind].sort(bySortOrder)
    const index = list.findIndex((item) => item.id === id)
    if (index <= 0) return { ok: false, message: '无法上移' }
    const current = list[index]
    const previous = list[index - 1]
    const order = current.sort_order
    current.sort_order = previous.sort_order
    previous.sort_order = order
    save()
    return { ok: true }
  }

  function updateSiteContent(payload) {
    if (!canManageSite()) return { ok: false, message: '暂无权限' }
    const nextResearchLines = Array.isArray(payload.researchLines) ? payload.researchLines : state.site.researchLines
    const nextToolCards = Array.isArray(payload.toolCards) ? payload.toolCards : state.site.toolCards
    state.site = {
      ...state.site,
      ...payload,
      researchLines: nextResearchLines.map((item) => ({
        title: item.title.trim(),
        tag: item.tag.trim(),
        icon: item.icon,
        tone: item.tone,
        text: item.text.trim(),
      })),
      toolCards: nextToolCards.map((item) => ({
        key: item.key,
        title: item.title.trim(),
        text: item.text.trim(),
      })),
    }
    save()
    return { ok: true }
  }

  function resetDemoData() {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    Object.assign(state, seedData())
    save()
    return { ok: true }
  }

  return {
    state,
    session,
    cloud,
    toolIds,
    currentMember,
    siteMembers,
    sortedPublications,
    sortedProjects,
    sortedAwards,
    syncSharedState,
    login,
    logout,
    changePassword,
    registerMember,
    approveRegistration,
    rejectRegistration,
    isSuperAdmin,
    hasTool,
    canViewAll,
    canExport,
    canDeleteOthers,
    addBooking,
    deleteBooking,
    addReimbursement,
    updateReimbursementStatus,
    deleteReimbursement,
    upsertMember,
    removeMember,
    upsertOutput,
    removeOutput,
    moveOutputUp,
    updateSiteContent,
    resetDemoData,
    todayString,
  }
}
