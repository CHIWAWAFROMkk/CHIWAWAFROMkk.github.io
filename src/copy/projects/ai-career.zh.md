![文件夹与空白表单组成的工作台](/assets/editorial/records-desk.webp)
*AI 生成主题配图 · 非实际项目现场或产品截图*

经历、职位要求和待确认条件被放到一起，帮助理解材料为什么这样写、哪些内容还需要核实。

## 项目解决什么

将岗位、JD、真实经历、定向材料和投递反馈串在同一个本地工作台里，减少文件版本混乱，让每次推荐和材料修改都有依据。

![证据如何进入材料](/assets/editorial/career-evidence.svg)

已确认事实进入匹配与草稿，未知经历保留为核验项。最终内容仍由本人审阅。

### 实际实现的流程（公开版 0.8.5）

1. **建档与简历读取**：Profile 保存事实 ID、来源和确认状态；缺少档案时先引导建立资料。可读取 TXT、Markdown、DOCX、PDF 简历。
2. **岗位发现与入库**：手动导入或连接搜索 Provider（博查、Brave）；先核验候选，再去重进入 SQLite。岗位导入失败不会留下半成功记录。
3. **"今日"工作台**：一次突出一个最值得推进的岗位和唯一的主要操作，同时列出薪资、通勤、截止时间和推荐依据；其余岗位折叠为后续队列。修改资料后自动重算匹配度，已有的投递状态不受影响。
4. **分析与材料准备**：结构化 JD、解释匹配分、选择已确认证据，生成岗位专属简历草稿和投递材料。
5. **人工审阅与投递准备**：确认草稿后打开岗位页面及专用简历。浏览器辅助仍属实验功能：检查到异常即停止，按钮由本人点击，最终提交由本人完成。
6. **反馈与准备**：补录投递进度，登记通知与日历，管理通勤筛选、简历精修和模拟面试。

## 使用工具与关键决策

### Python + Pydantic + SQLite

Python 实现处理流程，Pydantic 校验结构和事实引用，SQLite 保存岗位与状态。本地 Web 工作台由 pywebview 包装为 Windows 桌面窗口；桌面发行包由 PyInstaller 打包，使用者无需安装 Python，解压后双击即可运行。

文件解析使用 python-docx、pypdf；文档输出使用 python-docx、ReportLab。每位 Windows 用户的资料、密钥和岗位库保存在自己的本机目录，复制发行包给别人不会夹带任何人的数据。

### 可替换的分析与搜索服务

本地规则可以离线运行；AI 分析提供可选 Provider，支持本机 Codex、OpenAI 或兼容接口。搜索和地图可分别配置，不连接服务时保留手动导入与本地基线。

本页范例只调用公开版的本地匹配与材料函数，没有使用个人 API、搜索或地图服务。

## 范例证明了什么

### 事实状态确实改变输出

待确认的 Tableau 经历不进入匹配证据和材料。仅在虚构候选人确认后，事实 ID 才进入材料引用。

### 硬门槛优先于综合分

每周只能到岗 3 天，不满足 JD 的 4 天要求；公开版将总分限制在 59。到岗信息缺失则保留未知，不能自动写成满足。

### 已知局限

即使 SQL 有项目证据，本地规则对"必须熟练使用 SQL"仍可能保留人工确认。证据存在与熟练程度达标是不同问题。评分尚未通过真实招聘结果校准，不宣称提高了面试率。

### 这不是完整云端 Agent

这是六组真实函数输出的交互回放，不能输入任意 JD 调用桌面程序。完整应用在本人电脑运行；网页不读取私人数据库，也不代表所有外部服务都已在本次验证。

## 运行方法与项目证据

### 不安装程序也能展示

1. 保持"4 天 / 尚未确认"，观察 SQL 证据与 Tableau 缺口。
2. 切换到"3 天"，核对硬门槛失败及 59 分上限。
3. 确认示例 Tableau 经历，查看入选材料事实从 1 条变为 2 条。
4. 展开草稿与人工确认清单，下载当前范例。

### 从同一版本源码复算

准备 Python 3.12/3.13，在公开项目的隔离环境安装其依赖；检出下方固定版本后，运行导出脚本。脚本仅使用合成测试资料，不读取 .env、私人 Profile 或岗位库。

```
git checkout 4397ded9c603e7e26d3dc241eb910ce3ad0a749a
.venv\Scripts\python.exe export-job-agent-demo.py . demo.json
```

- [下载运行脚本](/downloads/export-job-agent-demo.py) · [六组输出与源码哈希](/assets/job-agent-demo.json)
- [公开仓库](https://github.com/CHIWAWAFROMkk/personal-job-agent) · [对应源码版本](https://github.com/CHIWAWAFROMkk/personal-job-agent/tree/4397ded9c603e7e26d3dc241eb910ce3ad0a749a) · [匹配逻辑](https://github.com/CHIWAWAFROMkk/personal-job-agent/blob/4397ded9c603e7e26d3dc241eb910ce3ad0a749a/src/job_agent/services/local_matcher.py) · [材料生成逻辑](https://github.com/CHIWAWAFROMkk/personal-job-agent/blob/4397ded9c603e7e26d3dc241eb910ce3ad0a749a/src/job_agent/services/application_pack.py) · [隐私边界](https://github.com/CHIWAWAFROMkk/personal-job-agent/blob/4397ded9c603e7e26d3dc241eb910ce3ad0a749a/PRIVACY.md) · [更新记录](https://github.com/CHIWAWAFROMkk/personal-job-agent/blob/4397ded9c603e7e26d3dc241eb910ce3ad0a749a/CHANGELOG.md)

公开仓库源码与 Windows 安装包可能不在同一版本；本页以固定源码及随附结果为准。
