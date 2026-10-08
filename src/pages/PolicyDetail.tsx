import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  Card,
  Tag,
  Select,
  Space,
  Typography,
  Empty,
  Modal,
  Checkbox,
} from 'antd'
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePptOutlined,
  FileZipOutlined,
  DownloadOutlined,
  HistoryOutlined,
  SwapOutlined,
  RightOutlined,
} from '@ant-design/icons'
import type { Policy } from './SystemMgmt'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { DocNode, buildAttendanceTree, buildParsedTree } from './DraftWizard'

export interface PolicyAttachment {
  id: string
  name: string
  type: 'pdf' | 'word' | 'excel' | 'image' | 'pptx' | 'zip'
  size: string
}

export interface PolicyVersion {
  version: string
  publishDate: string
  docNo: string
  name: string
  category: string
  owner: string
  drafter: string
  status: Policy['status']
  effectiveDate: string
  changes: string
  tree: DocNode[]
  attachments: PolicyAttachment[]
}

// ——— 版本化数据生成（演示用） ———
const ATTACH_POOL: { name: string; type: PolicyAttachment['type'] }[] = [
  { name: '制度正文（正式版）.pdf', type: 'pdf' },
  { name: '起草说明.docx', type: 'word' },
  { name: '征求意见汇总表.xlsx', type: 'excel' },
  { name: '合法性审查意见.pdf', type: 'pdf' },
  { name: '宣贯培训材料.pptx', type: 'pptx' },
  { name: '业务流程图.png', type: 'image' },
  { name: '配套附表模板.xlsx', type: 'excel' },
  { name: '签批单扫描件.pdf', type: 'pdf' },
]

const TYPE_LABEL: Record<PolicyAttachment['type'], string> = {
  pdf: 'PDF',
  word: 'Word',
  excel: 'Excel',
  image: '图片',
  pptx: 'PPT',
  zip: '压缩包',
}

const STATUS_COLOR: Record<Policy['status'], string> = {
  生效中: 'green',
  评审中: 'blue',
  草稿: 'default',
  已过期: 'red',
  已公示: 'geekblue',
}

const monthsAgo = (base: string, back: number): string => {
  const d = new Date(base + 'T00:00:00')
  d.setMonth(d.getMonth() - back)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const CHANGE_NOTES = [
  '首次发布试行版本，搭建制度基本框架。',
  '第 2 次修订，完善管理职责与审批权限条款。',
  '第 3 次修订，细化管理流程与监督问责内容。',
  '第 4 次修订，补充附则附件效力与配套表单。',
]

// ——— 树工具：稳定 id / 克隆 / 查找 / 追加 ———
const deepCloneTree = (nodes: DocNode[]): DocNode[] =>
  nodes.map((n) => ({ ...n, children: n.children ? deepCloneTree(n.children) : undefined }))

// 按深度优先位置分配稳定 id（每次调用结构一致 → 跨版本 id 稳定，便于比对"变更"）
const assignStableIds = (nodes: DocNode[], prefix = ''): DocNode[] =>
  nodes.map((n, i) => {
    const id = prefix ? `${prefix}-${i}` : `s${i}`
    return { ...n, id, children: n.children ? assignStableIds(n.children, id) : undefined }
  })

const findNode = (nodes: DocNode[], id: string): DocNode | null => {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const f = findNode(n.children, id)
      if (f) return f
    }
  }
  return null
}

const appendChild = (nodes: DocNode[], parentId: string, child: DocNode): boolean => {
  const p = findNode(nodes, parentId)
  if (!p) return false
  p.children = p.children ? [...p.children, child] : [child]
  return true
}

// 考勤制度专属修订/新增/废止内容（按 stable id 命中，体现真实"版本演进"）
const ATTENDANCE_REVISIONS: Record<string, { old: string; current: string }> = {
  's1-1': {
    old: '公司实行标准工时制，每日工作 8 小时、每周工作 40 小时。',
    current:
      '公司实行标准工时制，每日工作 8 小时、每周工作 40 小时；各部门具体上下班时间由负责人确定并向人力资源部备案，实行弹性工作制的须另行审批。',
  },
  's2-1': {
    old: '员工连续工作满 1 年享受带薪年休假：满 1 年不满 10 年的 5 天，满 10 年不满 20 年的 10 天，满 20 年的 15 天。',
    current:
      '员工连续工作满 1 年享受带薪年休假：满 1 年不满 10 年的 5 天，满 10 年不满 20 年的 10 天，满 20 年的 15 天；年休假应在当年内安排，确因工作需要未能休完的，按国家有关规定支付未休年休假工资报酬。',
  },
}
const ATTENDANCE_NEW: { parent: string; nodes: DocNode[] }[] = [
  {
    parent: 's1',
    nodes: [
      { id: 's1-new0', title: '2.6 远程办公考勤', content: '员工居家远程办公期间，应通过公司指定考勤平台定时签到，每日不少于两次；远程办公时长纳入月度出勤统计，具体细则另行制定。' },
      { id: 's1-new1', title: '2.7 出差考勤', content: '员工因公出差须提前在系统提交出差申请，出差期间免予常规打卡，但应据实填报出差日志，返回后及时核销。' },
    ],
  },
  {
    parent: 's2',
    nodes: [
      { id: 's2-new0', title: '3.7 育儿假与陪护假', content: '符合政策生育的职工，在子女三周岁以内每年可享受育儿假，具体天数按用人单位所在地规定执行；陪护假参照婚育相关假期标准执行。' },
    ],
  },
]
const ATTENDANCE_DEPRECATED: { parent: string; node: DocNode } = {
  parent: 's3',
  node: { id: 's3-dep', title: '4.4 旧版手工考勤细则', content: '（已废止）本办法施行前执行的手工签到与纸质台账管理细则同时废止，相关记录由人力资源部归档保存不少于两年。' },
}

// 通用制度（非考勤）：基于 stable id 程序化生成修订/新增/废止
const buildGenericRevisions = (base: DocNode[]): Record<string, { old: string; current: string }> => {
  const res: Record<string, { old: string; current: string }> = {}
  const pick = (ch: DocNode | undefined) => {
    if (!ch) return
    const old = ch.content
    res[ch.id] = {
      old,
      current: old + '（2026 年修订：补充数字化办理要求与例外情形处理规则，明确责任边界与办理时限。）',
    }
  }
  pick(base[1]?.children?.[0])
  pick(base[2]?.children?.[0])
  return res
}
const buildGenericNew = (base: DocNode[]): { parent: string; nodes: DocNode[] }[] => {
  const res: { parent: string; nodes: DocNode[] }[] = []
  if (base[1]) {
    res.push({
      parent: base[1].id,
      nodes: [{ id: base[1].id + '-new0', title: '数字化办理要求', content: '本制度所涉事项均通过公司统一平台线上办理，实行申请、审核、执行、归档全流程闭环管理，严禁体外循环与线下操作。' }],
    })
  }
  if (base[2]) {
    res.push({
      parent: base[2].id,
      nodes: [{ id: base[2].id + '-new0', title: '监督与问责机制', content: '建立常态化监督检查机制，对执行不力、弄虚作假的单位和个人，依规依纪追究责任，并纳入年度考核。' }],
    })
  }
  return res
}
const buildGenericDeprecated = (base: DocNode[]): { parent: string; node: DocNode } | null => {
  const parent = base[base.length - 1]
  if (!parent) return null
  return { parent: parent.id, node: { id: parent.id + '-dep', title: '旧版过渡条款', content: '（已废止）本制度施行前的原有暂行规定同时废止，相关审批流程统一切换至新平台办理。' } }
}

export const buildPolicyVersions = (p: Policy): PolicyVersion[] => {
  const idx = parseInt((p.id || '0').replace(/\D/g, ''), 10) || 0
  const isAttendance = p.name === '员工考勤与休假管理办法' || p.name.includes('考勤')
  const rawTree = isAttendance ? buildAttendanceTree() : buildParsedTree(p.name)
  const baseTree = assignStableIds(rawTree) // 稳定 id 基底（全员一致）
  const step = 2 + (idx % 3)
  const total = 2 + (idx % 3) // 2~4 个历史版本，保证可切换

  // 预置各版本的"修订/新增/废止"内容
  const revisions = isAttendance ? ATTENDANCE_REVISIONS : buildGenericRevisions(baseTree)
  const newSections = isAttendance ? ATTENDANCE_NEW : buildGenericNew(baseTree)
  const deprecated = isAttendance ? ATTENDANCE_DEPRECATED : buildGenericDeprecated(baseTree)

  const versions: PolicyVersion[] = []
  for (let k = 0; k < total; k++) {
    const age = total - 1 - k // 0 = 最新
    const tree = deepCloneTree(baseTree)

    // 1) 文本修订：最旧版本用"草稿"文本，其余用"现行"文本 → 比对显示"变更"
    Object.entries(revisions).forEach(([id, rev]) => {
      const node = findNode(tree, id)
      if (node) node.content = k === 0 ? rev.old : rev.current
    })
    // 2) 废止章节：仅最旧版本保留 → 新版已删除 → 比对显示"删除"
    if (k === 0 && deprecated) {
      appendChild(tree, deprecated.parent, { ...deprecated.node })
    }
    // 3) 新增章节：仅最新版本包含 → 旧版没有 → 比对显示"新增"
    if (k === total - 1) {
      newSections.forEach((grp) => grp.nodes.forEach((nd) => appendChild(tree, grp.parent, { ...nd })))
    }

    const publishDate = monthsAgo('2026-05-15', age * step)
    const effectiveDate = monthsAgo('2026-06-01', age * step)
    const version = `V${k + 1}.0`
    const changes =
      k === total - 1
        ? '现行有效版本，整合历次修订内容，为最新发布版本。'
        : CHANGE_NOTES[k % CHANGE_NOTES.length]
    // 附件：版本越新，附件越全
    const start = (idx + k) % ATTACH_POOL.length
    const count = 2 + k
    const attachments: PolicyAttachment[] = Array.from({ length: count }, (_, i) => {
      const item = ATTACH_POOL[(start + i) % ATTACH_POOL.length]
      return {
        id: `F-${p.id}-${k}-${i}`,
        name: item.name,
        type: item.type,
        size: `${((i + 1) * 0.7 + k * 0.3).toFixed(1)}MB`,
      }
    })
    versions.push({
      version,
      publishDate,
      docNo: p.docNo,
      name: p.name,
      category: p.category,
      owner: p.owner,
      drafter: p.drafter,
      status: p.status,
      effectiveDate,
      changes,
      tree,
      attachments,
    })
  }
  return versions
}

const renderPreview = (nodes: DocNode[], depth = 0): ReactNode =>
  nodes.map((n) => (
    <div key={n.id} id={'sec-' + n.id} className={`dw-psec lv${depth}`}>
      <h3 className="dw-psec-title">{n.title}</h3>
      <p className="dw-psec-content">{n.content || '（待补充内容）'}</p>
      {n.children && renderPreview(n.children, depth + 1)}
    </div>
  ))

// 扁平化章节（含层级），用于目录与版本对比
interface FlatSec {
  id: string
  title: string
  content: string
  depth: number
}
const flattenSections = (nodes: DocNode[], depth = 0, acc: FlatSec[] = []): FlatSec[] => {
  nodes.forEach((n) => {
    acc.push({ id: n.id, title: n.title, content: n.content || '', depth })
    if (n.children) flattenSections(n.children, depth + 1, acc)
  })
  return acc
}

// 章节树序列化为带层级标题的纯文本（与前台 PolicyDiff 保持一致）：
// 每个章节输出「# 数量随层级递增 标题\n正文」，章节间以一个空行分隔
const serializeTree = (nodes: DocNode[]): string =>
  flattenSections(nodes)
    .map((s) => `${'#'.repeat(Math.min(s.depth + 1, 6))} ${s.title}\n${s.content}`)
    .join('\n\n')

// 标记"变更"章节（同 id 但标题/正文不同）在 diff 中的行号 → 高亮为蓝色
// 行号规则：第 i 个章节标题=3i+1、正文=3i+2（章节间空行使其每节占 3 行）
const computeChangedLines = (oldTree: DocNode[], newTree: DocNode[]): string[] => {
  const flatOld = flattenSections(oldTree)
  const flatNew = flattenSections(newTree)
  const oldMap = new Map(flatOld.map((s) => [s.id, s]))
  const marks: string[] = []
  flatNew.forEach((s, idx) => {
    const o = oldMap.get(s.id)
    if (!o) return // 新增章节：保持默认绿色
    const titleChanged = o.title !== s.title
    const contentChanged = o.content !== s.content
    if (!titleChanged && !contentChanged) return // 未变化
    const oldIdx = flatOld.findIndex((x) => x.id === s.id)
    if (oldIdx >= 0) {
      if (titleChanged) marks.push(`L-${3 * oldIdx + 1}`)
      if (contentChanged) marks.push(`L-${3 * oldIdx + 2}`)
    }
    if (titleChanged) marks.push(`R-${3 * idx + 1}`)
    if (contentChanged) marks.push(`R-${3 * idx + 2}`)
  })
  return marks
}

const attachIcon = (type: PolicyAttachment['type']) => {
  const common = { style: { fontSize: 20 } as const }
  switch (type) {
    case 'pdf':
      return <FilePdfOutlined {...common} style={{ ...common.style, color: '#e11d48' }} />
    case 'word':
      return <FileWordOutlined {...common} style={{ ...common.style, color: '#2563eb' }} />
    case 'excel':
      return <FileExcelOutlined {...common} style={{ ...common.style, color: '#16a34a' }} />
    case 'image':
      return <FileImageOutlined {...common} style={{ ...common.style, color: '#9333ea' }} />
    case 'pptx':
      return <FilePptOutlined {...common} style={{ ...common.style, color: '#ea580c' }} />
    case 'zip':
      return <FileZipOutlined {...common} style={{ ...common.style, color: '#0891b2' }} />
  }
}

interface Props {
  versions: PolicyVersion[]
  onBack: () => void
  showBack?: boolean
  showMeta?: boolean
  layout?: 'classic' | 'doc'
  onCompareClick?: () => void
}

export default function PolicyDetail({
  versions,
  onBack,
  showBack = true,
  showMeta = true,
  layout = 'classic',
  onCompareClick,
}: Props) {
  const latestVersion = versions[versions.length - 1]?.version ?? ''
  const [activeVersion, setActiveVersion] = useState<string>(latestVersion)
  const [compareSel, setCompareSel] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [cmpOld, setCmpOld] = useState(versions[0]?.version ?? '')
  const [cmpNew, setCmpNew] = useState(latestVersion)
  const openCompare = () => {
    if (compareSel.length === 2) {
      setCmpOld(compareSel[0])
      setCmpNew(compareSel[1])
    }
    setCompareOpen(true)
  }

  // 文档式布局（前台详情）使用的两个对比版本选择器
  const [compareA, setCompareA] = useState<string>(versions[0]?.version ?? '')
  const [compareB, setCompareB] = useState<string>(latestVersion)

  // 左侧「目录」默认展开，可手动折叠
  const [tocOpen, setTocOpen] = useState(true)

  const v = versions.find((x) => x.version === activeVersion) ?? versions[versions.length - 1]
  const toc = flattenSections(v.tree)

  const handleVersionChange = (val: string) => {
    setActiveVersion(val)
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById('sec-' + id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleCompare = (ver: string) => {
    setCompareSel((prev) => {
      if (prev.includes(ver)) return prev.filter((x) => x !== ver)
      if (prev.length >= 2) return [prev[1], ver]
      return [...prev, ver]
    })
  }

  // 对比：取所选两个版本，按时间顺序（旧 → 新）排列
  const pickA = layout === 'doc' ? compareA : compareSel[0]
  const pickB = layout === 'doc' ? compareB : compareSel[1]
  const orderedIdx = [pickA, pickB]
    .map((ver) => versions.findIndex((x) => x.version === ver))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)
  const verA = orderedIdx.length === 2 ? versions[orderedIdx[0]] : null
  const verB = orderedIdx.length === 2 ? versions[orderedIdx[1]] : null

  const versionOptions = versions.map((x) => ({
    value: x.version,
    label: `${x.version} · ${x.publishDate}`,
  }))

  // ——— 通用：正文 + 附件 ———
  const renderBody = (extraClass = '') => (
    <div className={`pd-doc-body ${extraClass}`}>
      {v.tree.length ? renderPreview(v.tree) : <Empty description="本版本暂无正文" />}
      <div className="pd-attach-bottom">
        <div className="pd-attach-bottom-title">附件材料（{v.attachments.length}）</div>
        {v.attachments.length === 0 ? (
          <Empty description="本版本暂无附件材料" />
        ) : (
          <div className="pd-attach-list">
            {v.attachments.map((a) => (
              <div className="pd-attach-item" key={a.id}>
                <span className="pd-attach-icon">{attachIcon(a.type)}</span>
                <span className="pd-attach-name">{a.name}</span>
                <span className="pd-attach-size">{a.size}</span>
                <span className="pd-attach-type">
                  <Tag>{TYPE_LABEL[a.type]}</Tag>
                </span>
                <Button type="link" size="small" icon={<DownloadOutlined />} className="pd-attach-dl">
                  下载
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // ——— 版本对比弹窗内容 ———
  const renderCompareModal = () => {
    const oldV = versions.find((x) => x.version === cmpOld)
    const newV = versions.find((x) => x.version === cmpNew)
    return (
    <Modal
      title="版本对比"
      open={compareOpen}
      onCancel={() => setCompareOpen(false)}
      footer={[
        <Button key="close" onClick={() => setCompareOpen(false)}>
          关闭
        </Button>,
      ]}
      width={920}
    >
      {layout === 'doc' ? (
        <div className="pd-compare-pick">
          <span className="pd-compare-pick-label">对比版本</span>
          <Select
            value={compareA}
            onChange={(val) => setCompareA(val)}
            options={versionOptions}
            style={{ width: 220 }}
          />
          <SwapOutlined className="pd-compare-arrow" />
          <Select
            value={compareB}
            onChange={(val) => setCompareB(val)}
            options={versionOptions}
            style={{ width: 220 }}
          />
        </div>
      ) : (
        <div className="pd-compare-pick">
          <span className="pd-compare-pick-label">对比版本</span>
          <Select
            value={cmpOld}
            onChange={(val) => setCmpOld(val)}
            options={versionOptions}
            style={{ width: 220 }}
          />
          <SwapOutlined className="pd-compare-arrow" />
          <Select
            value={cmpNew}
            onChange={(val) => setCmpNew(val)}
            options={versionOptions}
            style={{ width: 220 }}
          />
        </div>
      )}
      {layout === 'doc' ? (
        verA && verB ? (
          (() => {
            const flatA = flattenSections(verA.tree)
            const flatB = flattenSections(verB.tree)
            const bIds = new Set(flatB.map((s) => s.id))
            const aIds = new Set(flatA.map((s) => s.id))
            return (
              <div className="pd-compare">
                <div className="pd-compare-head">
                  <span className="pd-compare-tag old">旧 · {verA.version}（{verA.publishDate}）</span>
                  <SwapOutlined className="pd-compare-arrow" />
                  <span className="pd-compare-tag new">新 · {verB.version}（{verB.publishDate}）</span>
                </div>
                <div className="pd-compare-cols">
                  <div className="pd-compare-col">
                    <div className="pd-compare-col-title">
                      {verA.name} · {verA.version}
                    </div>
                    <div className="pd-compare-note">变更说明：{verA.changes}</div>
                    {flatA.map((s) => (
                      <div key={s.id} className={`pd-cmp-sec${!bIds.has(s.id) ? ' removed' : ''}`}>
                        <div className="pd-cmp-sec-title">{s.title}</div>
                        <div className="pd-cmp-sec-content">{s.content || '（待补充内容）'}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pd-compare-col">
                    <div className="pd-compare-col-title">
                      {verB.name} · {verB.version}
                    </div>
                    <div className="pd-compare-note">变更说明：{verB.changes}</div>
                    {flatB.map((s) => (
                      <div key={s.id} className={`pd-cmp-sec${!aIds.has(s.id) ? ' added' : ''}`}>
                        <div className="pd-cmp-sec-title">{s.title}</div>
                        <div className="pd-cmp-sec-content">{s.content || '（待补充内容）'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()
        ) : (
          <Empty description="请选择两个版本进行对比" />
        )
      ) : oldV && newV ? (
        <ReactDiffViewer
          oldValue={serializeTree(oldV.tree)}
          newValue={serializeTree(newV.tree)}
          splitView
          compareMethod={DiffMethod.CHARS}
          highlightLines={computeChangedLines(oldV.tree, newV.tree)}
          styles={{
            variables: {
              light: {
                highlightBackground: '#dbeafe',
                highlightGutterBackground: '#bfdbfe',
                wordAddedBackground: '#93c5fd',
                wordRemovedBackground: '#93c5fd',
              },
            },
          }}
          leftTitle={`${oldV.version}（${oldV.publishDate}）`}
          rightTitle={`${newV.version}（${newV.publishDate}）`}
        />
      ) : (
        <Empty description="请选择两个版本进行对比" />
      )}
    </Modal>
    )
  }

  // ——— 文档式布局（前台详情） ———
  if (layout === 'doc') {
    return (
      <div className="pd-page pd-page-doc">
        <div className="pd-doc-layout">
          {/* 左侧目录：直接紧挨顶部导航（默认展开；区域固定高度，超长内部滚动） */}
          <aside className="pd-toc-rail">
            <div className={`pd-toc${tocOpen ? ' open' : ' collapsed'}`}>
              <div
                className={`pd-toc-title pd-toc-toggle${tocOpen ? ' open' : ''}`}
                onClick={() => setTocOpen((v) => !v)}
                role="button"
                aria-expanded={tocOpen}
              >
                <RightOutlined className="pd-toc-caret" />
                <span>目录</span>
              </div>
              {tocOpen && (
                <ul className="pd-toc-list">
                  {toc.length === 0 ? (
                    <li className="pd-toc-empty">本版本暂无正文</li>
                  ) : (
                    toc.map((t) => (
                      <li
                        key={t.id}
                        className={`pd-toc-item lv${t.depth}`}
                        onClick={() => scrollToSection(t.id)}
                      >
                        {t.title}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            <div className="pd-versions">
              <div className="pd-versions-title">历史版本</div>
              <ul className="pd-versions-list">
                {versions
                  .slice()
                  .reverse()
                  .map((ver) => (
                    <li
                      key={ver.version}
                      className={`pd-version-item${ver.version === activeVersion ? ' active' : ''}`}
                      onClick={() => handleVersionChange(ver.version)}
                    >
                      <span className="pd-version-no">{ver.version}</span>
                      <span className="pd-version-date">{ver.publishDate}</span>
                    </li>
                  ))}
              </ul>
              <Button
                type="primary"
                block
                icon={<SwapOutlined />}
                className="pd-versions-cmp"
                onClick={() => (onCompareClick ? onCompareClick() : setCompareOpen(true))}
              >
                版本比对
              </Button>
            </div>
          </aside>

          {/* 右侧：上=基本信息，下=制度正文 */}
          <div className="pd-doc-main">
            <section className="pd-info-panel">
              <div className="pd-info-head">
                <div className="pd-info-titlewrap">
                  <Typography.Title level={3} className="pd-info-name">
                    {v.name}
                  </Typography.Title>
                </div>
                <div className="pd-info-actions">
                  <span className="pd-stamp" title={v.status}>
                    {v.status}
                  </span>
                </div>
              </div>
              <div className="pd-info-grid">
                <span className="pd-info-item">
                  <label>文号</label>
                  <b>{v.docNo}</b>
                </span>
                <span className="pd-info-item">
                  <label>分类</label>
                  <b>{v.category}</b>
                </span>
                <span className="pd-info-item">
                  <label>责任部门</label>
                  <b>{v.owner}</b>
                </span>
                <span className="pd-info-item">
                  <label>起草人</label>
                  <b>{v.drafter}</b>
                </span>
                <span className="pd-info-item">
                  <label>版本号</label>
                  <b>{v.version}</b>
                </span>
                <span className="pd-info-item">
                  <label>发布日期</label>
                  <b>{v.publishDate}</b>
                </span>
                <span className="pd-info-item">
                  <label>生效日期</label>
                  <b>{v.effectiveDate}</b>
                </span>
              </div>
            </section>

            <section className="pd-text-panel">{renderBody('pd-text-body')}</section>
          </div>
        </div>

        {renderCompareModal()}
      </div>
    )
  }

  // ——— 经典布局（后台详情，保持原样） ———
  return (
    <div className="pd-page">
      <div className="pd-head">
        <div className="pd-head-left">
          {showBack && (
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
              返回
            </Button>
          )}
          <div className="pd-title-wrap">
            <Typography.Title level={4} className="pd-title">
              {v.name}
            </Typography.Title>
            <span className="pd-sub">制度文号 {v.docNo}</span>
            <Tag color={STATUS_COLOR[v.status]} className="pd-head-status">
              {v.status}
            </Tag>
          </div>
        </div>
        <div className="pd-head-right">
          <Space size={8} wrap={false}>
            <HistoryOutlined style={{ color: '#94a3b8' }} />
            <span className="pd-version-label">切换历史版本</span>
            <Select
              value={activeVersion}
              onChange={handleVersionChange}
              style={{ width: 210 }}
              options={versionOptions}
            />
          </Space>
        </div>
      </div>

      <Card className="pd-body-card">
        <div className="pd-detail">
          <aside className="pd-detail-aside">
            <div className="pd-toc">
              <div className="pd-toc-title">目录</div>
              <ul className="pd-toc-list">
                {toc.length === 0 ? (
                  <li className="pd-toc-empty">本版本暂无正文</li>
                ) : (
                  toc.map((t) => (
                    <li
                      key={t.id}
                      className={`pd-toc-item lv${t.depth}`}
                      onClick={() => scrollToSection(t.id)}
                    >
                      {t.title}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="pd-versions">
              <div className="pd-versions-head">
                <span>
                  <HistoryOutlined /> 历史版本
                </span>
                {compareSel.length > 0 && (
                  <Button type="link" size="small" className="pd-version-clear" onClick={() => setCompareSel([])}>
                    清空
                  </Button>
                )}
              </div>
              <ul className="pd-version-list">
                {versions.map((x) => (
                  <li key={x.version} className="pd-version-row">
                    <Checkbox
                      checked={compareSel.includes(x.version)}
                      onChange={() => toggleCompare(x.version)}
                    />
                    <span
                      className="pd-version-link"
                      onClick={() => handleVersionChange(x.version)}
                      title="点击切换到该版本"
                    >
                      {x.version} · {x.publishDate}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                type="primary"
                block
                disabled={compareSel.length !== 2}
                icon={<SwapOutlined />}
                className="pd-compare-btn"
                onClick={openCompare}
              >
                版本对比{compareSel.length === 2 ? '' : `（选 ${compareSel.length}/2）`}
              </Button>
            </div>
          </aside>
          <div className="pd-detail-content">
            {showMeta && (
              <div className="pd-meta-strip">
                <div className="pd-meta-grid">
                  <span className="pd-meta">
                    <label>分类</label>
                    <b>{v.category}</b>
                  </span>
                  <span className="pd-meta">
                    <label>责任部门</label>
                    <b>{v.owner}</b>
                  </span>
                  <span className="pd-meta">
                    <label>起草人</label>
                    <b>{v.drafter}</b>
                  </span>
                  <span className="pd-meta">
                    <label>版本号</label>
                    <b>{v.version}</b>
                  </span>
                  <span className="pd-meta">
                    <label>发布日期</label>
                    <b>{v.publishDate}</b>
                  </span>
                  <span className="pd-meta">
                    <label>生效日期</label>
                    <b>{v.effectiveDate}</b>
                  </span>
                </div>
                <div className="pd-meta-note">
                  <label>变更说明</label>
                  <span>{v.changes}</span>
                </div>
              </div>
            )}
            {renderBody()}
          </div>
        </div>
      </Card>

      {renderCompareModal()}
    </div>
  )
}
