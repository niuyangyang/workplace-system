import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Input, Card, Tag, Button, Typography, Empty, Divider, Pagination, Select } from 'antd'
import Navbar from '../components/Navbar'
import PortalNav from '../components/PortalNav'
import {
  SearchOutlined,
  AppstoreOutlined,
  TagsOutlined,
  BankOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import {
  CATEGORIES,
  OWNERS,
  policyStatusColor,
  draftCategoryColor,
  seedPolicies,
  type Policy,
} from './SystemMgmt'
import PolicyDetail, { buildPolicyVersions } from './PolicyDetail'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import './policyPortal.css'

const { Title, Text, Paragraph } = Typography

type PortalPolicy = Policy & {
  publishDate: string
  effectiveDate: string
  summary: string
}

const pad = (n: number) => String(n).padStart(2, '0')

// 基于后台同一份制度数据，补全前台展示所需字段（发布/生效日期、摘要）
export const PORTAL_POLICIES: PortalPolicy[] = seedPolicies.map((p, i) => {
  const year = 2023 + (i % 4)
  const month = ((i * 3) % 12) + 1
  const day = ((i * 7) % 27) + 1
  const publishDate = `${year}-${pad(month)}-${pad(day)}`
  const eMonth = (month % 12) + 1
  const effectiveDate = `${month <= 11 ? year : year + 1}-${pad(eMonth)}-${pad(day)}`
  const summary = `本制度明确了《${p.name}》的适用范围、管理职责、工作流程、监督问责与附则等内容，由${p.owner}牵头制定并负责解释，适用于公司全体及相关业务场景。`
  // 制度前台为"对外公开"视图：这里展示的制度默认均为「已公示」
  return { ...p, status: '已公示', publishDate, effectiveDate, summary }
})

const FACETS = [
  { key: 'category', label: '按制度分类', icon: <TagsOutlined />, options: CATEGORIES },
  { key: 'owner', label: '按发布部门', icon: <BankOutlined />, options: OWNERS },
] as const

const YEARS = Array.from(new Set(PORTAL_POLICIES.map((p) => p.publishDate.slice(0, 4)))).sort(
  (a, b) => Number(b) - Number(a),
)

export default function PolicyPortal() {
  const [keyword, setKeyword] = useState('')
  const [sel, setSel] = useState<Record<string, Set<string>>>({
    category: new Set(),
    owner: new Set(),
    status: new Set(),
    year: new Set(),
  })
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  // 筛选 / 关键词变化时回到第一页
  useEffect(() => {
    setPage(1)
  }, [keyword, sel])

  const toggle = (facet: string, value: string) => {
    setSel((prev) => {
      const next = { ...prev, [facet]: new Set(prev[facet]) }
      if (next[facet].has(value)) next[facet].delete(value)
      else next[facet].add(value)
      return next
    })
  }

  const reset = () =>
    setSel({ category: new Set(), owner: new Set(), status: new Set(), year: new Set() })

  const activeCount =
    sel.category.size + sel.owner.size + sel.status.size + sel.year.size + (keyword.trim() ? 1 : 0)

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return PORTAL_POLICIES.filter((p) => {
      if (kw) {
        const hay = `${p.name}${p.docNo}${p.summary}${p.owner}${p.category}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      if (sel.category.size && !sel.category.has(p.category)) return false
      if (sel.owner.size && !sel.owner.has(p.owner)) return false
      if (sel.status.size && !sel.status.has(p.status)) return false
      if (sel.year.size && !sel.year.has(p.publishDate.slice(0, 4))) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, sel])

  return (
    <div className="pp-page">
      {/* 顶部导航：与首页保持一致（品牌 Logo + 系统名称 + 消息 + 用户），滚动吸顶 */}
      <Navbar solid sticky nav={<PortalNav />} />

      {/* 顶部 banner：全局搜索 */}
      <section className="pp-banner">
        <div className="pp-banner-inner">
          <h1 className="pp-banner-title">企业制度库</h1>
          <p className="pp-banner-sub">检索全量制度文件，支持按名称、文号或关键词查找</p>
          <div className="pp-banner-search">
            <Input
              size="large"
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索制度名称、文号或关键词"
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            />
          </div>
          <div className="pp-banner-hot">
            <span className="pp-banner-hot-label">热门检索：</span>
            {['考勤', '差旅', '财务报销', '研发管理', '安全生产'].map((t) => (
              <span key={t} className="pp-banner-hot-item" onClick={() => setKeyword(t)}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 主体：左筛选 + 右列表 */}
      <div className="pp-body">
        <aside className="pp-side">
          <div className="pp-side-head">
            <AppstoreOutlined />
            <span>筛选条件</span>
            {activeCount > 0 && (
              <Button type="link" size="small" className="pp-side-reset" onClick={reset}>
                重置（{activeCount}）
              </Button>
            )}
          </div>
          <Divider className="pp-side-divider" />

          {FACETS.map((f) => (
            <div className="pp-facet" key={f.key}>
              <div className="pp-facet-title">
                {f.icon}
                <span>{f.label}</span>
              </div>
              <ul className="pp-facet-list">
                {f.options.map((opt) => {
                  const checked = sel[f.key].has(opt)
                  return (
                    <li
                      key={opt}
                      className={`pp-facet-item${checked ? ' on' : ''}`}
                      onClick={() => toggle(f.key, opt)}
                    >
                      <span className={`pp-check${checked ? ' on' : ''}`} />
                      <span className="pp-facet-text">{opt}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <div className="pp-facet">
            <div className="pp-facet-title">
              <CalendarOutlined />
              <span>按发布年份</span>
            </div>
            <ul className="pp-facet-list">
              {YEARS.map((y) => {
                const checked = sel.year.has(y)
                return (
                  <li
                    key={y}
                    className={`pp-facet-item${checked ? ' on' : ''}`}
                    onClick={() => toggle('year', y)}
                  >
                    <span className={`pp-check${checked ? ' on' : ''}`} />
                    <span className="pp-facet-text">{y} 年</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>

        <main className="pp-main">
          <div className="pp-main-head">
            <Title level={4} className="pp-main-title">
              制度列表
            </Title>
            <Text type="secondary" className="pp-main-count">
              共 <b>{filtered.length}</b> 项制度
              {activeCount > 0 && (
                <Button type="link" size="small" onClick={reset}>
                  清除筛选
                </Button>
              )}
            </Text>
          </div>

          {filtered.length === 0 ? (
            <Empty description="没有符合条件的制度" className="pp-empty" />
          ) : (
            <>
              <div className="pp-list">
                {filtered
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map((p) => (
                    <Link
                      key={p.id}
                      to={`/app/policy/detail/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pp-item-link"
                    >
                    <Card
                      className="pp-item"
                      hoverable
                    >
                      <div className="pp-item-top">
                        <span className="pp-item-name">{p.name}</span>
                      </div>
                      <div className="pp-item-meta">
                        <span className="pp-item-docno">{p.docNo}</span>
                        <Tag color={draftCategoryColor[p.category] ?? 'default'}>{p.category}</Tag>
                        <span className="pp-item-owner">{p.owner}</span>
                      </div>
                      <Paragraph className="pp-item-summary" ellipsis={{ rows: 2 }}>
                        {p.summary}
                      </Paragraph>
                      <div className="pp-item-foot">
                        <Text type="secondary" className="pp-item-date">
                          发布：{p.publishDate}　|　生效：{p.effectiveDate}
                        </Text>
                      </div>
                    </Card>
                    </Link>
                  ))}
              </div>
              <div className="pp-pager">
                <Pagination
                  current={page}
                  pageSize={PAGE_SIZE}
                  total={filtered.length}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(t) => `共 ${t} 项制度`}
                  onChange={(p) => setPage(p)}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

// 独立详情页：从列表点开新标签页时渲染（无返回、无基础信息条）
export function PolicyPortalDetail() {
  const { id } = useParams<{ id: string }>()
  const p = PORTAL_POLICIES.find((x) => x.id === id)
  if (!p) {
    return (
      <div className="pp-page">
        <Navbar solid sticky nav={<PortalNav />} />
        <Empty description="未找到该制度" style={{ marginTop: 120 }} />
      </div>
    )
  }
  return (
    <div className="pp-page">
      <Navbar solid sticky nav={<PortalNav />} />
      <PolicyDetail
        layout="doc"
        versions={buildPolicyVersions(p)}
        onBack={() => {}}
        onCompareClick={() =>
          window.open(`/app/policy/diff/${p.id}`, '_blank', 'noopener,noreferrer')
        }
      />
    </div>
  )
}

// 独立版本对比页：并排展示两个版本的内容差异（新页面，非弹窗）
export function PolicyDiff() {
  const { id } = useParams<{ id: string }>()
  const p = PORTAL_POLICIES.find((x) => x.id === id)
  const versions = useMemo(() => (p ? buildPolicyVersions(p) : []), [p])
  // 左侧为基准版本（最早版本），固定不可修改；右侧为对比版本，可切换
  const oldVer = versions[0]?.version ?? ''
  const [newVer, setNewVer] = useState(versions[versions.length - 1]?.version ?? '')

  const versionOptions = versions.map((x) => ({
    value: x.version,
    label: `${x.version} · ${x.publishDate}`,
  }))

  // 章节树扁平化（带 id + 层级），用于序列化与新增/变更/删除统计
  const flatten = (
    nodes: typeof versions[number]['tree'],
    depth = 0,
    acc: { id: string; title: string; content: string; depth: number }[] = [],
  ) => {
    nodes.forEach((n) => {
      acc.push({ id: n.id, title: n.title, content: n.content || '', depth })
      if (n.children) flatten(n.children, depth + 1, acc)
    })
    return acc
  }

  const ov = versions.find((v) => v.version === oldVer)
  const nv = versions.find((v) => v.version === newVer)

  // 标记"变更"章节（同 id 但标题/正文不同）在左右两栏的行号 → 在 diff 中高亮为蓝色
  // 序列化规则：每个章节输出「标题行\n正文行」，章节之间以一个空行分隔 → 第 i 个章节的标题/正文行号为 3i+1 / 3i+2
  const changedLines = useMemo(() => {
    if (!ov || !nv) return [] as string[]
    const flatOld = flatten(ov.tree)
    const flatNew = flatten(nv.tree)
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
  }, [ov, nv])

  // 序列化为带层级标题的纯文本（# 数量随层级递增），保证结构差异可见
  const serialize = (tree: typeof versions[number]['tree']) =>
    flatten(tree)
      .map((s) => `${'#'.repeat(Math.min(s.depth + 1, 6))} ${s.title}\n${s.content}`)
      .join('\n\n')

  if (!p) {
    return (
      <div className="pp-page">
        <Navbar solid sticky nav={<PortalNav />} />
        <Empty description="未找到该制度" style={{ marginTop: 120 }} />
      </div>
    )
  }

  return (
    <div className="pp-page">
      <Navbar solid sticky nav={<PortalNav />} />
      <div className="pd-diff-head">
        <div className="pd-diff-titlerow">
          <span className="pd-diff-name">{p.name}</span>
          <Tag color={policyStatusColor[p.status]}>{p.status}</Tag>
          <Link to={`/app/policy/detail/${p.id}`} target="_blank" rel="noopener noreferrer" className="pd-diff-back">
            <ArrowLeftOutlined /> 返回详情
          </Link>
        </div>
        <div className="pd-diff-pickers">
          <span className="pd-diff-pick-label">对比版本</span>
          <Select
            value={oldVer}
            options={versionOptions}
            disabled
            style={{ width: 220 }}
          />
          <SwapOutlined className="pd-diff-arrow" />
          <Select
            value={newVer}
            onChange={setNewVer}
            options={versionOptions}
            style={{ width: 220 }}
          />
        </div>
      </div>
      <div className="pd-diff-body">
        <ReactDiffViewer
          oldValue={ov ? serialize(ov.tree) : ''}
          newValue={nv ? serialize(nv.tree) : ''}
          splitView
          compareMethod={DiffMethod.CHARS}
          highlightLines={changedLines}
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
          leftTitle={`${ov?.version}（${ov?.publishDate}）`}
          rightTitle={`${nv?.version}（${nv?.publishDate}）`}
        />
      </div>
    </div>
  )
}
