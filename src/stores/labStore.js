import { computed, reactive } from 'vue'
import deploymentPreviewSnapshot from '../data/deploymentPreviewSnapshot.json'
import { fetchSharedState, saveSharedState, sharedStateEnabled } from '../lib/cloudState'

const STORAGE_KEY = 'lab-site-vue-store-v1'
const SESSION_KEY = 'lab-site-vue-session-v1'
const DATA_VERSION = 'profile-2026-v1'
const PROFILE_DATA_VERSION = 'profile-2026-v2'
const CONTENT_DATA_VERSION = 'profile-content-2026-v1'
const PROJECTS_DATA_VERSION = 'research-projects-2026-v1'
const IS_LOCAL_PREVIEW = import.meta.env.DEV && import.meta.env.VITE_LOCAL_PREVIEW_ONLY === 'true'
const ADMIN_PASSWORD = 'admin666'
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
    navMentorLabel: '导师信息',
    navPeopleLabel: '成员',
    navOutputsLabel: '成果',
    navToolsLabel: '工具',
    navContactLabel: '联系',
    heroKicker: '',
    heroTitle: '张翀研究小组',
    heroLede:
      '张翀，工学博士（后）、特聘副研究员、硕士生导师。研究聚焦大模型搜索加速、高效智能系统、低功耗物联网与边端智能，面向油气能源和智能检测开展系统验证。',
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
    peopleSectionTitle: 'Members',
    peopleIntro: '',
    piLabel: '导师',
    piIntro: '张翀，中共党员，工学博士（后），西南石油大学计算机与软件学院特聘副研究员、硕士生导师。现任四川省人工智能学会理事、ACM SIGBED China 执行委员、ACM/CCF 专业会员，担任 CCF 物联网、分布式计算与系统、计算机安全专委会委员，四川省油气勘探开发智能化工程研究中心骨干。担任 HPCA 程序委员会委员及 IEEE Transactions on Mobile Computing 审稿人。发表论文 50 余篇，其中 CCF-A 类期刊及会议论文 13 篇、TOP CCF-B 类论文 6 篇；申请发明及实用新型专利近 40 项，出版科研著作 2 部，获省部级科技进步一等奖、技术发明一等奖等科技奖励。主持四川省科技厅青年基金、油气藏地质及开发工程全国重点实验室开放基金等项目，并参与国家科技重大专项、国家自然科学基金及国家重点研发计划。',
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
    ],
    contactSectionLabel: '联系',
    contactSectionTitle: 'Contact',
    contactTitle: '开放合作与学生加入',
    contactText: '如需交流合作或咨询加入研究小组，可通过张翀导师邮箱联系。',
    contactEmail: 'zhangchong92@swpu.edu.cn',
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

function hasBrokenQuestionMarks(value) {
  return typeof value === 'string' && /\?{2,}/.test(value)
}

function defaultAwardImage(itemId) {
  const imageMap = {
    'award-2025-kjjb-1': '/awards/award-2025-kjjb-1.jpg?v=20260824',
    'award-2025-kjjb-2': '/awards/award-2025-kjjb-2.jpg?v=20260824',
    'award-2025-fmzl': '/awards/award-2025-fmzl.jpg?v=20260824',
    'award-2024-jsfm-2': '/awards/award-2024-jsfm-2.jpg?v=20260824',
    'award-2024-kjjb-2': '/awards/award-2024-kjjb-2.jpg?v=20260824',
    'award-2023-jsfm-1': '/awards/award-2023-jsfm-1.jpg?v=20260824',
    'award-2023-kjjb-2': '/awards/award-2023-kjjb-2.jpg?v=20260824',
  }
  return imageMap[itemId] || ''
}

function normalizeOutputAssets(data, seeded, repairLegacyText = false) {
  const seededAwards = new Map(seeded.awards.map((item) => [item.id, item]))

  for (const item of data.publications) {
    item.paper_link = typeof item.paper_link === 'string' ? item.paper_link.trim() : ''
    if (repairLegacyText && hasBrokenQuestionMarks(item.title)) item.title = ''
    for (const field of ['authors', 'journal', 'volume_issue', 'pages', 'doi', 'note']) {
      if (repairLegacyText && hasBrokenQuestionMarks(item[field])) item[field] = ''
    }
  }

  for (const item of data.awards) {
    item.image_data = typeof item.image_data === 'string' ? item.image_data : ''
    item.image_url = typeof item.image_url === 'string' ? item.image_url.trim() : ''
    item.image_name = typeof item.image_name === 'string' ? item.image_name : ''
    const bundledImage = defaultAwardImage(item.id)
    if (repairLegacyText && bundledImage && !item.image_data && !item.image_url) {
      item.image_url = bundledImage
    }
    if (!item.image_name && item.image_url) item.image_name = `${item.id}.jpg`
    if (repairLegacyText && hasBrokenQuestionMarks(item.title)) item.title = seededAwards.get(item.id)?.title || ''
    if (repairLegacyText && hasBrokenQuestionMarks(item.winner)) item.winner = seededAwards.get(item.id)?.winner || ''
  }

  for (const [field, fallback] of Object.entries(seeded.site)) {
    if (repairLegacyText && typeof fallback === 'string' && hasBrokenQuestionMarks(data.site[field])) {
      data.site[field] = fallback
    }
  }
}

function memberProfileDefaults(member = {}) {
  return {
    phone: member.phone || '',
    email: member.email || '',
    wechat: member.wechat || '',
    qq: member.qq || '',
    photo: member.photo || '',
    bio: member.bio || '',
    achievements: Array.isArray(member.achievements)
      ? member.achievements.map((item) => ({
          id: item.id || uid('achievement'),
          title: item.title || '',
          type: item.type || '',
          year: item.year || '',
          description: item.description || '',
          link: item.link || '',
        }))
      : [],
  }
}

function normalizeMemberProfile(member) {
  Object.assign(member, memberProfileDefaults(member))
}

function ensureDoctoralStudent(data) {
  const doctoralMembers = data.members.filter((member) => member.grade === '博士')
  if (doctoralMembers.length > 1) {
    for (const member of doctoralMembers.slice(1)) {
      member.grade = '研一'
    }
  }
  if (doctoralMembers.length > 0) return
  const candidate =
    data.members.find((member) => member.id === 'm-student-yanyi-01') ||
    data.members.find((member) => member.staff_id === '20250001') ||
    data.members.find((member) => member.name === '待定 01')
  if (!candidate) return
  candidate.name = candidate.name?.startsWith('待定') ? '博士生' : candidate.name || '博士生'
  candidate.grade = '博士'
  if (!candidate.direction) candidate.direction = '待定'
}

function hasDoctoralStudentConflict(members, memberId, grade, role = 'student') {
  if (grade !== '博士' || role !== 'student') return false
  return members.some((member) => member.id !== memberId && member.role === 'student' && member.grade === '博士')
}

function isValidGraduationYear(value) {
  const year = String(value ?? '').trim()
  return /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= new Date().getFullYear()
}

function enforceCoreMemberIdentities(data) {
  const systemAdmin = data.members.find((item) => item.id === 'm-admin' || item.staff_id === 'admin')
  if (systemAdmin) {
    systemAdmin.name = 'admin'
    systemAdmin.staff_id = 'admin'
    if (!systemAdmin.password) systemAdmin.password = ADMIN_PASSWORD
    systemAdmin.role = 'superadmin'
    systemAdmin.grade = ''
    systemAdmin.direction = ''
    systemAdmin.visible_on_site = false
    systemAdmin.permissions = superAdminPermissions()
  }

  const zhangChong = data.members.find((item) => item.id === 'm-teacher' || item.name === '张翀' || item.staff_id === 'zhangchong')
  if (zhangChong) {
    zhangChong.staff_id = 'zhangchong'
    if (!zhangChong.password) zhangChong.password = '666666'
    zhangChong.role = 'teacher'
    zhangChong.grade = ''
    zhangChong.direction = ''
    if (!zhangChong.email || zhangChong.email === 'zhsngchong92@swpu.edu.cn') zhangChong.email = 'zhangchong92@swpu.edu.cn'
    zhangChong.permissions = studentPermissions()
  }

  const zhouJian = data.members.find((item) => item.name === '周健' || item.staff_id === '202522000755')
  if (zhouJian) {
    zhouJian.staff_id = '202522000755'
    if (!zhouJian.password) zhouJian.password = ZHOU_JIAN_PASSWORD
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

function defaultMentorPublications() {
  const paper = (id, title, authors, journal, pubYear, paperLink, sortOrder, visibleOnHome = false, doi = '') => ({
    id,
    title,
    authors,
    journal,
    pub_year: pubYear,
    volume_issue: '',
    pages: '',
    doi,
    paper_link: paperLink,
    pub_type: '论文',
    note: '导师论文成果',
    visible_on_home: visibleOnHome,
    sort_order: sortOrder,
  })

  return [
    paper(
      'mentor-paper-asplos-lego-2023',
      'LEGO: Empowering Chip-level Functionality Plug-and-play for Next-generation IoT devices',
      'Chong Zhang, Songfan Li, Yihang Song, Qianhe Meng, Minghua Chen, YanXu Bai, Li Lu, Hongzi Zhu',
      'ASPLOS 2023',
      2023,
      '',
      1,
      true,
    ),
    paper(
      'mentor-paper-ieee-tc-2023',
      'A Lightweight and Chip-Level Reconfigurable Architecture for Next-Generation IoT End Devices',
      'Chong Zhang, Songfan Li, Yihang Song, Qianhe Meng, Li Lu, Hongzi Zhu, Xin Wang',
      'IEEE Transactions on Computers',
      2023,
      'https://ieeexplore.ieee.org/document/10360380',
      2,
      true,
      '10.1109/TC.2023.3343094',
    ),
    paper(
      'mentor-paper-ectc-tmc',
      'ECTC: A Game-Theoretic Framework for Energy-Communication-Computation Coupled Optimization in Battery-Free Sensor Networks',
      'Chong Zhang, Binxu Wang, Jiayuan Zhang, Sheng He, Xiao Zhang, Xiuying Dong, Haifeng Li, Xingjie Zeng',
      'IEEE Transactions on Mobile Computing',
      '',
      '',
      3,
      true,
    ),
    paper(
      'mentor-paper-lego-plus-2025',
      'LEGO+: Redefining the Redundancy Removal for IoT Sensing Edge-End Systems',
      'Chong Zhang, Han Wang, Qianhe Meng, Yize Zhao, Yihang Song, Kanglin Xu, Jinzhe Li, Li Lu',
      'ACM MobiSys 2025',
      2025,
      'https://doi.org/10.1145/3711875.3729126',
      4,
      true,
      '10.1145/3711875.3729126',
    ),
    paper(
      'mentor-paper-muman-sensys-2026',
      'μMan: Towards Device-Agnostic Power Management for Battery-free IoT',
      'Chong Zhang, Han Wang, Qianhe Meng, Yizhe Zhao, Shengyu Li, Songfan Li, Zetao Gao, Li Lu, Hongzi Zhu',
      'ACM/IEEE SenSys 2026',
      2026,
      '',
      5,
      true,
    ),
    paper(
      'mentor-paper-virtual-sensing-2024',
      'A Reliable Virtual Sensing Architecture with Zero Additional Deployment Costs for SHM Systems',
      'Chong Zhang, Ke Lei, Xin Shi, Yang Wang, Ting Wang, Xin Wang, Lihu Zhou, Chuanhui Zhang, Xingjie Zeng',
      'IEEE Sensors Journal',
      2024,
      'https://doi.org/10.1109/JSEN.2024.3474678',
      6,
      true,
      '10.1109/JSEN.2024.3474678',
    ),
    paper(
      'mentor-paper-fast-sensors-2024',
      'FAST: A Ubiquitous Inference Computation Model for Temperature and Humidity Sensing',
      'Chong Zhang, Ke Lei, Xin Shi, Yang Wang, Xin Wang, Chuanhui Zhang, Lihu Zhou, Yan Chen, Hongjun Zhu',
      'IEEE Sensors Journal',
      2024,
      'https://doi.org/10.1109/JSEN.2024.3499359',
      7,
      true,
      '10.1109/JSEN.2024.3499359',
    ),
    paper(
      'mentor-paper-energy-encryption-cn',
      '能量匮乏物联网传感系统安全加密关键技术研究',
      '王杨, 石鑫, 杨怀宇, 巫玲娜, 董秋英, 张翀',
      '中文核心期刊 / CSCD / CCF-T3',
      '',
      '',
      8,
    ),
    paper(
      'mentor-paper-butterfly-2022',
      'Butterfly: μW Level ULP Sensor Nodes with High Task Throughput',
      'Chong Zhang, Li Lu, Yihang Song, Qianhe Meng, Junqin Zhang, Xiandong Shao, Guangyuan Zhang, Mengshu Hou',
      'Sensors',
      2022,
      'https://doi.org/10.3390/s22083082',
      9,
      false,
      '10.3390/s22083082',
    ),
    paper(
      'mentor-paper-adaptive-encryption-cn',
      '能量匮乏传感节点自适应加密架构',
      '张翀, 张传辉, 张骏, 张晓坤, 王欣, 杨迅',
      '计算机应用',
      '',
      '',
      10,
    ),
    paper(
      'mentor-paper-passive-energy-management-cn',
      '无源节点能量管理关键技术',
      '张翀, 侯孟书, 鲁力',
      '计算机应用研究',
      2023,
      '',
      11,
    ),
    paper(
      'mentor-paper-wireless-bus-iot-cn',
      '无线总线物联网边端体系——终端架构',
      '张翀, 鲁力',
      '中国计算机学会通讯（CCCF）',
      2023,
      '',
      12,
    ),
    paper(
      'mentor-paper-hm-fw-scheduling-2025',
      'A Spatiotemporal Correlation-Based Low-Power Task Scheduling and Anomaly Detection for HM-FW Sensing Systems',
      'Chong Zhang, Xiuying Dong, Feng Wei, Yuanshu Zou, Lihu Zhou, Chao Zhou, Yang Wang',
      'IEEE Sensors Journal',
      2025,
      'https://doi.org/10.1109/JSEN.2025.3558221',
      13,
      false,
      '10.1109/JSEN.2025.3558221',
    ),
    paper(
      'mentor-paper-molecular-prediction-2026',
      'Synergistic coupling resolves the scale dilemma: Hierarchical atom-motif guidance for function-aware molecular prediction',
      'Xingjie Zeng, Bin Xiong, Shuai Wang, Yang Wang, Xin Wang, Chong Zhang, Hans-Arno Jacobsen, Jianchun Guo, Cheng Zhong',
      'Expert Systems with Applications',
      2026,
      'https://doi.org/10.1016/j.eswa.2026.132735',
      14,
      false,
      '10.1016/j.eswa.2026.132735',
    ),
    paper(
      'mentor-paper-mtlt-2026',
      'MTLT: A logging reservoir parameter prediction method based on Multi-task learning-Transformer',
      'Chao Xu, Yan Chen, Juan Wang, Chong Zhang, Peng Chen',
      'Journal of Applied Geophysics',
      2026,
      'https://doi.org/10.1016/j.jappgeo.2026.106236',
      15,
      false,
      '10.1016/j.jappgeo.2026.106236',
    ),
    paper(
      'mentor-paper-data-integrity-shm',
      'A high-accuracy cross-device data integrity framework for trustworthy SHM sensing',
      'Yang Wang, Xin Shi, Sheng He, Binxu Wang, Chong Zhang, Yingjie Ren, Jing Lin, Xueliang Guo, Zhuang Deng',
      'IEEE Sensors Journal',
      '',
      '',
      16,
    ),
    paper(
      'mentor-paper-cbla-ijcnn-2024',
      'CBLA: Empowering Virtual Sensor Nodes with Zero Deployment Costs for SHM Systems',
      'Yang Wang, Ke Lei, Chong Zhang, Xin Wang, Xin Shi, Aihua Deng',
      'IJCNN 2024',
      2024,
      '',
      17,
    ),
    paper(
      'mentor-paper-eect-2025',
      'Empowering Adaptive Endogenous Security Trend Prediction Detection for IoT Sensor Nodes',
      'Lihu Zhou, Xiuying Dong, Enli Zhang, Ting Wang, Xiao Zhang, Chong Zhang',
      'IEEE EECT 2025',
      2025,
      '',
      18,
    ),
    paper(
      'mentor-paper-cfcst-ijcnn',
      'CFCST: A Cost-Efficient Spatio-Temporal Coupling Architecture for Multi-Task SHM Systems',
      'Qingzheng Hu, Ningrong Lai, Yuansu Zou, Deshinta Arrova Dewi, Siti Sarah Maidin, Luobing Pan, Chong Zhang',
      'IJCNN',
      '',
      '',
      19,
    ),
    paper(
      'mentor-paper-biotouch-2022',
      'BioTouch: Reliable Re-Authentication via Finger Bio-Capacitance and Touching Behavior',
      'Chong Zhang, Songfan Li, Yihang Song, Qianhe Meng, Li Lu, Mengshu Hou',
      'Sensors',
      2022,
      'https://doi.org/10.3390/s22093583',
      20,
      false,
      '10.3390/s22093583',
    ),
    paper(
      'mentor-paper-touchsense-2020',
      'TouchSense: Accurate and Transparent User Re-authentication via Finger Touching',
      'Chong Zhang, Songfan Li, Yihang Song, Li Lu, Mengshu Hou',
      'International Conference on Edge Computing and IoT',
      2020,
      '',
      21,
    ),
    paper(
      'mentor-paper-foam-drainage-2026',
      'A physically-constrained temporal augmented meta-learning approach for intelligent foam drainage timing prediction in gas wells',
      'Peng Zhang, Chong Zhang, Yan Chen, Xingjie Zeng, Bo Liu, Bin Xiong, Shuai Wang',
      'Expert Systems and Applications',
      2026,
      '',
      22,
    ),
    paper(
      'mentor-paper-gas-lifecycle-cn',
      '天然气全生命周期产量预测关键技术研究',
      '王欣, 吴晓茜, 张翀, 邓力珲, 王军',
      '工程科学学报',
      2025,
      'https://doi.org/10.13374/j.issn2095-9389.2025.08.01.002',
      23,
      false,
      '10.13374/j.issn2095-9389.2025.08.01.002',
    ),
    paper(
      'mentor-paper-rock-image-cn-2024',
      '基于层一致性平均教师模型的半监督岩石薄片图像分类',
      '严子杰, 王杨, 陈霁, 张翀',
      '应用科学学报',
      2024,
      '',
      24,
    ),
    paper(
      'mentor-paper-top-rank-k-2023',
      '面向大图的 Top-Rank-K 频繁模式挖掘算法',
      '邹杰军, 王欣, 石俊豪, 兰博, 方宇, 张翀, 谢文波, 沈玲珍',
      '南京大学学报',
      2023,
      '',
      25,
    ),
    paper(
      'mentor-paper-ibmct-icassp',
      'IBMCT: Breaking the Cost Barrier in Industrial Internet of Things via High-Fidelity Virtual Sensing',
      'Qingzheng Hu, Chong Zhang, Qiuyan He, Wenyang Xiao, Hangyu Xiong, Ningrong Lai',
      'ICASSP',
      '',
      '',
      26,
    ),
    paper(
      'mentor-paper-embedding-chips-tmc-2025',
      'Embedding Chips Over the Air: Rethink IoT Architecture for Ubiquitous Sensing',
      'Qianhe Meng, Han Wang, Chong Zhang, Yihang Song, Songfan Li, Li Lu, Hongzi Zhu',
      'IEEE Transactions on Mobile Computing',
      2025,
      'https://doi.org/10.1109/TMC.2025.3567635',
      27,
      false,
      '10.1109/TMC.2025.3567635',
    ),
    paper(
      'mentor-paper-processor-sharing-sensys-2024',
      'Processor-Sharing Internet of Things Architecture for Large-scale Deployment',
      'Qianhe Meng, Han Wang, Chong Zhang, Yihang Song, Li Lu, Hongzi Zhu',
      'ACM SenSys 2024',
      2024,
      '',
      28,
    ),
    paper(
      'mentor-paper-cupid-icc-2025',
      'Cupid: Empowering Reliable Collaboration for Intermittent Computing Nodes',
      'Yize Zhao, Chong Zhang, Zetao Gao, Han Wang, Qianhe Meng, Li Lu',
      'ICC 2025',
      2025,
      '',
      29,
    ),
    paper(
      'mentor-paper-whats-next-iot-2025',
      "The What's Next IoT Architecture for Large-scale Deployment",
      'Qianhe Meng, Han Wang, Chong Zhang, Yihang Song, Songfan Li, Li Lu, Hongzi Zhu',
      'ACM Mobile Computing and Communications Review',
      2025,
      '',
      30,
    ),
    paper(
      'mentor-paper-digital-rocks',
      'Lightweight Permeability Prediction of Digital Rocks by Merging 3D Depthwise Separable Convolution with Efficient Multiscale Attention',
      'Xuanling Xiang, Yan Chen, Enli Zhang, Chong Zhang, Minggen Yang, Han Zhao',
      'Computational Geosciences',
      '',
      '',
      31,
    ),
    paper(
      'mentor-paper-cross-device-security-mlnlp',
      'Empowering Cross-Device Data Security Verification for IoT Sensor Nodes',
      'Xin Shi, Sheng He, Ting Wang, Chong Zhang, Yang Wang, Xiao Zhang',
      'MLNLP',
      2024,
      '',
      32,
    ),
    paper(
      'mentor-paper-internet-of-microchips-2020',
      'Internet-of-Microchips: Direct Radio-to-Bus Communication with SPI Backscatter',
      'Songfan Li, Chong Zhang, Yihang Song, Hui Zheng, Lu Liu, Li Lu, Mo Li',
      'ACM MobiCom 2020',
      2020,
      'https://doi.org/10.1145/3372224.3419182',
      33,
      false,
      '10.1145/3372224.3419182',
    ),
    paper(
      'mentor-paper-passive-dsss-nsdi-2022',
      'Passive DSSS: Empowering the Downlink Communication for Backscatter Systems',
      'Songfan Li, Hui Zheng, Chong Zhang, Yihang Song, Shen Yang, Minghua Chen, Li Lu, Mo Li',
      'USENIX NSDI 2022',
      2022,
      '',
      34,
    ),
    paper(
      'mentor-paper-lora-downlink-ton',
      'Bringing LoRa Downlink to Backscatter Devices',
      'Han Wang, Yihang Song, Qianhe Meng, Chong Zhang, Songfan Li, Shuwei Wu, Ruizhe Zhang, Li Lu',
      'IEEE Transactions on Networking',
      '',
      '',
      35,
    ),
    paper(
      'mentor-paper-rfid-sensor-tags-mobicom-2023',
      'Go Beyond RFID: Rethinking the Design of RFID Sensor Tags for Versatile Applications',
      'Songfan Li, Qianhe Meng, YanXu Bai, Chong Zhang, Yihang Song, Shengyu Li, Li Lu',
      'ACM MobiCom 2023',
      2023,
      '',
      36,
    ),
    paper(
      'mentor-paper-sisyphus-mobicom-2024',
      'Sisyphus: Redefining Low Power for LoRa Receiver',
      'Han Wang, Yihang Song, Qianhe Meng, Zetao Gao, Chong Zhang, Li Lu',
      'ACM MobiCom 2024',
      2024,
      'https://doi.org/10.1145/3636534.3690686',
      37,
      false,
      '10.1145/3636534.3690686',
    ),
    paper(
      'mentor-paper-hedgehog-mobicom-2025',
      'Hedgehog: Pushing the Range Limits of Ultrasonic Microphone Jammers',
      'Shengyu Li, Mengchen Teng, Boyu Li, Songfan Li, Xiandong Shao, Chong Zhang, Li Lu',
      'ACM MobiCom 2025',
      2025,
      '',
      38,
    ),
    paper(
      'mentor-paper-mumote-nsdi-2023',
      'μMote: Enabling Passive Chirp De-spreading and μW-level Long-Range Downlink for Backscatter Devices',
      'Yihang Song, Li Lu, Jiliang Wang, Chong Zhang, Hui Zheng, Shen Yang, Jinsong Han',
      'USENIX NSDI 2023',
      2023,
      '',
      39,
    ),
    paper(
      'mentor-paper-thumb-drive-tdsc-2023',
      'Watch out Your Thumb Drive: Covert Data Theft from Portable Data Storage via Backscatter',
      'Shengyu Li, Songfan Li, Qingqing Liu, Yihang Song, Chong Zhang, Li Lu',
      'IEEE Transactions on Dependable and Secure Computing',
      2023,
      '',
      40,
    ),
    paper(
      'mentor-paper-multi-agent-gas-2026',
      'Multi-Agent Cooperation for Smart Gas Reservoir Management',
      'Qian Wang, Hongyi Ma, Jing Hu, Xiuying Dong, Peng Zhang, Xu Yao, Chong Zhang, Yan Chen',
      'Expert Systems with Applications',
      2026,
      'https://doi.org/10.1016/j.eswa.2026.132063',
      41,
      false,
      '10.1016/j.eswa.2026.132063',
    ),
    paper(
      'mentor-paper-active-learning-dasfaa-2026',
      'Certified Pseudo-label Enhanced Active Learning Framework for Pattern Interest Evaluation',
      'Xin Wang, Tian Wang, Lu Wang, Yuxin Zhang, Bin Hu, Chong Zhang, Wenbo Xie',
      'DASFAA 2026',
      2026,
      '',
      42,
    ),
    paper(
      'mentor-paper-chipnet-2022',
      'Chipnet: Enabling Large-scale Backscatter Network with Processor-free Devices',
      'Yihang Song, Chao Song, Li Lu, Shen Yang, Songfan Li, Chong Zhang, Qianhe Meng, Xiandong Shao, Haili Wang',
      'ACM Transactions on Sensor Networks',
      2022,
      '',
      43,
    ),
    paper(
      'mentor-paper-power-efficiency-sensors-2022',
      'Rethinking Power Efficiency for Next-Generation Processor-Free Sensing Devices',
      'Yihang Song, Songfan Li, Chong Zhang, Shengyu Li, Li Lu',
      'Sensors',
      2022,
      'https://doi.org/10.3390/s22083074',
      44,
      false,
      '10.3390/s22083074',
    ),
    paper(
      'mentor-paper-distance-bounding-2021',
      'A Spectrum-Efficient Cross-Layer RF Distance Bounding Scheme',
      'Yihang Song, Songfan Li, Chong Zhang, Li Lu',
      'Security and Communication Networks',
      2021,
      '',
      45,
    ),
    paper(
      'mentor-paper-encryption-rfid-cbd-2022',
      'Realizing Power-efficient Encryption Communication for Computational RFID Tags',
      'Yihang Song, Li Lu, Jiqing Gu, Chong Zhang',
      'CBD 2022',
      2022,
      'https://doi.org/10.1109/CBD58033.2022.00045',
      46,
      false,
      '10.1109/CBD58033.2022.00045',
    ),
    paper(
      'mentor-paper-blinkbud-ubicomp-2025',
      'BlinkBud: Detecting Hazards from Behind via Sampled Monocular 3D Detection on a Single Earbud',
      'Yunzhe Li, Jiajun Yan, Yuzhou Wei, Kechen Liu, Yize Zhao, Chong Zhang, Hongzi Zhu, Li Lu, Shan Chang, Minyi Guo',
      'Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous Technologies',
      2025,
      'https://doi.org/10.1145/3770707',
      47,
      false,
      '10.1145/3770707',
    ),
    paper(
      'mentor-paper-eamnet-2025',
      'EAMNet: A dual-decoder network with edge-semantics synergy for agricultural parcel extraction from remote sensing images',
      'Mei Yang, Sinan Liu, Zhen Pan, Lijing Gao, Xiaodong Hu, Chong Zhang, Fan Min',
      'Journal of Applied Remote Sensing',
      2025,
      'https://doi.org/10.1117/1.JRS.19.046508',
      48,
      false,
      '10.1117/1.JRS.19.046508',
    ),
    paper(
      'mentor-paper-oil-reservoir-ai-cn',
      '油藏数值模拟中的人工智能技术',
      '张烈辉, 王杨, 曾星杰, 张舒, 张翀, 司徒誓伍, 肖清宇, 王欣',
      '世界石油工业',
      '',
      '',
      49,
    ),
    paper(
      'mentor-paper-icsd-yolo',
      'ICSD-YOLO: Intelligent Detection for Real-time Industrial Field Safety',
      'Shi Cheng, Yan Chen, Chong Zhang, Dong-Guo Chang, Yi-Jia Chen, Qian Wang',
      'Expert Systems with Applications',
      2024,
      '',
      50,
    ),
  ]
}

function defaultMentorPatents() {
  const patent = (id, title, authors, patentNo, sortOrder) => ({
    id,
    title,
    category: '专利',
    authors,
    patent_no: patentNo,
    visible_on_home: true,
    sort_order: sortOrder,
  })

  return [
    patent(
      'patent-edge-low-redundancy-2024',
      '一种边端融合低冗余数据采集处理方法',
      '张翀, 雷柯, 王杨, 石鑫, 王欣, 陈雁',
      '申请号：202410452283.7',
      1,
    ),
    patent(
      'patent-virtual-sensor-2024',
      '一种适用于工业物联网的虚拟传感节点生成技术',
      '张翀, 石鑫, 雷柯, 王杨, 张传辉, 周立虎',
      '申请号：202410523287.X',
      2,
    ),
    patent(
      'patent-micro-power-flash-security-2025',
      '一种微功耗免计算数据传输与分布式闪存加解密系统',
      '张翀, 周立虎, 王杨, 王婷, 张传辉, 石鑫, 张晓均, 王欣',
      'ZL202410859332.9',
      3,
    ),
    patent(
      'patent-flash-last-bit-encryption-2025',
      '一种微功耗免计算分布式闪存末位加密与防拥塞通信机制',
      '张翀, 张传辉, 王杨, 王婷, 石鑫, 周立虎, 张晓均, 陈雁',
      'ZL202410859799.3',
      4,
    ),
    patent(
      'patent-backscatter-task-scheduling-2025',
      '反向散射通信节点多元算法融合任务调度与调度方法',
      '张翀, 张传辉, 康强, 王彬旭, 陈雁, 张晓均, 周立虎, 石鑫, 雷柯, 董秀英, 张骁, 何升',
      '申请号：2025102641056',
      5,
    ),
    patent(
      'patent-near-zero-power-voltage-2024',
      '一种近零功耗电压自适应匹配微能量采集控制架构与方法',
      '张翀, 赵一泓, 王晶, 乔愉, 黄铖, 谭祺英',
      'CN118739528B',
      6,
    ),
    patent(
      'patent-dpu-passive-communication-2024',
      '一种高能效免计算 DPU 终端被动式通信控制方法',
      '张翀, 周立虎, 王杨, 王婷, 张传辉, 石鑫, 王欣, 陈雁',
      'CN202410859589.4',
      7,
    ),
    patent(
      'patent-distributed-sensor-security-2025',
      '一种高能效时空关联分布式传感节点安全防攻击校验方法',
      '张翀, 董秀英, 周立虎, 王婷, 王杨, 张晓均, 陈雁, 何升, 张骁',
      'ZL202411632534.6',
      8,
    ),
    patent(
      'patent-adaptive-passive-security-2025',
      '一种自适应微能量驱动无源传感节点安全加密系统',
      '张翀, 张骁, 张传辉, 张晓均, 王婷, 董秀英, 何升, 陈雁, 周立虎, 石鑫, 雷柯',
      'CN119364348B',
      9,
    ),
    patent(
      'patent-cold-chain-low-carbon-2025',
      '一种面向工业冷链物流系统的多目标多车型低碳排放一体化优化架构',
      '张翀, 巫玲娜, 王杨, 董秀英, 张骁, 石俊, 周超, 周健, 杨怀宇, 何升, 赵德玮, 李海锋, 向宇飞',
      '申请号：2025118615456',
      10,
    ),
    patent(
      'patent-layered-endogenous-security-2025',
      '一种分层自适应内生安全检测架构',
      '王杨, 石鑫, 张翀, 巫林娜, 董秀英, 张骁, 石俊, 王欣, 谢文波, 周超, 周健, 李海锋, 向宇飞, 杨怀宇, 何升, 赵德玮',
      '申请号：CN202511861402.5',
      11,
    ),
    patent(
      'patent-multimodal-structure-sensing-2025',
      '一种成本高效的多模融合建筑与工业结构实时传感监测方法',
      '石鑫, 王转旌, 张恕莹, 张翀, 王杨, 陈雁, 周立虎, 张骁, 何升, 董秀英',
      '申请号：2025102623503',
      12,
    ),
    patent(
      'patent-foam-drainage-prediction-2025',
      '一种基于自适应周期划分与深度学习的泡排时机预测方法',
      '陈雁, 石诚, 魏峰, 熊斌, 王帅, 张翀, 尹红',
      'CN202511277752.7',
      13,
    ),
  ]
}

function seedData() {
  const data = {
    meta: {
      dataVersion: DATA_VERSION,
      updatedAt: '',
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
        ...memberProfileDefaults({
          email: 'zhangchong92@swpu.edu.cn',
          bio: '西南石油大学计算机与软件学院特聘副研究员、硕士生导师，主要围绕油气井、嵌入式系统、智能感知与 Agent 智能体开展研究与工程实践。',
        }),
      },
      studentMember('m-student-zhoujian', '周健', '202522000755', '研二', '油气井'),
      studentMember('m-student-zhaodewei', '赵德伟', '202522000809', '研二', '嵌入式'),
      studentMember('m-student-shixin', '石鑫', '202611000221', '研二', '嵌入式'),
      studentMember('m-student-yanghuaiyu', '杨怀宇', '202522000824', '研二', 'Agent'),
      studentMember('m-student-xiangyufei', '向与飞', '20240004', '研二', '油气井'),
      studentMember('m-student-wulingna', '巫林娜', '202522000743', '研二', '嵌入式'),
      studentMember('m-student-lihaifeng', '李海峰', '202521000838', '研二', 'Agent'),
      studentMember('m-student-yanyi-01', '博士生', '20250001', '博士', '待定'),
      studentMember('m-student-yanyi-02', '向乐达', '20250002', '研一', '待定'),
      studentMember('m-student-yanyi-03', '彭遥影', '202621000876', '研一', '待定'),
      studentMember('m-student-yanyi-04', '宾慧敏', '202622000846', '研一', '待定'),
      studentMember('m-student-yanyi-05', '胡佳', '202622000878', '研一', '待定'),
      studentMember('m-student-yanyi-06', '欧阳天舒', '202621000838', '研一', '待定'),
      studentMember('m-student-yanyi-07', '郑松义', '20250007', '研一', '待定'),
    ],
    pendingRegistrations: [],
    publications: defaultMentorPublications(),
    projects: defaultMentorPatents(),
    researchProjects: [],
    softwareCopyrights: [],
    awards: [
      {
        id: 'award-2025-kjjb-1',
        title: '2025年度石油和化工自动化科学技术奖科技进步奖一等奖：隐蔽性储层定量表征与智能精细评价关键技术及应用（张翀排名第三）',
        winner: '张翀',
        visible_on_home: true,
        sort_order: 1,
      },
      {
        id: 'award-2025-kjjb-2',
        title: '2025年度石油和化工自动化科学技术奖科技进步奖二等奖：低渗-低压油藏生产动态智能识别与优化关键技术及应用（张翀排名第9）',
        winner: '张翀',
        visible_on_home: true,
        sort_order: 2,
      },
      {
        id: 'award-2025-fmzl',
        title: '第二十九届全国发明展览会银奖：南海西部注水油田开发数智化关键技术与应用',
        winner: '张翀等',
        visible_on_home: true,
        sort_order: 3,
      },
      {
        id: 'award-2024-jsfm-2',
        title: '2024年度石油和化工自动化行业科学技术奖技术发明奖二等奖：油气工业物联网安全防御与数据智能分析关键技术及应用',
        winner: '张翀',
        visible_on_home: true,
        sort_order: 4,
      },
      {
        id: 'award-2024-kjjb-2',
        title: '2024年度石油和化工自动化行业科学技术奖科技进步奖二等奖：致密储层智能动态评价与生产实时预警关键技术及应用',
        winner: '张翀',
        visible_on_home: true,
        sort_order: 5,
      },
      {
        id: 'award-2023-jsfm-1',
        title: '2023年度石油和化工自动化科学技术奖技术发明奖一等奖：数字油气田数据安全智能协同防御关键技术与应用',
        winner: '张翀',
        visible_on_home: true,
        sort_order: 6,
      },
      {
        id: 'award-2023-kjjb-2',
        title: '2023年度石油和化工自动化科学技术奖科技进步奖二等奖：基于信创技术体系的油气生产物联关键技术与应用',
        winner: '张翀',
        visible_on_home: true,
        sort_order: 7,
      },
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
  for (const award of data.awards) {
    award.image_url = award.image_url || defaultAwardImage(award.id)
    award.image_name = award.image_name || `${award.id}.jpg`
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
      Array.isArray(data.site?.researchLines)
        ? data.site.researchLines
        : seeded.site.researchLines,
  }
  if (data.site.peopleSectionTitle === 'People') {
    data.site.peopleSectionTitle = 'Members'
  }
  if (data.site.contactEmail === 'zhsngchong92@swpu.edu.cn') {
    data.site.contactEmail = 'zhangchong92@swpu.edu.cn'
  }
  for (const key of ['rooms', 'members', 'pendingRegistrations', 'publications', 'projects', 'researchProjects', 'awards', 'bookings', 'reimbursements']) {
    if (!Array.isArray(data[key])) data[key] = seeded[key]
  }
  if (!Array.isArray(data.softwareCopyrights)) data.softwareCopyrights = seeded.softwareCopyrights || []
  if (!Array.isArray(data.researchProjects)) data.researchProjects = []
  if (!Array.isArray(data.softwareCopyrights)) {
    data.softwareCopyrights = data.projects
      .filter((item) => item.category === '软著获奖')
      .map(({ category, ...item }) => item)
    data.projects = data.projects.filter((item) => item.category !== '软著获奖')
  }
  if (!Array.isArray(data.softwareCopyrights)) data.softwareCopyrights = []
  for (const member of data.members) {
    const isAdminMember = member.staff_id === 'admin' || member.role === 'superadmin' || member.permissions?.can_manage_members
    if (!member.password) member.password = isAdminMember ? ADMIN_PASSWORD : '123456'
    normalizeMemberProfile(member)
    normalizeStudyInfo(member)
  }
  data.members = data.members.filter((member) => member.staff_id !== 'test' && member.name !== 'test')
  if (Array.isArray(data.site.toolCards)) {
    data.site.toolCards = data.site.toolCards.filter((tool) => tool.key !== 'site')
  }
  normalizeOutputVisibility(data.publications)
  normalizeOutputVisibility(data.awards)
  if (needsUpgrade) removeTemplateOutputs(data)
  if (needsUpgrade) {
    ensureDefaultPublications(data, seeded, true)
    ensureDefaultPatents(data, seeded, true)
  }
  ensureDocumentUpdates(data)
  normalizeOutputAssets(data, seeded, needsUpgrade)
  normalizeOutputOrders(data.publications)
  normalizeOutputOrders(data.awards)
  normalizeOutputOrders(data.softwareCopyrights)
  enforceCoreMemberIdentities(data)
  if (needsUpgrade) ensureDoctoralStudent(data)
  if (needsUpgrade) {
    const systemAdmin = data.members.find((item) => item.id === 'm-admin' || item.staff_id === 'system-admin')
    if (systemAdmin) {
      systemAdmin.name = 'admin'
      systemAdmin.staff_id = 'admin'
      if (!systemAdmin.password) systemAdmin.password = ADMIN_PASSWORD
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
      (import.meta.env.DEV && import.meta.env.VITE_LOCAL_PREVIEW_ONLY === 'true' && data.site.peopleIntro?.includes('暂时保留')) ||
      data.site.peopleIntro === '教师及在读研究生按身份组织，成员状态和首页展示开关可在成员管理中维护。' ||
      data.site.peopleIntro?.includes('研一 6 个名额暂时保留') ||
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
      data.site.contactEmail === 'zhsngchong92@swpu.edu.cn' ||
      !data.site.contactEmail
    ) {
      data.site.contactEmail = seeded.site.contactEmail
    }
    const targetNames = ['张翀', '周健', '赵德伟', '杨怀宇', '向与飞', '巫玲娜', '李海峰']
    const hasTargetMembers = targetNames.every((name) => data.members.some((item) => item.name === name))
    const newFirstYearNames = ['向乐达', '彭遥影', '宾慧敏', '胡佳', '欧阳天舒', '郑松义']
    const hasNewFirstYearMembers = newFirstYearNames.every((name) => data.members.some((item) => item.name === name))
    if (!hasNewFirstYearMembers) {
      const firstYearIds = ['m-student-yanyi-02', 'm-student-yanyi-03', 'm-student-yanyi-04', 'm-student-yanyi-05', 'm-student-yanyi-06', 'm-student-yanyi-07']
      newFirstYearNames.forEach((name, index) => {
        const member = data.members.find((item) => item.id === firstYearIds[index])
        if (member) {
          member.name = name
          member.grade = '研一'
        }
      })
      if (!data.members.some((item) => item.id === 'm-student-yanyi-07')) {
        data.members.push(studentMember('m-student-yanyi-07', '郑松义', '20250007', '研一', '待定'))
      }
    }
    const visibleStudentCount = data.members.filter(
      (item) => ['student', 'alumni'].includes(item.role) && item.visible_on_site && item.status === 'active',
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
    // Keep existing local/Supabase records aligned with the verified roster.
    const rosterUpdates = {
      '赵德伟': '202522000809',
      '杨怀宇': '202522000824',
      '巫玲娜': '202522000743',
      '巫林娜': '202522000743',
      '李海峰': '202521000838',
      '彭遥影': '202621000876',
      '宾慧敏': '202622000846',
      '胡佳': '202622000878',
      '欧阳天舒': '202621000838',
      '石鑫': '202611000221',
    }
    for (const member of data.members) {
      if (rosterUpdates[member.name]) member.staff_id = rosterUpdates[member.name]
      if (member.name === '巫玲娜') member.name = '巫林娜'
    }
  }
  enforceCoreMemberIdentities(data)
  if (needsUpgrade) ensureDoctoralStudent(data)
  data.meta = {
    ...(data.meta || {}),
    dataVersion: PROFILE_DATA_VERSION,
    contentVersion: CONTENT_DATA_VERSION,
    projectsVersion: PROJECTS_DATA_VERSION,
    updatedAt: data.meta?.updatedAt || '',
  }
  return data
}

function applyDeploymentPreviewSnapshot(data) {
  if (!IS_LOCAL_PREVIEW || data.meta?.previewSnapshotVersion === deploymentPreviewSnapshot.snapshotVersion) return data

  const privateLocalMembers = data.members.filter((member) =>
    !member.visible_on_site || member.status !== 'active' || member.staff_id === 'admin' || member.role === 'superadmin',
  )
  data.site = JSON.parse(JSON.stringify(deploymentPreviewSnapshot.site))
  data.members = [...privateLocalMembers, ...JSON.parse(JSON.stringify(deploymentPreviewSnapshot.members))]
  data.publications = JSON.parse(JSON.stringify(deploymentPreviewSnapshot.publications))
  data.awards = JSON.parse(JSON.stringify(deploymentPreviewSnapshot.awards))
  data.projects = JSON.parse(JSON.stringify(deploymentPreviewSnapshot.projects))
  data.researchProjects = JSON.parse(JSON.stringify(deploymentPreviewSnapshot.researchProjects))
  data.softwareCopyrights = JSON.parse(JSON.stringify(deploymentPreviewSnapshot.softwareCopyrights))
  data.meta = {
    ...(data.meta || {}),
    ...deploymentPreviewSnapshot.meta,
    previewSnapshotVersion: deploymentPreviewSnapshot.snapshotVersion,
    databaseUpdatedAt: deploymentPreviewSnapshot.sourceUpdatedAt,
  }
  return data
}

// Keep the representative items from the September 2026 profile available
// when older cloud state is loaded, without creating duplicates.
function ensureDocumentUpdates(data) {
  if (data.meta?.contentVersion === CONTENT_DATA_VERSION && data.meta?.projectsVersion === PROJECTS_DATA_VERSION) return
  const profilePapers = [
    ['dossier-paper-lego-2023', 'LEGO: Empowering Chip-level Functionality Plug-and-play for Next-generation IoT devices', 'ASPLOS 2023', 2023, 'CCF-A；川渝地区首篇，全球录用 72 篇。'],
    ['dossier-paper-tc-2023', 'A Lightweight and Chip-Level Reconfigurable Architecture for Next-Generation IoT End Devices', 'IEEE Transactions on Computers', 2023, 'CCF-A；西南石油大学首篇。DOI: 10.1109/TC.2023.3343094'],
    ['dossier-paper-ectc-tmc', 'ECTC: A Game-Theoretic Framework for Energy-Communication-Computation Coupled Optimization in Battery-Free Sensor Networks', 'IEEE Transactions on Mobile Computing', 2026, 'CCF-A / SCI 一区 TOP；已接收。'],
    ['dossier-paper-entrust-2026', 'EnTrust: Bringing Energy-Efficient Trustworthy Sensing for Battery-Free Sensor Nodes', 'IEEE Transactions on Mobile Computing', 2026, 'CCF-A / SCI 一区 TOP；Early Access, Aug. 2026。'],
    ['dossier-paper-legoplus-2025', 'LEGO+: Redefining the Redundancy Removal for IoT Sensing Edge-End Systems', 'MobiSys 2025', 2025, 'TOP CCF-B 推荐会议；全球录用 42 篇。DOI: 10.1145/3711875.3729126'],
    ['dossier-paper-muman-2026', 'μMan: Towards Device-Agnostic Power Management for Battery-free IoT', 'SenSys 2026', 2026, 'TOP CCF-B 推荐会议；全球录用 48 篇。'],
    ['dossier-paper-sensys-best-2024', 'Processor-Sharing Internet of Things Architecture for Large-scale Deployment', 'SenSys 2024', 2024, 'CCF-B 推荐会议；Best Paper Award。'],
    ['dossier-paper-blinkbud-2025', 'BlinkBud: Detecting Hazards from Behind via Sampled Monocular 3D Detection on a Single Earbud', 'Proceedings of the ACM on IMWUT / UbiComp', 2025, 'CCF-A。DOI: 10.1145/3770707'],
    ['dossier-paper-mobicom-2020', 'Internet-of-Microchips: Direct Radio-to-Bus Communication with SPI Backscatter', 'ACM MobiCom 2020', 2020, '计算机网络领域 CCF-A。DOI: 10.1145/3372224.3419182'],
    ['dossier-paper-nsdi-2022', 'Passive DSSS: Empowering the Downlink Communication for Backscatter Systems', 'USENIX NSDI 2022', 2022, '计算机网络领域 CCF-A。'],
    ['dossier-paper-mobicom-2023', 'Go Beyond RFID: Rethinking the Design of RFID Sensor Tags for Versatile Applications', 'ACM MobiCom 2023', 2023, '计算机网络领域 CCF-A。'],
    ['dossier-paper-mobicom-sisyphus-2024', 'Sisyphus: Redefining Low Power for LoRa Receiver', 'ACM MobiCom 2024', 2024, '计算机网络领域 CCF-A。DOI: 10.1145/3636534.3690686'],
    ['dossier-paper-umote-nsdi-2023', 'μMote: Enabling Passive Chirp De-spreading and μW-level Long-Range Downlink for Backscatter Devices', 'USENIX NSDI 2023', 2023, '计算机网络领域 CCF-A。'],
    ['dossier-paper-tdsc-2023', 'Watch out Your Thumb Drive: Covert Data Theft from Portable Data Storage via Backscatter', 'IEEE Transactions on Dependable and Secure Computing', 2023, 'CCF-A；已接收。'],
    ['dossier-paper-fedmcs-2026', 'FedMCS: Federated Multi-Granularity Chemical-Semantic Distillation for Molecular Graph Learning', 'CIKM 2026', 2026, '已列入个人简介成果清单。'],
    ['dossier-paper-cloud-audit-2026', 'Anonymous Authorization Auditing Scheme Over Fuzzy Multi-Keyword Searchable Encrypted Data in Cloud Storage', 'IEEE Internet of Things Journal', 2026, 'Early Access。'],
    ['dossier-paper-shm-virtual-sensor', 'CBLA: Empowering Virtual Sensor Nodes with Zero Deployment Costs for SHM Systems', 'IJCNN 2024', 2024, 'CCF-C 推荐会议；张翀为通信作者。'],
    ['dossier-paper-icsd-yolo-2024', 'ICSD-YOLO: Intelligent Detection for Real-time Industrial Field Safety', 'Expert Systems with Applications', 2024, '已接收。'],
    ['dossier-paper-sensors-fast-2024', 'FAST: A Ubiquitous Inference Computation Model for Temperature and Humidity Sensing', 'IEEE Sensors Journal', 2024, 'SCI 二区；DOI: 10.1109/JSEN.2024.3499359'],
    ['dossier-paper-data-integrity-shm', 'A high-accuracy cross-device data integrity framework for trustworthy SHM sensing', 'IEEE Sensors Journal', 2026, '已接收；SCI 二区。'],
  ]
  const paperTitles = new Set(data.publications.map((item) => item.title))
  for (const [id, title, journal, pub_year, note] of profilePapers) {
    const existing = data.publications.find((item) => item.title === title)
    if (existing) {
      if (!existing.note) existing.note = note
      continue
    }
    data.publications.push({ id, title, authors: '张翀及合作者', journal, pub_year, volume_issue: '', pages: '', doi: '', paper_link: '', pub_type: '论文', note, visible_on_home: true, sort_order: data.publications.length + 1 })
    paperTitles.add(title)
  }

  const oldPaperTitles = new Set(data.publications.map((item) => item.title))
  const extendedPapers = [
    ['mentor-paper-ectc-tmc', 'ECTC: A Game-Theoretic Framework for Energy-Communication-Computation Coupled Optimization in Battery-Free Sensor Networks', 'IEEE Transactions on Mobile Computing', 2026],
    ['mentor-paper-data-integrity-shm', 'A high-accuracy cross-device data integrity framework for trustworthy SHM sensing', 'IEEE Sensors Journal', 2026],
    ['mentor-paper-eect-2025', 'Empowering Adaptive Endogenous Security Trend Prediction Detection for IoT Sensor Nodes', 'EECT 2025', 2025],
    ['mentor-paper-cfcst-ijcnn', 'CFCST: A Cost-Efficient Spatio-Temporal Coupling Architecture for Multi-Task SHM Systems', 'IJCNN', 2025],
    ['mentor-paper-cloud-audit-2026', 'Anonymous Authorization Auditing Scheme Over Fuzzy Multi-Keyword Searchable Encrypted Data in Cloud Storage', 'IEEE Internet of Things Journal', 2026],
    ['mentor-paper-raster-welllog-2026', 'Raster well-log digitization: a benchmark for numerical grounding', 'Frontiers of Computer Science', 2026],
    ['mentor-paper-fedmcs-2026', 'FedMCS: Federated Multi-Granularity Chemical-Semantic Distillation for Molecular Graph Learning', 'CIKM 2026', 2026],
    ['mentor-paper-cross-device-security-mlnlp', 'Empowering Cross-Device Data Security Verification for IoT Sensor Nodes', 'MLNLP 2024', 2024],
    ['mentor-paper-multi-agent-gas-2026', 'Multi-Agent Cooperation for Smart Gas Reservoir Management', 'Expert Systems with Applications', 2026],
    ['mentor-paper-active-learning-dasfaa-2026', 'Certified Pseudo-label Enhanced Active Learning Framework for Pattern Interest Evaluation', 'DASFAA 2026', 2026],
    ['mentor-paper-chipnet-2022', 'Chipnet: Enabling Large-scale Backscatter Network with Processor-free Devices', 'ACM Transactions on Sensor Networks', 2022],
    ['mentor-paper-power-efficiency-sensors-2022', 'Rethinking Power Efficiency for Next-Generation Processor-Free Sensing Devices', 'Sensors', 2022],
    ['mentor-paper-distance-bounding-2021', 'A Spectrum-Efficient Cross-Layer RF Distance Bounding Scheme', 'Security and Communication Networks', 2021],
    ['mentor-paper-encryption-rfid-cbd-2022', 'Realizing Power-efficient Encryption Communication for Computational RFID Tags', 'CBD 2022', 2022],
    ['mentor-paper-eamnet-2025', 'EAMNet: A dual-decoder network with edge-semantics synergy for agricultural parcel extraction from remote sensing images', 'Journal of Applied Remote Sensing', 2025],
  ]
  for (const [id, title, journal, pub_year] of extendedPapers) {
    if (oldPaperTitles.has(title)) continue
    data.publications.push({ id, title, authors: '张翀及合作者', journal, pub_year, volume_issue: '', pages: '', doi: '', paper_link: '', pub_type: '论文', note: '个人简介论文清单', visible_on_home: false, sort_order: data.publications.length + 1 })
    oldPaperTitles.add(title)
  }

  const patents = [
    ['dossier-patent-pnp-system', '物联网外设即插即用系统', '鲁力、张翀、张光远、邵贤栋、张竣钦', 'CN202111653418；2023.05.16'],
    ['dossier-patent-iot-interface', '统一的物联网外设接入与控制方法', '鲁力、张翀、张竣钦、张光远、邵贤栋', 'CN114546394A；2023.02.28'],
    ['dossier-patent-adaptive-scheduling', '一种物联网自适应外设调度方法、计算机设备及存储介质', '鲁力、张翀、张竣钦、张光远、邵贤栋', 'CN114500286A；2023.05.16'],
    ['dossier-patent-converter', '物联网外设的即插即用转换电路及方法', '鲁力、张翀、邵贤栋、张竣钦、张光远', 'CN114500274A；2023.06.23'],
    ['dossier-patent-peripheral-interface', '用于物联网终端的统一的外设交互接口', '鲁力、张翀、张竣钦、邵贤栋、张光远', 'CN114513411A；2021.12.30'],
    ['dossier-patent-harvesting-wearable', '一种能量收集装置及地震监测系统、无源智能可穿戴系统', '鲁力、张翀', 'CN205921503U；2017.02.01'],
    ['dossier-patent-pendulum', '一种有利于高效利用单摆能量的齿轮结构', '鲁力、张翀', 'CN205859050U；2017.01.04'],
    ['dossier-patent-backscatter-bus', '基于反向散射的无线总线通信方法', '鲁力、李松璠、张翀、宋一杭、郑辉、刘璐', 'CN112039744A；2021.10.01'],
    ['dossier-patent-iot-signal-receiver', '用于接收物联网终端信号的信号接收系统', '鲁力、李松璠、张翀、宋一杭、郑辉、刘璐', 'CN111988054A；2021.11.05'],
    ['dossier-patent-radio-bus', '通过无线电直接访问总线的通信方法', '鲁力、李松璠、张翀、宋一杭、郑辉、刘璐', 'CN111988420A；2022.07.19'],
    ['dossier-patent-iot-terminal-communication', '物联网终端的通信控制方法', '鲁力、李松璠、张翀、宋一杭', 'CN111988417A；2020.11.24'],
    ['dossier-patent-processorless-iot', '免编程无处理器的物联网终端架构', '鲁力、李松璠、张翀、宋一杭', 'CN111949595A；2020.11.17'],
    ['dossier-patent-demodulator', '终端对收发机发送数据的解调电路', '鲁力、李松璠、张翀、宋一杭、郑辉、刘璐', 'CN213072710U；2021.04.27'],
    ['dossier-patent-pressure-gauge', '一种附带半自动且具夜视功能色带盘的压力表', '刘芬、石泽民、张翀、雍林、王瑶', 'ZL201820557176.0；2018.04.18'],
    ['dossier-patent-pressure-dial', '压力表盘（外观设计专利）', '石泽民、汪浩瀚、张娟、张翀、彭冬婳、李忻洪、王长虹、郑旭', 'ZL201930071397.7；2019.02.21'],
    ['dossier-patent-iot-modulator', '物联网终端向网关发送数据的调制电路', '鲁力、李松璠、张翀、宋一杭、郑辉、刘璐', 'CN213072711U；2021.04.27'],
    ['dossier-patent-lora-downlink', '一种低功耗长距离下行接收机电路', '鲁力、宋一杭、张翀、郑辉、杨深', 'CN116388783A；2023.07.04'],
    ['dossier-patent-reader-rfid', '一种阅读器与 RFID 标签间数据交换方法', '鲁力、李松璠、孟千贺、白彦序、张翀、宋一杭', 'CN113705258A；2023.05.16'],
    ['dossier-patent-rfid-sensing-tag', '一种集感知与识别于一体的 RFID 标签系统', '鲁力、李松璠、孟千贺、白彦序、张翀、宋一杭', 'CN113705257A；2021.11.26'],
    ['dossier-patent-rfid-chip', '一种 RFID 芯片', '鲁力、李松璠、孟千贺、白彦序、张翀、宋一杭', 'CN202110975685；2023.07.07'],
    ['dossier-patent-rfid-tag', '一种易于定制的 RFID 感知标签', '鲁力、李松璠、孟千贺、白彦序、张翀、宋一杭', 'CN114462565A；2022.05.10'],
    ['dossier-patent-air-quality', '一种空气质量预测方法', '张舒、张克萌、王杨、陈雁、张翀、谢文波', 'CN118072873B；2024.07.05'],
    ['dossier-patent-gas-classification', '基于频率信道转换和自监督的气井积液分类和预测方法', '许森海、陈雁、李洋冰、张恩莉、王骞、曾星杰、张翀', 'CN202410823205.3；2024.06.25'],
    ['dossier-patent-foam-timing-application', '一种基于自适应周期划分与深度学习的泡排时机预测方法', '陈雁、张朋、魏峰、熊斌、王帅、张艺萌、易雨、石诚、胡治权、朱敏、胡斌、曾星杰、王骞、张翀、尹红', 'CN202511277752.7；2025.09.09'],
    ['dossier-patent-image-similarity', '一种基于多视图特征融合的图像相似度计算方法', '陈雁、石诚、魏峰、张兴鹏、易雨、张朋、熊斌、曾星杰、尹红、王骞、张翀', 'CN120726353A；2025.09.30'],
  ]
  const patentsInState = data.projects.filter((item) => item.category === '专利' || item.patent_no)
  const patentTitles = new Set(patentsInState.map((item) => item.title))
  for (const [index, [id, title, authors, patent_no]] of patents.entries()) {
    if (patentTitles.has(title)) continue
    const registration = patent_no.match(/(?:CN|ZL)?[\d.]+[A-Z]?/i)?.[0]
    const existing = registration && patentsInState.find((item) => item.patent_no?.includes(registration))
    if (existing) {
      if (!existing.title) existing.title = title
      if (!existing.authors) existing.authors = authors
      if (!existing.visible_on_home) existing.visible_on_home = true
      patentTitles.add(title)
      continue
    }
    data.projects.push({ id, title, category: '专利', authors, patent_no, visible_on_home: true, sort_order: 100 + index })
    patentTitles.add(title)
  }

  const normalizedAwardTitles = [
    '隐蔽性储层定量表征与智能精细评价关键技术及应用：中国石油和化工自动化应用协会科技进步一等奖，排名第三。',
    '油气工业物联网安全防御与数据智能分析关键技术及应用：中国石油和化工自动化应用协会技术发明二等奖，证书编号 2024 KXJSJ-FM041-2-R03，排名第三。',
    '南海西部注水油田开发数智化关键技术与应用：第二十九届全国发明展览会“一带一路”暨金砖国家技能发展与技术创新大赛银奖，证书编号 3502043，排名第八。',
    '数字油气田数据安全智能协同防御关键技术与应用：中国石油和化工自动化应用协会技术发明一等奖，证书编号 2023KXJSJ-FM016-1-R10，排名第十。',
    '基于信创技术体系的油气生产物联关键技术与应用：中国石油和化工自动化应用协会科技进步二等奖，证书编号 2023KXJSJ-JB115-2-R10，排名第十。',
    '低渗-低压油藏生产动态智能识别与优化关键技术及应用：中国石油和化工自动化应用协会科技进步二等奖，证书编号 2025KXJSJ-JB050-2-R09，排名第九。',
    '致密储层智能动态评价与生产实时预警关键技术及应用：中国石油和化工自动化应用协会科技进步二等奖，证书编号 2024 KXJSJ-JB064-2-R11，排名第十一。',
    'Processor-Sharing Internet of Things Architecture for Large-scale Deployment：ACM SenSys 2024 Best Paper Award，排名第三。',
    '数据分析与机器学习：第五届四川省高校教师教学创新大赛三等奖，排名第三。',
    '2025 年西南石油大学大学生创新创业大赛金奖：智慧岩识——薄片微观图像全自动鉴定引领者，第一指导教师。',
    '2025 年四川省国际大学生创新大赛铜奖：微岩精灵——薄片微观图像全自动鉴定引领者，第一指导教师。',
    '2025 年西南石油大学大学生创新创业大赛银奖：律桥（Lex Nexus）综合法律平台，第二指导教师。',
    '油气田开发生产智能管控关键技术与应用：中国石油和化工自动化应用协会科技进步三等奖，证书编号 2025KXJSJ-JB135-3-R05，排名第五。',
  ]
  const profileAwardTitles = new Set(data.awards.map((item) => item.title))
  const awardMatches = [
    ['隐蔽性储层定量表征与智能精细评价', '隐蔽性储层定量表征与智能精细评价'],
    ['油气工业物联网安全防御与数据智能分析', '油气工业物联网安全防御与数据智能分析'],
    ['南海西部注水油田开发数智化', '南海西部注水油田开发数智化'],
    ['数字油气田数据安全智能协同防御', '数字油气田数据安全智能协同防御'],
    ['基于信创技术体系的油气生产物联', '基于信创技术体系的油气生产物联'],
    ['低渗-低压油藏生产动态智能识别与优化', '低渗-低压油藏生产动态智能识别与优化'],
    ['Processor-Sharing Internet of Things Architecture for Large-scale Deployment', 'Processor-Sharing Internet of Things Architecture for Large-scale Deployment'],
    ['数据分析与机器学习', '数据分析与机器学习'],
  ]
  data.awards = data.awards.filter((item) => !item.title.includes('致密储层智能动态评价与生产实时预警'))
  for (const [index, title] of normalizedAwardTitles.entries()) {
    const exact = data.awards.find((item) => item.title === title)
    if (exact) {
      if (exact.visible_on_home === undefined) exact.visible_on_home = true
      continue
    }
    const identity = awardMatches.find(([phrase]) => title.includes(phrase))?.[1]
    const existing = identity && data.awards.find((item) => item.title.includes(identity))
    if (existing) {
      existing.title = title
      if (existing.winner === undefined || !existing.winner) existing.winner = '张翀'
      if (existing.visible_on_home === undefined) existing.visible_on_home = true
      continue
    }
    data.awards.push({ id: `dossier-award-2026-${index + 1}`, title, winner: '张翀', visible_on_home: true, sort_order: index + 1 })
    profileAwardTitles.add(title)
  }

  const bookEntries = [
    ['dossier-book-wireless-bus', '无线总线物联网边端系统', '鲁力、张翀、李松璠、宋一杭、王晗、孟千贺、李圣雨', '科学出版社', 'ISBN 978-7-03-084463-7'],
    ['dossier-book-oil-gas-security', '油气工业数据安全防御理论与技术', '张晓均、张翀、周让、薛婧婷', '石油工业出版社', 'ISBN 978-7-5183-7930-9'],
  ]
  const existingBooks = new Set((data.softwareCopyrights || []).map((item) => item.title))
  for (const [index, [id, title, authors, publisher, isbn]] of bookEntries.entries()) {
    if (existingBooks.has(title)) continue
    const existing = data.softwareCopyrights.find((item) => item.title?.includes(title))
    if (existing) continue
    data.softwareCopyrights.push({ id, title, authors, winner: '', patent_no: `${publisher} · ${isbn}`, note: '科研著作（个人简介原文列于“软著”标题下，书目信息表明为图书）', visible_on_home: true, sort_order: index + 1 })
  }

  const researchLines = [
    { title: '大模型搜索加速与高效推理', tag: '大模型与智能体', icon: 'bot', tone: 'jade', text: '面向 RAG、智能体工具检索、长上下文搜索与搜索式推理，研究搜索空间压缩、检索与缓存、调度优化及软硬件协同加速。' },
    { title: '计算机体系结构与高效智能系统', tag: '体系结构', icon: 'cpu', tone: 'blue', text: '围绕可重构计算、芯片级任务执行、冗余消除与 AI 加速架构，研究算法、系统和硬件协同优化。' },
    { title: '低功耗物联网与无源智能系统', tag: '低功耗计算', icon: 'network', tone: 'moss', text: '研究能量采集、无源与间歇计算、微功耗电路、能量管理、反向散射通信及低功耗终端架构。' },
    { title: '边端智能感知与数据推理', tag: '边端智能', icon: 'bot', tone: 'clay', text: '研究稀疏感知、虚拟传感、多模态融合、物理约束学习和边端协同推理。' },
    { title: '计算机网络与应用安全', tag: '网络与安全', icon: 'network', tone: 'blue', text: '研究物联网通信、数据完整性、轻量级可信机制、边端安全及资源受限系统安全执行。' },
    { title: '工业智能与能源场景应用', tag: '工业应用', icon: 'cpu', tone: 'jade', text: '面向油气勘探开发、气井生产、测井、结构健康监测和智能检测开展算法研究、系统设计与原型验证。' },
  ]
  data.site.researchLines = researchLines
  const researchProjects = [
    ['dossier-project-major-well-logging', '万米特深井测井关键核心装备', '国家科技重大专项（课题5：万米深层复杂环境测井采集质控与数据处理）', '2025ZD1402100', '2025.07—2030.12；课题经费 100 万元。'],
    ['dossier-project-nsf-key', '安全攸关的航空智能制造威胁监检测和动态自适防御研究', '国家自然科学基金重点项目', 'U21A20462', '2022.01—2025.12；项目经费 260 万元。'],
    ['dossier-project-sichuan-youth', '数字油气田轻量级传感架构关键技术研究', '四川省科技厅青年基金项目（主持）', '24NSFSC4152', '2024.01—2025.12；项目经费 10 万元。'],
    ['dossier-project-open-oilgas', '油气藏数字开发推理感知关键技术研究', '油气藏地质及开发工程全国重点实验室开放基金（主持）', 'PLN2024-34', '2024.10—2026.05。'],
    ['dossier-project-weather-open', '低功耗多模融合气象信息感知方法与执行架构关键技术研究', '四川省数值天气计算工程技术研究中心开放基金（主持）', '2025JSJKF02', '2026.01—2026.12；项目经费 2 万元。'],
    ['dossier-project-nsf-sensing', '无源感知和计算系统能量理论和关键技术研究', '国家自然科学基金面上项目（主研第二，结题）', '61872061', '2019.01—2022.12；项目经费 64 万元。'],
    ['dossier-project-nsrd-industrial-iot', '面向大规模异质工业互联网终端的高效安全自适应互联技术', '国家重点研发计划', '2017YFB1003003', '2017.10—2021.09；项目经费 298 万元。'],
    ['dossier-project-nsf-physio', '噪声影响下的微弱生理信号的情感识别关键理论研究', '国家自然科学基金面上项目', '61976047', '2020.01—2022.12；项目经费 68.6 万元。'],
    ['dossier-project-sichuan-general', '物联网系统多源数据可验证密态计算方法研究', '四川省科技厅面上项目', '2025ZNSFSC0495', '2025.01—2026.12；项目经费 20 万元。'],
    ['dossier-project-next-internet', '时序信息融合轻量化传感控制关键技术研究', '下一代互联网数据处理技术国家地方联合工程实验室开放基金（主持）', '', '2024.06—2024.12；项目经费 1 万元。'],
    ['dossier-project-changqing-algorithm', '气井工况及积液智能诊断算法测试评价', '中国石油天然气股份有限公司长庆油田分公司油气工艺研究院项目', '', '2026.02—2026.12；项目经费 59.3 万元。'],
    ['dossier-project-grad-teaching', '案例驱动型数据仓库与知识工程课程教学改革与实践', '西南石油大学研究生教改项目', '2024JGYB024', ''],
    ['dossier-project-sichuan-teaching', '面向一流人才培养的计算机类课程虚拟教研室建设与实践', '四川省教学改革重大项目研究项目', 'JG-2023-47', ''],
    ['dossier-project-sailing', '泛在物联网轻量级感知体系与信息计算关键技术研究', '西南石油大学自然科学“启航计划”项目', '2023QHZ002', '项目经费 10 万元。'],
    ['dossier-project-changqing-knowledgebase', '长庆油田开发知识库智能化技术（2024年软件测试与数据加工）', '长庆油田数字和智能化事业部技术服务合同', '计科F114', '2024.07—2024.12；合同金额 65 万元。'],
  ]
  const projectKeys = new Set((data.researchProjects || []).flatMap((item) => [item.title, item.project_no].filter(Boolean)))
  const projectTitles = new Set((data.researchProjects || []).map((item) => item.title))
  for (const [index, [id, title, source, project_no, note]] of researchProjects.entries()) {
    const same = data.researchProjects.find((item) => item.title === title || (project_no && item.project_no === project_no))
    if (same) continue
    if (projectKeys.has(title) || projectTitles.has(title)) continue
    data.researchProjects.push({ id, title, source, project_no, note, visible_on_home: true, sort_order: index + 1 })
    projectKeys.add(title)
    projectTitles.add(title)
  }
  data.site.heroLede = '张翀，工学博士（后）、特聘副研究员、硕士生导师。研究聚焦大模型搜索加速、高效智能系统、低功耗物联网与边端智能，面向油气能源和智能检测开展系统验证。'
  data.site.piIntro = '张翀，中共党员，工学博士（后），西南石油大学计算机与软件学院特聘副研究员、硕士生导师。现任四川省人工智能学会理事、ACM SIGBED China 执行委员、ACM/CCF 专业会员，担任 CCF 物联网、分布式计算与系统、计算机安全专委会委员，四川省油气勘探开发智能化工程研究中心骨干。担任 HPCA 程序委员会委员及 IEEE Transactions on Mobile Computing 审稿人。发表论文 50 余篇，其中 CCF-A 类期刊及会议论文 13 篇、TOP CCF-B 类论文 6 篇；申请发明及实用新型专利近 40 项，出版科研著作 2 部，获省部级科技进步一等奖、技术发明一等奖等科技奖励。主持四川省科技厅青年基金、油气藏地质及开发工程全国重点实验室开放基金等项目，并参与国家科技重大专项、国家自然科学基金及国家重点研发计划。'
  const mentor = data.members.find((item) => item.staff_id === 'zhangchong')
  if (mentor) mentor.bio = data.site.piIntro
  data.meta.contentVersion = CONTENT_DATA_VERSION
  data.meta.projectsVersion = PROJECTS_DATA_VERSION

  const papers = [
    ['doc-paper-raster-welllog-2026', 'Raster well-log digitization: a benchmark for numerical grounding', 'Frontiers of Computer Science', 51, 'https://doi.org/10.1007/s11704-026-60965-4'],
    ['doc-paper-fedmcs-2026', 'FedMCS: Federated Multi-Granularity Chemical-Semantic Distillation for Molecular Graph Learning', 'CIKM 2026', 52, ''],
    ['doc-paper-cloud-audit-2026', 'Anonymous Authorization Auditing Scheme Over Fuzzy Multi-Keyword Searchable Encrypted Data in Cloud Storage', 'IEEE Internet of Things Journal', 53, ''],
  ]
  const existingPapers = new Set(data.publications.map((item) => item.title))
  for (const [id, title, journal, sort_order, paper_link] of papers) {
    if (existingPapers.has(title)) continue
    data.publications.push({ id, title, authors: 'Chong Zhang 等', journal, pub_year: 2026, volume_issue: '', pages: '', doi: '', paper_link, pub_type: '论文', note: '导师论文成果', visible_on_home: false, sort_order })
  }
  const documentedLinks = {
    'BioTouch: Reliable Re-Authentication via Finger Bio-Capacitance and Touching Behavior': 'https://doi.org/10.3390/s22093583',
  }
  for (const paper of data.publications) {
    if (!paper.paper_link && documentedLinks[paper.title]) paper.paper_link = documentedLinks[paper.title]
  }
  const awards = [
    ['doc-award-sensys-best-paper', 'Processor-Sharing Internet of Things Architecture for Large-scale Deployment：ACM SenSys 2024 Best Paper Award', 8],
    ['doc-award-teaching-innovation', '数据分析与机器学习：第五届四川省高校教师教学创新大赛三等奖', 9],
    ['doc-award-innovation-gold', '2025年西南石油大学大学生创新创业大赛金奖：智慧岩识-薄片微观图像全自动鉴定引领者', 10],
    ['doc-award-innovation-bronze', '2025年四川省国际大学生创新大赛铜奖：微岩精灵-薄片微观图像全自动鉴定引领者', 11],
    ['doc-award-lex-nexus', '2025年西南石油大学大学生创新创业大赛银奖：律桥（Lex Nexus）综合法律平台', 12],
    ['doc-award-oilfield-third', '油气田开发生产智能管控关键技术与应用：科技进步三等奖', 13],
  ]
  const existingAwards = new Set(data.awards.map((item) => item.title))
  for (const [id, title, sort_order] of awards) {
    if (existingAwards.has(title)) continue
    data.awards.push({ id, title, winner: '张翀', visible_on_home: false, sort_order })
  }
}

function loadData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const data = applyDeploymentPreviewSnapshot(raw ? migrateData(JSON.parse(raw)) : seedData())
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return data
  } catch {
    return applyDeploymentPreviewSnapshot(seedData())
  }
}

const state = reactive(loadData())
window.localStorage.removeItem(SESSION_KEY)
const session = reactive({
  memberId: '',
})
const cloud = reactive({
  enabled: sharedStateEnabled,
  loading: false,
  ready: !sharedStateEnabled,
  error: '',
  lastSavedAt: '',
})

let cloudSaveTimer = 0
let cloudSaveInProgress = false
let initialCloudSyncComplete = false
let lastPersistedState = JSON.parse(JSON.stringify(state))

function writeLocalState() {
  state.meta = {
    ...(state.meta || {}),
    dataVersion: PROFILE_DATA_VERSION,
    contentVersion: CONTENT_DATA_VERSION,
    projectsVersion: PROJECTS_DATA_VERSION,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function save() {
  writeLocalState()
  queueCloudSave()
}

async function saveImmediately() {
  writeLocalState()
  if (!sharedStateEnabled) return { ok: true }
  if (!cloud.ready) {
    replaceState(lastPersistedState)
    return { ok: false, message: '云端数据仍在加载，请稍后再保存' }
  }
  window.clearTimeout(cloudSaveTimer)
  cloudSaveInProgress = true
  try {
    const latest = await retryCloud(fetchSharedState)
    if (!latest.ok) {
      replaceState(lastPersistedState)
      return { ok: false, message: latest.message || '无法检查云端数据' }
    }
    if (latest.data && latest.updatedAt !== cloud.lastSavedAt) {
      replaceState(latest.data)
      lastPersistedState = cloneState()
      cloud.lastSavedAt = latest.updatedAt
      return { ok: false, message: '数据已在其他设备更新，页面已刷新，请重新操作' }
    }
    const result = await retryCloud(() => saveSharedState(cloneState()))
    if (result.ok) {
      cloud.error = ''
      cloud.lastSavedAt = result.updatedAt
      lastPersistedState = cloneState()
    } else {
      cloud.error = result.message
      replaceState(lastPersistedState)
    }
    return result
  } catch (error) {
    cloud.error = error?.message || '云端保存失败'
    replaceState(lastPersistedState)
    return { ok: false, message: cloud.error }
  } finally {
    cloudSaveInProgress = false
  }
}

async function retryCloud(operation, attempts = 3) {
  let result
  for (let index = 0; index < attempts; index += 1) {
    result = await operation()
    if (result?.ok) return result
    if (index < attempts - 1) await new Promise((resolve) => window.setTimeout(resolve, 350 * (index + 1)))
  }
  return result
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
  if (!sharedStateEnabled) return
  window.clearTimeout(cloudSaveTimer)
  cloudSaveTimer = window.setTimeout(async () => {
    cloudSaveInProgress = true
    try {
      const latest = await fetchSharedState()
      if (!latest.ok || (latest.data && latest.updatedAt !== cloud.lastSavedAt)) {
        if (latest.ok && latest.data) {
          replaceState(latest.data)
          lastPersistedState = cloneState()
          cloud.lastSavedAt = latest.updatedAt
        }
        cloud.error = latest.ok ? '数据已在其他设备更新，页面已刷新，请重新操作' : latest.message
        return
      }
      const result = await saveSharedState(cloneState())
      if (result.ok) {
        cloud.error = ''
        cloud.lastSavedAt = result.updatedAt
        lastPersistedState = cloneState()
      } else {
        cloud.error = result.message
        replaceState(lastPersistedState)
      }
    } finally {
      cloudSaveInProgress = false
    }
  }, 300)
}

function setSession(memberId) {
  session.memberId = memberId
  window.localStorage.removeItem(SESSION_KEY)
}

function bySortOrder(a, b) {
  const orderDiff = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
  return orderDiff || String(a.id || '').localeCompare(String(b.id || ''))
}

function nextOutputOrder(list) {
  const visibleOrders = list
    .filter((item) => item.visible_on_home !== false)
    .map((item) => Number(item.sort_order) || 0)
  return Math.max(0, ...visibleOrders) + 1
}

function hasVisibleOutputOrderConflict(list, payload, existing) {
  const targetOrder = Number(payload.sort_order)
  const currentId = String(existing?.id || payload.id || '')
  if (payload.visible_on_home === false || !Number.isInteger(targetOrder) || targetOrder < 1) {
    return false
  }

  return list.some(
    (item) =>
      String(item.id || '') !== currentId &&
      item.visible_on_home !== false &&
      Number(item.sort_order) === targetOrder,
  )
}

function nextAvailableOutputOrder(usedOrders) {
  let order = 1
  while (usedOrders.has(order)) order += 1
  return order
}

function normalizeOutputOrders(list) {
  const usedVisibleOrders = new Set()
  const sorted = [...list].sort(bySortOrder)
  for (const item of sorted) {
    const order = Number(item.sort_order)
    item.sort_order = Number.isInteger(order) && order > 0 ? order : nextAvailableOutputOrder(usedVisibleOrders)
    if (item.visible_on_home === false) continue
    if (usedVisibleOrders.has(item.sort_order)) {
      item.sort_order = nextAvailableOutputOrder(usedVisibleOrders)
    }
    usedVisibleOrders.add(item.sort_order)
  }
}

function normalizeOutputVisibility(list) {
  for (const item of list) {
    if (typeof item.visible_on_home !== 'boolean') item.visible_on_home = true
  }
}

function removeTemplateOutputs(data) {
  const templatePublicationIds = new Set(['pub-1', 'pub-2'])
  const templatePublicationTitles = new Set([
    '工业视觉缺陷检测中的多尺度特征融合方法研究',
    '面向多源工业数据的联邦学习系统',
  ])
  const templateAwardIds = new Set(['award-1'])
  const templateAwardTitles = new Set(['研究生创新实践竞赛一等奖'])

  data.publications = data.publications.filter(
    (item) => !templatePublicationIds.has(item.id) && !templatePublicationTitles.has(item.title),
  )
  data.awards = data.awards.filter(
    (item) => !templateAwardIds.has(item.id) && !templateAwardTitles.has(item.title),
  )
}

function ensureDefaultPublications(data, seeded, force = false) {
  if (!force && data.publications.length > 0) return
  const existingKeys = new Set(
    data.publications.map((item) => item.id || item.title).filter(Boolean),
  )
  for (const publication of seeded.publications) {
    if (existingKeys.has(publication.id) || existingKeys.has(publication.title)) continue
    data.publications.push(JSON.parse(JSON.stringify(publication)))
  }
}

function ensureDefaultPatents(data, seeded, force = false) {
    const existingKeys = new Set(data.projects.map((item) => item.id || item.title).filter(Boolean))
  const hasPatents = data.projects.some((item) => item.category === '专利' || item.patent_no)
  if (!force && hasPatents) return
  for (const patent of seeded.projects) {
    if (existingKeys.has(patent.id) || existingKeys.has(patent.title)) continue
    data.projects.push(JSON.parse(JSON.stringify(patent)))
  }
}

export function useLabStore() {
  const currentMember = computed(() => state.members.find((item) => item.id === session.memberId) || null)
  const siteMembers = computed(() =>
    state.members.filter((item) => item.visible_on_site && item.status === 'active' && item.staff_id !== 'admin'),
  )
  const sortedPublications = computed(() => [...state.publications].sort(bySortOrder))
  const sortedProjects = computed(() => [...state.projects].sort(bySortOrder))
  const sortedPatents = computed(() => sortedProjects.value.filter((item) => item.category === '专利' || item.patent_no))
  const sortedResearchProjects = computed(() => [...state.researchProjects].sort(bySortOrder))
  const sortedSoftwareCopyrights = computed(() => [...state.softwareCopyrights].sort(bySortOrder))
  const sortedAwards = computed(() => [...state.awards].sort(bySortOrder))
  const homePublications = computed(() => sortedPublications.value.filter((item) => item.visible_on_home !== false))
  const homeAwards = computed(() => sortedAwards.value.filter((item) => item.visible_on_home !== false))

  async function syncSharedState() {
    if (!sharedStateEnabled || cloud.loading || cloudSaveInProgress) return
    cloud.loading = true
    cloud.error = ''
    const result = await fetchSharedState()
    if (result.ok && result.data) {
      const remoteData = migrateData(result.data)
      const remoteUpdatedAt = stateUpdatedTime(remoteData, result.updatedAt)
      const localUpdatedAt = stateUpdatedTime(state)
      if (!initialCloudSyncComplete || remoteUpdatedAt > localUpdatedAt) {
        replaceState(remoteData)
        lastPersistedState = cloneState()
      }
      // Always remember the version that was read from the cloud. Without
      // this baseline, the first admin save after a sync is incorrectly
      // treated as a conflicting edit from another device.
      cloud.lastSavedAt = result.updatedAt || remoteData.meta?.updatedAt || ''
    } else if (result.ok && !result.data) {
      if (!stateUpdatedTime(state)) writeLocalState()
      const seedResult = await saveSharedState(cloneState())
      if (!seedResult.ok) cloud.error = seedResult.message
      else {
        cloud.lastSavedAt = seedResult.updatedAt
        lastPersistedState = cloneState()
      }
    } else {
      cloud.error = result.message
    }
    cloud.loading = false
    cloud.ready = true
    initialCloudSyncComplete = true
  }

  function login(staffId, password) {
    const normalizedStaffId = staffId.trim()
    const member = state.members.find((item) => item.staff_id === normalizedStaffId)
    if (!member) return { ok: false, message: '账号或密码不正确' }
    if (member.password !== password) return { ok: false, message: '账号或密码不正确' }
    setSession(member.id)
    return { ok: true, member }
  }

  function logout() {
    setSession('')
  }

  async function changePassword(oldPassword, newPassword) {
    if (!currentMember.value) return { ok: false, message: '请先登录' }
    if (currentMember.value.password !== oldPassword) return { ok: false, message: '旧密码不正确' }
    currentMember.value.password = newPassword
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '密码保存失败' }
  }

  async function registerMember(payload) {
    const staffId = payload.staff_id.trim()
    const role = payload.role === 'alumni' ? 'alumni' : 'student'
    const graduationYear = String(payload.graduation_year ?? '').trim()
    if (role === 'alumni' && !isValidGraduationYear(graduationYear)) {
      return { ok: false, message: '请填写有效的毕业年份' }
    }
    if (state.members.some((item) => item.staff_id === staffId)) {
      return { ok: false, message: '账号已存在' }
    }
    if (state.pendingRegistrations.some((item) => item.staff_id === staffId)) {
      return { ok: false, message: '该账号正在等待审批' }
    }
    if (hasDoctoralStudentConflict(state.members, '', payload.grade || '', role)) {
      return { ok: false, message: '博士生只能保留一个' }
    }
    state.pendingRegistrations.push({
      id: uid('registration'),
      name: payload.name.trim(),
      staff_id: staffId,
      password: payload.password,
      role,
      grade: role === 'alumni' ? '' : payload.grade,
      graduation_year: role === 'alumni' ? graduationYear : '',
      direction: payload.direction.trim(),
      email: payload.email?.trim() || '',
      bio: payload.bio?.trim() || '',
      created_at: new Date().toISOString(),
    })
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function approveRegistration(id) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无审批权限' }
    const index = state.pendingRegistrations.findIndex((item) => item.id === id)
    if (index < 0) return { ok: false, message: '申请不存在' }
    const record = state.pendingRegistrations[index]
    if (state.members.some((item) => item.staff_id === record.staff_id)) {
      state.pendingRegistrations.splice(index, 1)
      await saveImmediately()
      return { ok: false, message: '账号已存在' }
    }
    const role = record.role === 'alumni' ? 'alumni' : 'student'
    if (role === 'alumni' && record.graduation_year && !isValidGraduationYear(record.graduation_year)) {
      return { ok: false, message: '毕业年份无效，请核对注册申请' }
    }
    if (hasDoctoralStudentConflict(state.members, '', record.grade || '', role)) {
      return { ok: false, message: '博士生只能保留一个' }
    }
    state.members.push({
      id: uid('member'),
      name: record.name,
      staff_id: record.staff_id,
      password: record.password,
      role,
      grade: role === 'alumni' ? '' : record.grade,
      graduation_year: role === 'alumni' ? String(record.graduation_year ?? '').trim() : '',
      direction: record.direction,
      status: 'active',
      visible_on_site: role === 'alumni',
      permissions: studentPermissions(),
      ...memberProfileDefaults(record),
    })
    state.pendingRegistrations.splice(index, 1)
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function rejectRegistration(id) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    const index = state.pendingRegistrations.findIndex((item) => item.id === id)
    if (index >= 0) {
      state.pendingRegistrations.splice(index, 1)
      const result = await saveImmediately()
      return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
    }
    return { ok: false, message: '数据不存在' }
  }

  function isSuperAdmin(member = currentMember.value) {
    return Boolean(member?.staff_id === 'admin' && member?.permissions?.can_manage_members)
  }

  function canEditMentorPage() {
    return isSuperAdmin() || currentMember.value?.staff_id === 'zhangchong'
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

  async function addBooking(payload) {
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
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function deleteBooking(id) {
    const index = state.bookings.findIndex((item) => item.id === id)
    if (index < 0) return { ok: false, message: '预约不存在' }
    const item = state.bookings[index]
    if (item.member_id !== currentMember.value?.id && !canDeleteOthers()) return { ok: false, message: '暂无权限' }
    state.bookings.splice(index, 1)
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function addReimbursement(payload) {
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
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function updateReimbursementStatus(id, status) {
    const item = state.reimbursements.find((record) => record.id === id)
    if (!item) return { ok: false, message: '记录不存在' }
    if (!canViewAll()) return { ok: false, message: '暂无权限' }
    item.status = status
    item.updated_at = new Date().toISOString()
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function deleteReimbursement(id) {
    const index = state.reimbursements.findIndex((item) => item.id === id)
    if (index < 0) return { ok: false, message: '记录不存在' }
    const item = state.reimbursements[index]
    if (item.member_id !== currentMember.value?.id && !canDeleteOthers()) return { ok: false, message: '暂无权限' }
    state.reimbursements.splice(index, 1)
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function upsertMember(payload) {
    if (!currentMember.value) return { ok: false, message: '请先登录' }
    const existing = state.members.find((item) => item.id === payload.id)
    const isAdminEditing = isSuperAdmin()
    if (!isAdminEditing) {
      if (!existing || existing.id !== currentMember.value.id) return { ok: false, message: '暂无权限' }
      if (existing.staff_id === 'zhangchong' && !payload.name?.trim()) return { ok: false, message: '请填写导师姓名' }
      if (existing.role === 'alumni' && payload.graduation_year && !isValidGraduationYear(payload.graduation_year)) {
        return { ok: false, message: '请填写有效的毕业年份' }
      }
      const nextGrade = shouldKeepStudyInfoEmpty(existing) || existing.role === 'alumni' ? '' : payload.grade || ''
      if (hasDoctoralStudentConflict(state.members, existing.id, nextGrade, existing.role)) {
        return { ok: false, message: '博士生只能保留一个' }
      }
      if (existing.staff_id === 'zhangchong') {
        existing.name = payload.name.trim()
        if ('mentor_title' in payload) existing.mentor_title = String(payload.mentor_title ?? '').trim()
      }
      if (!shouldKeepStudyInfoEmpty(existing)) {
        existing.grade = nextGrade
        existing.direction = payload.direction?.trim() || ''
      }
      if (existing.role === 'alumni') existing.graduation_year = String(payload.graduation_year ?? '').trim()
      existing.phone = payload.phone?.trim() || ''
      existing.email = payload.email?.trim() || ''
      existing.wechat = payload.wechat?.trim() || ''
      existing.qq = payload.qq?.trim() || ''
      existing.photo = payload.photo || ''
      existing.bio = payload.bio?.trim() || ''
      const result = await saveImmediately()
      return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
    }
    const emptyStudyInfo = shouldKeepStudyInfoEmpty(payload)
    if (!payload.name?.trim() || !payload.staff_id?.trim()) return { ok: false, message: '请填写姓名和工号/学号' }
    if (existing?.staff_id === 'admin' && (payload.name.trim() !== 'admin' || payload.staff_id.trim() !== 'admin' || payload.role !== 'superadmin')) {
      return { ok: false, message: '系统管理员身份不可修改' }
    }
    if (existing?.staff_id === 'zhangchong' && (payload.staff_id.trim() !== 'zhangchong' || payload.role !== 'teacher')) {
      return { ok: false, message: '导师账号和身份不可修改' }
    }
    if (existing?.staff_id === '202522000755' && payload.staff_id.trim() !== '202522000755') {
      return { ok: false, message: '该账号标识不可修改' }
    }
    if (payload.role === 'alumni' && payload.graduation_year && !isValidGraduationYear(payload.graduation_year)) {
      return { ok: false, message: '请填写有效的毕业年份' }
    }
    if (payload.role === 'alumni' && !payload.graduation_year && (!existing || existing.role !== 'alumni')) {
      return { ok: false, message: '请填写毕业年份' }
    }
    const normalizedStaffId = payload.staff_id.trim()
    const duplicateAccount = state.members.some(
      (item) => item.id !== existing?.id && item.staff_id === normalizedStaffId,
    )
    if (duplicateAccount) return { ok: false, message: '工号/学号已存在' }
    if (hasDoctoralStudentConflict(state.members, existing?.id || payload.id || '', emptyStudyInfo ? '' : payload.grade || '', payload.role)) {
      return { ok: false, message: '博士生只能保留一个' }
    }
    const base = {
      name: payload.name.trim(),
      staff_id: normalizedStaffId,
      role: payload.role,
      grade: emptyStudyInfo || payload.role === 'alumni' ? '' : payload.grade,
      graduation_year: payload.role === 'alumni' ? String(payload.graduation_year ?? '').trim() : '',
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
    if ('mentor_title' in payload) base.mentor_title = String(payload.mentor_title ?? '').trim()
    if (base.staff_id !== 'admin') {
      if (base.role === 'superadmin') base.role = base.staff_id === 'zhangchong' ? 'teacher' : 'student'
      base.permissions = studentPermissions()
    }
    let passwordTouched = false
    if (existing) {
      Object.assign(existing, base)
      if (currentMember.value?.staff_id === 'admin' && payload.newPassword?.trim()) {
        existing.password = payload.newPassword.trim()
        passwordTouched = true
      }
    } else {
      state.members.push({
        id: uid('member'),
        password: payload.newPassword?.trim() || '123456',
        ...memberProfileDefaults(),
        ...base,
      })
      passwordTouched = true
    }
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function removeMember(id) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    if (id === currentMember.value?.id) return { ok: false, message: '不能删除当前登录账号' }
    const index = state.members.findIndex((item) => item.id === id)
    if (index >= 0) {
      state.members.splice(index, 1)
      const result = await saveImmediately()
      return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
    }
    return { ok: true }
  }

  async function upsertMemberAchievement(memberId, payload) {
    const member = state.members.find((item) => item.id === memberId)
    if (!member) return { ok: false, message: '成员不存在' }
    if (!currentMember.value) return { ok: false, message: '请先登录' }
    if (!isSuperAdmin() && currentMember.value.id !== memberId) return { ok: false, message: '暂无权限' }
    const title = payload.title?.trim()
    if (!title) return { ok: false, message: '请填写成果名称' }
    if (!Array.isArray(member.achievements)) member.achievements = []
    const existing = member.achievements.find((item) => item.id === payload.id)
    const achievement = {
      id: existing?.id || uid('achievement'),
      title,
      type: payload.type?.trim() || '',
      year: payload.year?.trim() || '',
      description: payload.description?.trim() || '',
      link: payload.link?.trim() || '',
    }
    if (existing) Object.assign(existing, achievement)
    else member.achievements.push(achievement)
    const result = await saveImmediately()
    return result.ok
      ? { ok: true, id: achievement.id }
      : { ok: false, message: result.message || '保存失败' }
  }

  async function removeMemberAchievement(memberId, achievementId) {
    const member = state.members.find((item) => item.id === memberId)
    if (!member) return { ok: false, message: '成员不存在' }
    if (!currentMember.value) return { ok: false, message: '请先登录' }
    if (!isSuperAdmin() && currentMember.value.id !== memberId) return { ok: false, message: '暂无权限' }
    const index = (member.achievements || []).findIndex((item) => item.id === achievementId)
    if (index < 0) return { ok: false, message: '成果不存在' }
    member.achievements.splice(index, 1)
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '删除失败' }
  }

  async function upsertOutput(kind, payload) {
    if (kind === 'patents') {
      kind = 'projects'
      payload = { ...payload, category: '专利' }
    }
    const list = state[kind]
    if (!Array.isArray(list)) return { ok: false, message: '数据类型不存在' }
    const existing = list.find((item) => item.id === payload.id)
    if (!isSuperAdmin()) {
      if (currentMember.value?.staff_id !== 'zhangchong' || !existing) return { ok: false, message: '暂无权限' }
      const allowedFields = {
        publications: ['title', 'authors'],
        awards: ['title', 'winner'],
        projects: ['title', 'authors', 'patent_no'],
        researchProjects: ['title', 'source', 'project_no', 'note'],
        softwareCopyrights: ['title', 'authors', 'patent_no', 'winner'],
      }[kind]
      if (!allowedFields) return { ok: false, message: '暂无权限' }
      if (payload.title !== undefined && !String(payload.title).trim()) return { ok: false, message: '请填写标题' }
      for (const field of allowedFields) {
        if (payload[field] !== undefined) existing[field] = String(payload[field]).trim()
      }
      const result = await saveImmediately()
      return result.ok ? { ok: true, id: existing.id } : { ok: false, message: result.message || '保存失败' }
    }
    if (!payload.title?.trim()) return { ok: false, message: '请填写标题' }
    const requestedOrder = payload.sort_order === undefined
      ? existing?.sort_order ?? nextOutputOrder(list)
      : Number(payload.sort_order)
    if (!Number.isInteger(requestedOrder) || requestedOrder < 1) {
      return { ok: false, message: '展示编号必须是正整数' }
    }
    payload.sort_order = requestedOrder
    if (payload.visible_on_home === undefined && existing) {
      payload.visible_on_home = existing.visible_on_home !== false
    }
    if (hasVisibleOutputOrderConflict(list, payload, existing)) {
      return { ok: false, message: `主页展示编号 ${requestedOrder} 已被占用，请更换编号` }
    }
    if (kind === 'researchProjects') {
      payload.title = payload.title?.trim() || ''
      payload.source = payload.source?.trim() || ''
      payload.project_no = payload.project_no?.trim() || ''
      payload.note = payload.note?.trim() || ''
    }
    if (kind === 'publications') {
      payload.paper_link = payload.paper_link?.trim() || ''
    }
    if (kind === 'awards') {
      payload.image_data = payload.image_data || ''
      payload.image_url = payload.image_url?.trim() || ''
      payload.image_name = payload.image_name?.trim() || ''
    }
    if (kind === 'softwareCopyrights') {
      payload.image_data = payload.image_data || ''
      payload.image_url = payload.image_url?.trim() || ''
      payload.image_name = payload.image_name?.trim() || ''
      payload.winner = payload.winner?.trim() || ''
    }
    if (existing) {
      Object.assign(existing, payload)
    } else {
      const savedId = uid(kind)
      list.push({
        ...payload,
        id: savedId,
      })
      payload.id = savedId
    }
    const result = await saveImmediately()
    return result.ok ? { ok: true, id: payload.id || existing?.id || '' } : { ok: false, message: result.message || '保存失败' }
  }

  async function removeOutput(kind, id) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    if (kind === 'patents') kind = 'projects'
    const list = state[kind]
    if (!Array.isArray(list)) return { ok: false, message: '数据类型不存在' }
    const index = list.findIndex((item) => item.id === id)
    if (index >= 0) {
      list.splice(index, 1)
      const result = await saveImmediately()
      return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
    }
    return { ok: true }
  }

  async function moveOutputUp(kind, id) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    if (kind === 'patents') kind = 'projects'
    if (!Array.isArray(state[kind])) return { ok: false, message: '数据类型不存在' }
    const list = state[kind].sort(bySortOrder)
    const index = list.findIndex((item) => item.id === id)
    if (index <= 0) return { ok: false, message: '无法上移' }
    const current = list[index]
    const previous = list[index - 1]
    const order = current.sort_order
    current.sort_order = previous.sort_order
    previous.sort_order = order
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function updateSiteContent(payload) {
    if (!canManageSite()) return { ok: false, message: '暂无权限' }
    const nextResearchLines = Array.isArray(payload.researchLines) ? payload.researchLines : state.site.researchLines
    const nextToolCards = Array.isArray(payload.toolCards) ? payload.toolCards : state.site.toolCards
    state.site = {
      ...state.site,
      ...payload,
      researchLines: nextResearchLines.map((item) => ({
        title: String(item?.title ?? '').trim(),
        tag: String(item?.tag ?? '').trim(),
        icon: item?.icon || 'network',
        tone: item?.tone || 'jade',
        text: String(item?.text ?? '').trim(),
      })),
      toolCards: nextToolCards.map((item) => ({
        key: item?.key || '',
        title: String(item?.title ?? '').trim(),
        text: String(item?.text ?? '').trim(),
      })),
    }
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
  }

  async function resetDemoData() {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    Object.assign(state, seedData())
    const result = await saveImmediately()
    return result.ok ? { ok: true } : { ok: false, message: result.message || '保存失败' }
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
      sortedPatents,
    sortedResearchProjects,
      sortedSoftwareCopyrights,
      sortedAwards,
      homePublications,
      homeAwards,
      syncSharedState,
    login,
    logout,
    changePassword,
    registerMember,
    approveRegistration,
    rejectRegistration,
    isSuperAdmin,
    canEditMentorPage,
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
    upsertMemberAchievement,
    removeMemberAchievement,
    upsertOutput,
    removeOutput,
    moveOutputUp,
    updateSiteContent,
    resetDemoData,
    todayString,
  }
}
