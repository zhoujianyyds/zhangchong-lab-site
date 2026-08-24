import { computed, reactive } from 'vue'
import { fetchSharedState, saveSharedState, sharedStateEnabled } from '../lib/cloudState'

const STORAGE_KEY = 'lab-site-vue-store-v1'
const SESSION_KEY = 'lab-site-vue-session-v1'
const DATA_VERSION = 'mentor-all-publications-v1'
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
    peopleIntro: '张翀老师负责指导，研究成员共 12 人；研二 6 人、博士 1 人、研一 5 个名额暂时保留。',
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

function hasBrokenQuestionMarks(value) {
  return typeof value === 'string' && /\?{2,}/.test(value)
}

function defaultAwardImage(itemId) {
  const imageMap = {
    'award-2025-kjjb-1': '/awards/award-2025-kjjb-1.jpg',
    'award-2025-kjjb-2': '/awards/award-2025-kjjb-2.jpg',
    'award-2025-fmzl': '/awards/award-2025-fmzl.jpg',
    'award-2024-jsfm-2': '/awards/award-2024-jsfm-2.jpg',
    'award-2024-kjjb-2': '/awards/award-2024-kjjb-2.jpg',
    'award-2023-jsfm-1': '/awards/award-2023-jsfm-1.jpg',
    'award-2023-kjjb-2': '/awards/award-2023-kjjb-2.jpg',
  }
  return imageMap[itemId] || ''
}

function normalizeOutputAssets(data, seeded) {
  const seededAwards = new Map(seeded.awards.map((item) => [item.id, item]))

  for (const item of data.publications) {
    item.paper_link = typeof item.paper_link === 'string' ? item.paper_link.trim() : ''
    if (hasBrokenQuestionMarks(item.title)) item.title = ''
    for (const field of ['authors', 'journal', 'volume_issue', 'pages', 'doi', 'note']) {
      if (hasBrokenQuestionMarks(item[field])) item[field] = ''
    }
  }

  for (const item of data.awards) {
    item.image_data = typeof item.image_data === 'string' ? item.image_data : ''
    item.image_url = typeof item.image_url === 'string' ? item.image_url.trim() : ''
    item.image_name = typeof item.image_name === 'string' ? item.image_name : ''
    if (!item.image_data && !item.image_url) item.image_url = defaultAwardImage(item.id)
    if (!item.image_name && item.image_url) item.image_name = `${item.id}.jpg`
    if (hasBrokenQuestionMarks(item.title)) item.title = seededAwards.get(item.id)?.title || ''
    if (hasBrokenQuestionMarks(item.winner)) item.winner = seededAwards.get(item.id)?.winner || ''
  }

  for (const [field, fallback] of Object.entries(seeded.site)) {
    if (typeof fallback === 'string' && hasBrokenQuestionMarks(data.site[field])) {
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

function hasDoctoralStudentConflict(members, memberId, grade) {
  if (grade !== '博士') return false
  return members.some((member) => member.id !== memberId && member.grade === '博士')
}

function enforceCoreMemberIdentities(data) {
  const systemAdmin = data.members.find((item) => item.id === 'm-admin' || item.staff_id === 'admin')
  if (systemAdmin) {
    systemAdmin.name = 'admin'
    systemAdmin.staff_id = 'admin'
    systemAdmin.password = ADMIN_PASSWORD
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
    if (!zhangChong.email) zhangChong.email = 'zhsngchong92@swpu.edu.cn'
    if (!zhangChong.bio) {
      zhangChong.bio =
        '西南石油大学计算机与软件学院特聘副研究员、硕士生导师，主要围绕油气井、嵌入式系统、智能感知与 Agent 智能体开展研究与工程实践。'
    }
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
          email: 'zhsngchong92@swpu.edu.cn',
          bio: '西南石油大学计算机与软件学院特聘副研究员、硕士生导师，主要围绕油气井、嵌入式系统、智能感知与 Agent 智能体开展研究与工程实践。',
        }),
      },
      studentMember('m-student-zhoujian', '周健', '202522000755', '研二', '油气井'),
      studentMember('m-student-zhaodewei', '赵德伟', '20240002', '研二', '嵌入式'),
      studentMember('m-student-yanghuaiyu', '杨怀宇', '20240003', '研二', 'Agent'),
      studentMember('m-student-xiangyufei', '向与飞', '20240004', '研二', '油气井'),
      studentMember('m-student-wulingna', '巫玲娜', '20240005', '研二', '嵌入式'),
      studentMember('m-student-lihaifeng', '李海峰', '20240006', '研二', 'Agent'),
      studentMember('m-student-yanyi-01', '博士生', '20250001', '博士', '待定'),
      studentMember('m-student-yanyi-02', '待定 02', '20250002', '研一', '待定'),
      studentMember('m-student-yanyi-03', '待定 03', '20250003', '研一', '待定'),
      studentMember('m-student-yanyi-04', '待定 04', '20250004', '研一', '待定'),
      studentMember('m-student-yanyi-05', '待定 05', '20250005', '研一', '待定'),
      studentMember('m-student-yanyi-06', '待定 06', '20250006', '研一', '待定'),
    ],
    pendingRegistrations: [],
    publications: defaultMentorPublications(),
    projects: defaultMentorPatents(),
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
      Array.isArray(data.site?.researchLines) && data.site.researchLines.length > 0
        ? data.site.researchLines
        : seeded.site.researchLines,
  }
  for (const key of ['rooms', 'members', 'pendingRegistrations', 'publications', 'projects', 'awards', 'bookings', 'reimbursements']) {
    if (!Array.isArray(data[key])) data[key] = seeded[key]
  }
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
  removeTemplateOutputs(data)
  ensureDefaultPublications(data, seeded, needsUpgrade)
  ensureDefaultPatents(data, seeded, needsUpgrade)
  normalizeOutputAssets(data, seeded)
  normalizeOutputOrders(data.publications)
  normalizeOutputOrders(data.awards)
  enforceCoreMemberIdentities(data)
  ensureDoctoralStudent(data)
  if (needsUpgrade) {
    const systemAdmin = data.members.find((item) => item.id === 'm-admin' || item.staff_id === 'system-admin')
    if (systemAdmin) {
      systemAdmin.name = 'admin'
      systemAdmin.staff_id = 'admin'
      systemAdmin.password = ADMIN_PASSWORD
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
  ensureDoctoralStudent(data)
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

function writeLocalState() {
  state.meta = {
    ...(state.meta || {}),
    dataVersion: DATA_VERSION,
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
  window.clearTimeout(cloudSaveTimer)
  cloudSaveInProgress = true
  try {
    const result = await saveSharedState(cloneState())
    if (result.ok) {
      cloud.error = ''
      cloud.lastSavedAt = new Date().toISOString()
    } else {
      cloud.error = result.message
    }
    return result
  } finally {
    cloudSaveInProgress = false
  }
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
      const result = await saveSharedState(cloneState())
      if (result.ok) {
        cloud.error = ''
        cloud.lastSavedAt = new Date().toISOString()
      } else {
        cloud.error = result.message
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
      if (remoteUpdatedAt > localUpdatedAt) {
        replaceState(remoteData)
        cloud.lastSavedAt = result.updatedAt || remoteData.meta?.updatedAt || ''
      }
    } else if (result.ok && !result.data) {
      if (!stateUpdatedTime(state)) writeLocalState()
      const seedResult = await saveSharedState(cloneState())
      if (!seedResult.ok) cloud.error = seedResult.message
    } else {
      cloud.error = result.message
    }
    cloud.loading = false
    cloud.ready = true
  }

  function login(staffId, password) {
    const normalizedStaffId = staffId.trim()
    const member = state.members.find((item) => item.staff_id === normalizedStaffId)
    if (!member) return { ok: false, message: '账号或密码不正确' }
    if (normalizedStaffId === 'admin' && password === ADMIN_PASSWORD && member.password !== ADMIN_PASSWORD) {
      member.password = ADMIN_PASSWORD
      member.name = 'admin'
      member.role = 'superadmin'
      member.permissions = superAdminPermissions()
      save()
    }
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
    if (state.members.some((item) => item.staff_id === staffId)) {
      return { ok: false, message: '账号已存在' }
    }
    if (state.pendingRegistrations.some((item) => item.staff_id === staffId)) {
      return { ok: false, message: '该账号正在等待审批' }
    }
    if (hasDoctoralStudentConflict(state.members, '', payload.grade || '')) {
      return { ok: false, message: '博士生只能保留一个' }
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
    if (hasDoctoralStudentConflict(state.members, '', record.grade || '')) {
      return { ok: false, message: '博士生只能保留一个' }
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
      const nextGrade = shouldKeepStudyInfoEmpty(existing) ? '' : payload.grade || ''
      if (hasDoctoralStudentConflict(state.members, existing.id, nextGrade)) {
        return { ok: false, message: '博士生只能保留一个' }
      }
      existing.name = payload.name?.trim() || existing.name
      if (!shouldKeepStudyInfoEmpty(existing)) {
        existing.grade = nextGrade
        existing.direction = payload.direction?.trim() || ''
      }
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
    if (hasDoctoralStudentConflict(state.members, existing?.id || payload.id || '', emptyStudyInfo ? '' : payload.grade || '')) {
      return { ok: false, message: '博士生只能保留一个' }
    }
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

  async function upsertOutput(kind, payload) {
    if (!isSuperAdmin()) return { ok: false, message: '暂无权限' }
    const list = state[kind]
    if (!Array.isArray(list)) return { ok: false, message: '数据类型不存在' }
    const existing = list.find((item) => item.id === payload.id)
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
    if (kind === 'publications') {
      payload.paper_link = payload.paper_link?.trim() || ''
    }
    if (kind === 'awards') {
      payload.image_data = payload.image_data || ''
      payload.image_url = payload.image_url?.trim() || ''
      payload.image_name = payload.image_name?.trim() || ''
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
