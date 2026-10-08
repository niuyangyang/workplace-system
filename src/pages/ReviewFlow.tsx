import { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import { Button, Card, Divider, Form, Input, Transfer, Tree, Modal, Empty } from 'antd'
import { ArrowLeftOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { ORG_TREE, DRAFTERS as REVIEW_DRAFTERS, DocNode } from './DraftWizard'

export interface ReviewInfo {
  docNo: string
  name: string
  owner: string
  drafter: string
  draftTime: string
}

export interface AnnotationItem {
  id: string
  quote: string
  comment: string
  author: string
  time: string
}

export interface ReviewRecord {
  id: string
  theme: string
  info: ReviewInfo
  category?: string
  tree: DocNode[]
  participants: string[]
  status: '待评审' | '已评审'
  opinion?: string
  annotation?: string
  annotations?: AnnotationItem[]
  result?: '通过' | '驳回'
  rejectReason?: string
}

type OrgLike = { id: string; name: string; children?: OrgLike[] }
type TreeDataNode = { title: string; key: string; children?: TreeDataNode[] }

// ——— 组织树 + 评审人员（与发起评审穿梭框共用） ———
const ORG = ORG_TREE as unknown as OrgLike[]
const collectLeaves = (nodes: OrgLike[]): OrgLike[] => {
  const out: OrgLike[] = []
  nodes.forEach((n) => {
    if (n.children?.length) out.push(...collectLeaves(n.children))
    else out.push(n)
  })
  return out
}
const nodeLeaves: Record<string, string[]> = {}
const buildMap = (nodes: OrgLike[]) => {
  nodes.forEach((n) => {
    if (n.children?.length) {
      nodeLeaves[n.id] = collectLeaves(n.children).map((x) => x.name)
      buildMap(n.children)
    } else {
      nodeLeaves[n.id] = [n.name]
    }
  })
}
buildMap(ORG)
const POSITIONS = ['部门负责人', '主管', '高级专员', '专员', '资深工程师', '经理']
const REVIEW_PEOPLE: { id: string; name: string; dept: string; position: string }[] = (() => {
  const leaves = collectLeaves(ORG)
  const list: { id: string; name: string; dept: string; position: string }[] = []
  leaves.forEach((leaf, i) => {
    const count = 2 + (i % 2)
    for (let j = 0; j < count; j++) {
      list.push({
        id: 'RV' + String(list.length + 1).padStart(3, '0'),
        name: REVIEW_DRAFTERS[(i * 3 + j) % REVIEW_DRAFTERS.length],
        dept: leaf.name,
        position: POSITIONS[(i * 3 + j) % POSITIONS.length],
      })
    }
  })
  return list
})()
const toReviewTreeData = (nodes: OrgLike[]): TreeDataNode[] =>
  nodes.map((n) => ({ title: n.name, key: n.id, children: n.children ? toReviewTreeData(n.children) : undefined }))
const REVIEW_TREE_DATA: TreeDataNode[] = toReviewTreeData(ORG)

// 将文本中命中的批注原文高亮为 <mark>，点击即在右侧栏定位该批注（共享、实时保存）
const renderAnnotated = (
  text: string,
  annotations: AnnotationItem[],
  onMarkClick: (id: string) => void,
  activeId?: string | null,
): ReactNode => {
  const matches = annotations
    .map((a) => ({ a, idx: text.indexOf(a.quote) }))
    .filter((m) => m.idx >= 0)
    .sort((x, y) => x.idx - y.idx)
  if (matches.length === 0) return text
  const nodes: ReactNode[] = []
  let cursor = 0
  let key = 0
  for (const m of matches) {
    if (m.idx < cursor) continue // 跳过重叠
    if (m.idx > cursor) nodes.push(text.slice(cursor, m.idx))
    const a = m.a
    const quote = a.quote
    nodes.push(
      <mark
        key={'mk' + key++}
        className={`rf-annot${activeId === a.id ? ' active' : ''}`}
        data-annid={a.id}
        title={`${a.author}（${a.time}）：${a.comment}`}
        onClick={() => onMarkClick(a.id)}
      >
        {quote}
      </mark>,
    )
    cursor = m.idx + quote.length
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

const renderAnnotatedPreview = (
  nodes: DocNode[],
  level: number,
  annotations: AnnotationItem[],
  onMarkClick: (id: string) => void,
  activeId?: string | null,
): ReactNode =>
  nodes.map((n) => (
    <div className={`dw-psec ${level === 0 ? '' : 'lv1'}`} key={n.id}>
      <div className="dw-psec-title">{renderAnnotated(n.title, annotations, onMarkClick, activeId)}</div>
      {n.content && (
        <p className="dw-psec-content">{renderAnnotated(n.content, annotations, onMarkClick, activeId)}</p>
      )}
      {n.children &&
        renderAnnotatedPreview(n.children, level + 1, annotations, onMarkClick, activeId)}
    </div>
  ))

interface Props {
  mode: 'initiate' | 'participate'
  data: ReviewRecord
  onBack: () => void
  currentUser?: string
  onLaunch?: (theme: string, participants: string[]) => void
  onSubmit?: (annotations: AnnotationItem[]) => void
  onAddAnnotation?: (item: AnnotationItem) => void
}

export default function ReviewFlow({ mode, data, onBack, currentUser, onLaunch, onSubmit, onAddAnnotation }: Props) {
  const [theme, setTheme] = useState(data.theme || '')
  const [targetKeys, setTargetKeys] = useState<string[]>([])
  const [reviewDept, setReviewDept] = useState<string | null>(null)
  const [sel, setSel] = useState<{ text: string; top: number; left: number } | null>(null)
  const [annotOpen, setAnnotOpen] = useState(false)
  const [annotDraft, setAnnotDraft] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  const annotations = data.annotations || []
  // 右侧批注栏与正文滚动联动：orderedIds 为批注在正文中的出现顺序，
  // visibleIds 为当前阅读位置附近应展示的批注，activeId 为当前聚焦批注。
  const [orderedIds, setOrderedIds] = useState<string[]>([])
  const [visibleIds, setVisibleIds] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const reviewDataSource = useMemo(() => {
    const base = reviewDept
      ? REVIEW_PEOPLE.filter((p) => nodeLeaves[reviewDept]?.includes(p.dept))
      : REVIEW_PEOPLE
    const baseKeys = new Set(base.map((p) => p.id))
    // 已选（右侧）但不在当前部门视图中的人员，也必须保留在数据源里，
    // 否则切换部门时右侧会丢失这些已选数据。
    const extra = REVIEW_PEOPLE.filter((p) => targetKeys.includes(p.id) && !baseKeys.has(p.id))
    return [...base, ...extra].map((p) => ({
      key: p.id,
      title: p.name,
      description: `${p.position} · ${p.dept}`,
    }))
  }, [reviewDept, targetKeys])
  const selectedNames = useMemo(
    () => reviewDataSource.filter((s) => targetKeys.includes(s.key)).map((s) => s.title),
    [reviewDataSource, targetKeys],
  )

  const meta = (
    <div className="rf-meta">
      <div className="rf-meta-item">
        <span className="rf-meta-label">制度名称</span>
        <span className="rf-meta-value">{data.info.name}</span>
      </div>
      <div className="rf-meta-item">
        <span className="rf-meta-label">文号</span>
        <span className="rf-meta-value">{data.info.docNo}</span>
      </div>
      <div className="rf-meta-item">
        <span className="rf-meta-label">责任部门</span>
        <span className="rf-meta-value">{data.info.owner}</span>
      </div>
      <div className="rf-meta-item">
        <span className="rf-meta-label">起草人</span>
        <span className="rf-meta-value">{data.info.drafter}</span>
      </div>
      <div className="rf-meta-item">
        <span className="rf-meta-label">起草时间</span>
        <span className="rf-meta-value">{data.info.draftTime}</span>
      </div>
    </div>
  )

  if (mode === 'initiate') {
    return (
      <div className="rf-page">
        <div className="rf-page-head">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回
          </Button>
          <h2 className="rf-page-title">发起评审</h2>
        </div>

        <Card className="rf-card" title="评审信息">
          {meta}

          <Divider className="rf-info-divider" />

          <Form layout="vertical" className="rf-theme-form">
            <Form.Item label="评审主题" required className="rf-theme-item">
              <Input
                placeholder="请输入本次评审的主题，如「2026年度信息安全制度评审」"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </Form.Item>
          </Form>

          <Divider titlePlacement="start" plain className="rf-pane-divider">
            选择评审参与人员
          </Divider>

          <div className="review-modal">
            <div className="review-tree-pane">
              <div className="review-pane-title">按部门筛选人员</div>
              <Tree
                className="review-tree"
                treeData={REVIEW_TREE_DATA}
                defaultExpandedKeys={['xinghui']}
                selectedKeys={reviewDept ? [reviewDept] : []}
                onSelect={(keys) => setReviewDept((keys[0] as string) ?? null)}
              />
            </div>
            <div className="review-transfer-pane">
              <div className="review-pane-title">选择本次评审人员</div>
              <Transfer
                className="review-transfer"
                dataSource={reviewDataSource}
                targetKeys={targetKeys}
                onChange={(keys) => setTargetKeys(keys.map(String))}
                titles={['可选人员', '本次评审人员']}
                showSearch
                pagination={{ pageSize: 8 }}
                listStyle={{ height: 440, minWidth: 260 }}
                render={(item) => item.title}
              />
            </div>
          </div>
        </Card>

        <div className="rf-footer">
          <Button onClick={onBack}>取消</Button>
          <Button
            type="primary"
            disabled={!theme.trim() || selectedNames.length === 0}
            onClick={() => onLaunch && onLaunch(theme.trim(), selectedNames)}
          >
            发起评审（已选 {selectedNames.length} 人）
          </Button>
        </div>
      </div>
    )
  }

  // 参与评审：右侧批注栏与正文滚动联动，仅展示当前阅读位置附近的批注，避免来回滚动
  const onMarkClick = (id: string) => {
    setActiveId(id)
  }

  const handleMouseUp = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSel(null)
      return
    }
    const text = selection.toString().trim()
    if (!text) {
      setSel(null)
      return
    }
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setSel({ text, top: rect.bottom + 6, left: rect.left })
  }

  const confirmAnnot = () => {
    if (!annotDraft.trim() || !sel) return
    const item: AnnotationItem = {
      id: 'AN' + Date.now(),
      quote: sel.text,
      comment: annotDraft.trim(),
      author: currentUser || '匿名',
      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    onAddAnnotation && onAddAnnotation(item) // 实时保存，无需单独提交
    setActiveId(item.id)
    setAnnotDraft('')
    setAnnotOpen(false)
    setSel(null)
    window.getSelection()?.removeAllRanges()
  }

  // 计算各批注在正文中的出现顺序，并随滚动只展示当前阅读位置附近的批注
  const computeSync = () => {
    const root = previewRef.current
    if (!root) return
    const marks = Array.from(root.querySelectorAll<HTMLElement>('mark[data-annid]'))
    if (!marks.length) {
      setOrderedIds([])
      setVisibleIds([])
      setActiveId(null)
      return
    }
    const arr = marks.map((m) => ({
      id: m.getAttribute('data-annid') || '',
      top: m.getBoundingClientRect().top,
    }))
    arr.sort((a, b) => a.top - b.top)
    const ids = arr.map((x) => x.id)
    setOrderedIds(ids)
    const vh = window.innerHeight || document.documentElement.clientHeight
    // 视野内（顶部到视口底部）的批注优先展示
    const inView = arr.filter((x) => x.top >= 0 && x.top <= vh)
    let vis = inView.map((x) => x.id)
    if (!vis.length) {
      // 视野内无批注时，取最接近的一条（上方最近 / 否则首条）
      const above = arr.filter((x) => x.top < 0)
      const pick = above.length ? above[above.length - 1] : arr[0]
      vis = [pick.id]
    }
    setVisibleIds(vis)
    // 当前聚焦：阅读线（视口上方 220px）以上、最靠近的一条
    const READ = 220
    let act = arr[0].id
    for (const x of arr) {
      if (x.top <= READ) act = x.id
      else break
    }
    setActiveId((prev) => (prev && ids.includes(prev) ? prev : act))
  }

  const scheduleSync = () => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      computeSync()
    })
  }

  const gotoAnnotation = (delta: number) => {
    if (!orderedIds.length) return
    const cur = activeId ? orderedIds.indexOf(activeId) : -1
    const nextIdx = cur < 0 ? 0 : Math.min(orderedIds.length - 1, Math.max(0, cur + delta))
    const id = orderedIds[nextIdx]
    setActiveId(id)
    const el = previewRef.current?.querySelector<HTMLElement>(`mark[data-annid="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const scrollToAnnotation = (id: string) => {
    setActiveId(id)
    const el = previewRef.current?.querySelector<HTMLElement>(`mark[data-annid="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // 批注顺序 / 可见性随标注变化与窗口滚动重算
  useLayoutEffect(() => {
    computeSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations.length])
  useEffect(() => {
    window.addEventListener('scroll', scheduleSync, { passive: true })
    window.addEventListener('resize', scheduleSync)
    return () => {
      window.removeEventListener('scroll', scheduleSync)
      window.removeEventListener('resize', scheduleSync)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const body = (
    <Card
      className="rf-card"
      title="制度正文"
      extra={<span className="rf-annot-tip">选中正文文字即可添加批注（实时保存）</span>}
    >
      <div className="dw-preview" ref={previewRef} onMouseUp={handleMouseUp}>
        <div className="dw-preview-title">{data.info.name}</div>
        <div className="dw-preview-rule" />
        {renderAnnotatedPreview(data.tree, 0, annotations, onMarkClick, activeId)}
      </div>
    </Card>
  )

  // 右侧批注栏：按正文出现顺序，仅展示当前阅读位置附近的批注
  const railCards = visibleIds
    .slice()
    .sort((a, b) => orderedIds.indexOf(a) - orderedIds.indexOf(b))
    .map((id) => {
      const a = annotations.find((x) => x.id === id)
      if (!a) return null
      return (
        <div
          key={a.id}
          className={`rf-rail-card${activeId === a.id ? ' active' : ''}`}
          data-annid={a.id}
          onClick={() => scrollToAnnotation(a.id)}
        >
          <div className="rf-rail-card-head">
            <span className="rf-rail-card-author">{a.author === currentUser ? '我' : a.author}</span>
            <span className="rf-rail-card-time">{a.time}</span>
          </div>
          <div className="rf-rail-card-quote">“{a.quote}”</div>
          <div className="rf-rail-card-comment">{a.comment}</div>
        </div>
      )
    })

  const activeIndex = activeId ? orderedIds.indexOf(activeId) : -1

  return (
    <div className="rf-page">
      <div className="rf-page-head">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回
        </Button>
        <h2 className="rf-page-title">参与评审</h2>
        <Button type="primary" className="rf-done-btn" onClick={() => onSubmit && onSubmit(annotations)}>
          完成评审
        </Button>
      </div>

      <div className="rf-annotate-layout">
        <div className="rf-body-col">{body}</div>
        <div className="rf-rail">
          <div className="rf-rail-head">
            <span className="rf-rail-head-title">批注（共享）</span>
            <span className="rf-rail-head-count">
              {orderedIds.length ? `${activeIndex >= 0 ? activeIndex + 1 : 1}/${orderedIds.length}` : '0'}
            </span>
            <span className="rf-rail-nav">
              <Button
                type="text"
                size="small"
                icon={<UpOutlined />}
                disabled={orderedIds.length <= 1 || activeIndex <= 0}
                onClick={() => gotoAnnotation(-1)}
                title="上一条"
              />
              <Button
                type="text"
                size="small"
                icon={<DownOutlined />}
                disabled={orderedIds.length <= 1 || activeIndex < 0 || activeIndex >= orderedIds.length - 1}
                onClick={() => gotoAnnotation(1)}
                title="下一条"
              />
            </span>
          </div>
          <div className="rf-rail-body">
            {annotations.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无批注，选中正文文字即可添加" />
            ) : (
              railCards
            )}
          </div>
        </div>
      </div>

      {sel && (
        <Button
          className="rf-annot-add-btn"
          type="primary"
          size="small"
          style={{ position: 'fixed', top: sel.top, left: sel.left, zIndex: 1000 }}
          onClick={() => setAnnotOpen(true)}
        >
          添加批注
        </Button>
      )}
      <Modal
        title="添加批注"
        open={annotOpen}
        onOk={confirmAnnot}
        onCancel={() => {
          setAnnotOpen(false)
          setAnnotDraft('')
        }}
        okText="保存"
        cancelText="取消"
      >
        <p className="rf-annot-quote-preview">
          选中文本：<span className="rf-annot-quote">“{sel?.text}”</span>
        </p>
        <Input.TextArea
          rows={4}
          placeholder="请输入批注内容（所有评审人可见）"
          value={annotDraft}
          onChange={(e) => setAnnotDraft(e.target.value)}
        />
      </Modal>
    </div>
  )
}
