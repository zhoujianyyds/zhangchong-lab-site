from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


ROOT = Path(__file__).resolve().parents[1]
DESKTOP = Path.home() / "Desktop"
OUTPUT = DESKTOP / "张翀研究小组网站系统说明文档.pdf"


def register_font():
    candidates = [
        Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simhei.ttf"),
        Path("C:/Windows/Fonts/simsun.ttc"),
    ]
    for font_path in candidates:
        if font_path.exists():
            pdfmetrics.registerFont(TTFont("CN", str(font_path)))
            pdfmetrics.registerFont(TTFont("CN-Bold", str(font_path)))
            return "CN", "CN-Bold"
    return "Helvetica", "Helvetica-Bold"


FONT, BOLD = register_font()
styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="DocTitle",
        fontName=BOLD,
        fontSize=22,
        leading=30,
        alignment=TA_CENTER,
        spaceAfter=12,
        textColor=colors.HexColor("#0f172a"),
    )
)
styles.add(
    ParagraphStyle(
        name="SectionTitle",
        fontName=BOLD,
        fontSize=14,
        leading=20,
        spaceBefore=12,
        spaceAfter=8,
        textColor=colors.HexColor("#123a5f"),
    )
)
styles.add(
    ParagraphStyle(
        name="BodyCN",
        fontName=FONT,
        fontSize=10.5,
        leading=16,
        spaceAfter=6,
        textColor=colors.HexColor("#172033"),
    )
)
styles.add(
    ParagraphStyle(
        name="SmallCN",
        fontName=FONT,
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#475569"),
    )
)


def p(text, style="BodyCN"):
    return Paragraph(text, styles[style])


def heading(text):
    return Paragraph(text, styles["SectionTitle"])


def bullets(items):
    return ListFlowable(
        [ListItem(p(item), leftIndent=8) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=18,
    )


def table(rows, widths):
    t = Table(rows, colWidths=widths, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), FONT),
                ("FONTNAME", (0, 0), (-1, 0), BOLD),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8f2ff")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


def build():
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="张翀研究小组网站系统说明文档",
    )
    story = []
    story.append(p("张翀研究小组网站系统说明文档", "DocTitle"))
    story.append(p("用途：记录当前网站系统的软件组成、数据库、操作方式、部署方式、文件路径和后续拓展建议，方便后期维护与二次开发。", "BodyCN"))
    story.append(Spacer(1, 4 * mm))

    story.append(heading("1. 系统当前定位"))
    story.append(
        bullets(
            [
                "系统名称：张翀研究小组网站。",
                "主要用途：展示研究方向、团队成员、代表性成果、联系方式；管理员可维护成员、密码、页面文字、成果数据和注册审批。",
                "当前形态：Vue 前端单页应用，配合 Supabase 在线数据库保存共享数据，通过 GitHub + Netlify 自动部署上线。",
            ]
        )
    )

    story.append(heading("2. 软件与服务清单"))
    story.append(
        table(
            [
                ["类别", "当前使用", "作用"],
                ["前端框架", "Vue 3 + Vite", "负责网站页面、交互、登录注册、成员管理等。"],
                ["路由", "vue-router", "控制首页、注册、个人空间、成员管理、成果管理等页面访问。"],
                ["图标", "lucide-vue-next", "提供登录、眼睛、编辑、删除等按钮图标。"],
                ["在线数据库", "Supabase", "保存所有共享数据，让电脑和手机看到同一份内容。"],
                ["部署平台", "Netlify", "自动构建并发布网站，提供公网访问地址。"],
                ["代码托管", "GitHub", "保存代码；推送代码后触发 Netlify 自动部署。"],
            ],
            [28 * mm, 42 * mm, 88 * mm],
        )
    )

    story.append(heading("3. 数据库说明"))
    story.append(
        bullets(
            [
                "数据库服务：Supabase。",
                "项目 URL：https://irjjvlzhrchsudrbhmbs.supabase.co",
                "数据表：lab_site_state。",
                "主记录 id：main。",
                "保存方式：网站把成员、密码、注册申请、成果、页面文字等合并存为一份 JSON 状态。任何设备修改成功后都会写入 Supabase，另一台设备会自动拉取最新数据。",
                "注意：当前为了满足管理员“查看和修改密码”的需求，密码以可查看形式保存在共享状态中。正式长期使用建议后续改成后端认证和密码哈希，避免明文密码风险。",
            ]
        )
    )

    story.append(heading("4. 哪些内容已经持久化"))
    story.append(
        bullets(
            [
                "成员资料：姓名、账号、身份、年级、研究方向、电话、邮箱、微信、QQ、照片、简介、网站显示状态。",
                "用户密码：普通用户改密码、管理员改普通用户密码后都会保存到 Supabase。",
                "注册申请与审批：注册后进入待审批列表，admin 审批通过或拒绝会保存。",
                "首页文字和站点文案：管理员双击可编辑的文字会保存。",
                "研究方向、代表性成果、项目、获奖等展示数据会保存。",
                "不持久化登录状态：刷新或重新进入网站需要重新登录，这是按需求保留的安全行为。",
                "验证码不持久化：每次打开或刷新重新生成。",
            ]
        )
    )

    story.append(heading("5. 项目文件路径"))
    story.append(
        table(
            [
                ["路径", "说明"],
                [str(ROOT), "本机 Vue 项目根目录。"],
                [str(ROOT / "src/stores/labStore.js"), "核心数据仓库：默认数据、登录、权限、持久化、Supabase 同步。"],
                [str(ROOT / "src/lib/cloudState.js"), "Supabase 连接、读取、保存共享状态。"],
                [str(ROOT / "src/App.vue"), "顶部导航、登录菜单、修改密码弹窗、自动同步定时器。"],
                [str(ROOT / "src/router/index.js"), "路由和权限拦截。"],
                [str(ROOT / "src/views/HomeView.vue"), "首页展示和管理员双击编辑。"],
                [str(ROOT / "src/views/MembersView.vue"), "成员管理、注册审批、管理员修改密码。"],
                [str(ROOT / "src/views/PersonalSpaceView.vue"), "老师/学生个人空间。"],
                [str(ROOT / "src/views/OutputsView.vue"), "成果和站点内容管理。"],
                [str(ROOT / "src/style.css"), "整体视觉、深色/浅色、移动端适配样式。"],
            ],
            [70 * mm, 88 * mm],
        )
    )

    story.append(PageBreak())
    story.append(heading("6. 网站操作说明"))
    story.append(
        bullets(
            [
                "未登录：可以浏览首页和公开成员信息；右上角人形图标可打开登录/注册。",
                "注册：填写资料后提交，进入管理员审批列表，审批通过后才能登录。",
                "普通成员登录：只能进入个人空间，修改自己的资料和密码。",
                "admin 登录：可以进入成员管理和成果/站点内容管理；可以审批注册、添加/删除成员、修改普通成员密码、查看密码、编辑网站文字。",
                "成员编辑弹窗：现在点击弹窗外不会自动关闭，避免正在填写的信息丢失；需要点关闭按钮才关闭。",
                "页面文字编辑：首页和标题等文本由 admin 双击编辑，保存成功后写入在线数据库。",
                "同步：页面打开后会定时同步云端数据；一台设备改成功后，另一台设备等待几秒或刷新即可看到。",
            ]
        )
    )

    story.append(heading("7. 部署与更新流程"))
    story.append(
        bullets(
            [
                "代码仓库：https://github.com/zhoujianyyds/zhangchong-lab-site.git",
                "推荐部署方式：GitHub 绑定 Netlify，Netlify 监听 GitHub 仓库自动部署。",
                "日常改代码流程：在 IDEA 或 Codex 修改代码，运行 npm run build 检查，通过后 git add / git commit / git push。",
                "自动部署：代码推送到 GitHub 后，Netlify 自动拉取、构建并发布；国内访问 Netlify/GitHub 时建议开启加速器。",
                "Netlify 构建命令：npm run build。",
                "Netlify 发布目录：dist。",
                "环境变量：VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY、VITE_SUPABASE_STATE_ID。",
            ]
        )
    )

    story.append(heading("8. 本地开发命令"))
    story.append(
        table(
            [
                ["命令", "用途"],
                ["npm install", "第一次打开项目时安装依赖。"],
                ["npm run dev", "启动本地开发服务，通常是 http://127.0.0.1:5173。"],
                ["npm run build", "打包生产版本，同时验证代码是否能正常构建。"],
                ["git status", "查看哪些文件改了。"],
                ["git add . && git commit -m \"说明\" && git push", "提交并推送代码，触发 Netlify 自动部署。"],
            ],
            [58 * mm, 100 * mm],
        )
    )

    story.append(heading("9. 后续改良建议"))
    story.append(
        bullets(
            [
                "账号安全：后续正式使用时，把密码从前端 JSON 状态迁移到 Supabase Auth 或后端服务，使用哈希密码。",
                "数据结构：当前是单表整站 JSON，简单好维护；当成员、成果很多时，可以拆成 members、outputs、site_content 等多张表。",
                "权限：继续保持路由拦截和按钮权限判断，新增页面时必须先在 router 和 store 权限里登记。",
                "图片：当前成员照片可直接保存为 base64，方便但数据会变大；后续建议迁移到 Supabase Storage。",
                "国内访问：免费方案可继续用 Netlify；如果国内访问稳定性要求高，后续可迁移到国内云静态托管并配置备案域名。",
                "备份：定期从 Supabase 导出 lab_site_state 表，防止误删。",
            ]
        )
    )

    story.append(heading("10. 本次修复记录"))
    story.append(
        bullets(
            [
                "修复新设备第一次打开时默认数据可能覆盖云端数据的问题。",
                "新增页面自动同步：打开页面后定时同步，切回页面也会同步。",
                "把成员、密码、注册审批、成果、站点文字等用户修改内容改为即时保存到 Supabase。",
                "个人空间、注册、成员管理、成果管理等保存操作会等待云端返回结果后再提示成功。",
                "修复成员编辑弹窗点击外部区域自动关闭导致资料丢失的问题。",
            ]
        )
    )

    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()
