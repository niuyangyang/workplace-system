import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Table,
  Tag,
  Typography,
  Tree,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Popconfirm,
  Space,
  Breadcrumb,
  Dropdown,
  Descriptions,
  App as AntdApp,
} from 'antd'
import type { TableColumnsType, TreeDataNode, MenuProps } from 'antd'
import {
  HomeOutlined,
  TeamOutlined,
  ApartmentOutlined,
  PlusOutlined,
  UserOutlined,
  UserSwitchOutlined,
  DownOutlined,
  RightOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import Navbar from '../components/Navbar'
import EChart from '../components/EChart'
import type { EChartsOption } from 'echarts'
import './orgCenter.css'
import { ORG_TREE, ORG_PEOPLE } from '../data/org'

const { Content } = Layout
const { Title } = Typography

/* ----------------------------- 数据类型 ----------------------------- */

type OrgType = '集团' | '中心' | '部门' | '小组' | '子公司'
type OrgStatus = '启用' | '筹备中' | '已停用'
type PersonStatus = '在职' | '试用期' | '离职'
type EducationLevel = '高中' | '大专' | '本科' | '硕士' | '博士'

interface OrgNode {
  id: string
  name: string
  type: OrgType
  leader: string
  phone: string
  status: OrgStatus
  children?: OrgNode[]
}

interface Person {
  key: string
  name: string
  empNo: string
  orgId: string
  position: string
  phone: string
  email: string
  status: PersonStatus
  age: number
  hireDate: string // 入职日期 YYYY-MM
  education: EducationLevel // 学历
}

/* ----------------------------- 模拟数据（企业组织） ----------------------------- */

const initialOrgTree: OrgNode[] = ORG_TREE
const seedPeople: Person[] = ORG_PEOPLE

/* ----------------------------- 工具函数 ----------------------------- */

function findNode(nodes: OrgNode[], id: string): OrgNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const f = findNode(n.children, id)
      if (f) return f
    }
  }
  return null
}

function collectAll(nodes: OrgNode[], acc: OrgNode[] = []): OrgNode[] {
  for (const n of nodes) {
    acc.push(n)
    if (n.children) collectAll(n.children, acc)
  }
  return acc
}

function descendantIds(nodes: OrgNode[], id: string): string[] {
  const node = findNode(nodes, id)
  if (!node) return []
  const ids = [node.id]
  const walk = (n: OrgNode) => {
    n.children?.forEach((c) => {
      ids.push(c.id)
      walk(c)
    })
  }
  walk(node)
  return ids
}

// 按条件过滤组织树：节点本身命中或任意下级命中均保留，并裁剪无关分支
// 默认只展开根节点（展示顶部组织 + 其下一级），其余层级手动展开
function filterOrgTree(
  nodes: OrgNode[],
  cond: { name: string; type: string; status: string },
): OrgNode[] {
  const k = cond.name.trim().toLowerCase()
  const walk = (ns: OrgNode[]): OrgNode[] => {
    const res: OrgNode[] = []
    for (const n of ns) {
      const children = n.children ? walk(n.children) : undefined
      const selfMatch =
        (k ? n.name.toLowerCase().includes(k) : true) &&
        (cond.type ? n.type === cond.type : true) &&
        (cond.status ? n.status === cond.status : true)
      if (selfMatch || (children && children.length)) {
        res.push({ ...n, children })
      }
    }
    return res
  }
  return walk(nodes)
}

function updateNode(nodes: OrgNode[], id: string, patch: Partial<OrgNode>): OrgNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, ...patch }
    if (n.children) return { ...n, children: updateNode(n.children, id, patch) }
    return n
  })
}

function removeNode(nodes: OrgNode[], id: string): OrgNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, id) } : n))
}

function addChild(nodes: OrgNode[], parentId: string, child: OrgNode): OrgNode[] {
  return nodes.map((n) => {
    if (n.id === parentId) return { ...n, children: [...(n.children || []), child] }
    if (n.children) return { ...n, children: addChild(n.children, parentId, child) }
    return n
  })
}

// 默认展开：仅展开顶层组织（显示其下一级），其余层级手动展开
function defaultExpandedKeys(nodes: OrgNode[]): string[] {
  return nodes.map((n) => n.id)
}

// 查找某节点的父节点 id（根节点返回 null）
function findParentId(nodes: OrgNode[], id: string, parentId: string | null = null): string | null {
  for (const n of nodes) {
    if (n.id === id) return parentId
    if (n.children) {
      const f = findParentId(n.children, id, n.id)
      if (f !== null) return f
    }
  }
  return null
}

// 收集节点自身及其全部后代 id（编辑/查看时排除可选上级，避免形成环）
function selfAndDescendantIds(nodes: OrgNode[], id: string): Set<string> {
  const set = new Set<string>()
  const node = findNode(nodes, id)
  if (!node) return set
  const walk = (n: OrgNode) => {
    set.add(n.id)
    n.children?.forEach(walk)
  }
  walk(node)
  return set
}

/* ----------------------------- 派生配置 ----------------------------- */

const orgTypeColor: Record<OrgType, string> = {
  集团: 'red',
  中心: 'gold',
  部门: 'blue',
  小组: 'cyan',
  子公司: 'purple',
}
const orgStatusColor: Record<OrgStatus, string> = {
  启用: 'green',
  筹备中: 'gold',
  已停用: 'red',
}
const personStatusColor: Record<PersonStatus, string> = {
  在职: 'green',
  试用期: 'blue',
  离职: 'default',
}

const orgTypeOptions = (['集团', '中心', '部门', '小组', '子公司'] as OrgType[]).map((t) => ({
  label: t,
  value: t,
}))
const orgStatusOptions = (['启用', '筹备中', '已停用'] as OrgStatus[]).map((s) => ({
  label: s,
  value: s,
}))
const personStatusOptions = (['在职', '试用期', '离职'] as PersonStatus[]).map((s) => ({
  label: s,
  value: s,
}))
const educationOptions = (['高中', '大专', '本科', '硕士', '博士'] as EducationLevel[]).map((e) => ({
  label: e,
  value: e,
}))

/* ----------------------------- 视图：组织管理（机构树 CRUD） ----------------------------- */

interface OrgRow {
  key: string
  name: string
  type: OrgType
  leader: string
  phone: string
  status: OrgStatus
  childCount: number
  members: number
  children?: OrgRow[]
}

function toOrgRow(node: OrgNode, memberCountMap: Record<string, number>): OrgRow {
  return {
    key: node.id,
    name: node.name,
    type: node.type,
    leader: node.leader,
    phone: node.phone,
    status: node.status,
    childCount: node.children?.length || 0,
    members: memberCountMap[node.id] || 0,
    children: node.children?.map((c) => toOrgRow(c, memberCountMap)),
  }
}

function OrgTreeView({ orgTree, setOrgTree }: { orgTree: OrgNode[]; setOrgTree: (t: OrgNode[] | ((prev: OrgNode[]) => OrgNode[])) => void }) {
  const { message } = AntdApp.useApp()
  const [applied, setApplied] = useState<{ name: string; type: string; status: string }>({ name: '', type: '', status: '' })
  const [searchForm] = Form.useForm()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() => defaultExpandedKeys(orgTree))
  const [form] = Form.useForm()
  const [viewData, setViewData] = useState<null | {
    parentName: string
    name: string
    type: OrgType
    leader: string
    phone: string
    status: OrgStatus
  }>(null)

  const allNodes = useMemo(() => collectAll(orgTree), [orgTree])
  const memberCountMap = useMemo(() => {
    const m: Record<string, number> = {}
    allNodes.forEach((n) => {
      const ids = descendantIds(orgTree, n.id)
      m[n.id] = seedPeople.filter((p) => ids.includes(p.orgId)).length
    })
    return m
  }, [orgTree, allNodes])

  // 可选上级组织：编辑/查看时排除自身及其后代，避免形成环
  const parentOptions = useMemo(() => {
    const exclude = editingId ? selfAndDescendantIds(orgTree, editingId) : null
    return allNodes
      .filter((n) => !exclude || !exclude.has(n.id))
      .map((n) => ({ label: n.name, value: n.id }))
  }, [allNodes, editingId, orgTree])

  const filteredTree = useMemo(() => filterOrgTree(orgTree, applied), [orgTree, applied])
  const rows = useMemo(() => filteredTree.map((n) => toOrgRow(n, memberCountMap)), [filteredTree, memberCountMap])

  // 搜索时自动展开全部命中结果
  const displayExpandedKeys = useMemo(() => {
    if (applied.name || applied.type || applied.status) return collectAll(filteredTree).map((n) => n.id)
    return expandedKeys
  }, [applied, filteredTree, expandedKeys])

  const onSearch = () => {
    const v = searchForm.getFieldsValue()
    setApplied({ name: v.name || '', type: v.type || '', status: v.status || '' })
  }
  const onReset = () => {
    searchForm.resetFields()
    setApplied({ name: '', type: '', status: '' })
  }

  const openAddRoot = () => {
    setModalMode('add')
    setEditingId(null)
    setParentId(null)
    form.resetFields()
    form.setFieldsValue({ type: '集团', status: '启用' })
    setModalOpen(true)
  }
  const openAddChild = (parent: OrgNode) => {
    setModalMode('add')
    setEditingId(null)
    setParentId(parent.id)
    form.resetFields()
    form.setFieldsValue({ type: '部门', status: '启用', parentId: parent.id })
    setModalOpen(true)
  }
  const openEdit = (node: OrgNode) => {
    setModalMode('edit')
    setEditingId(node.id)
    setParentId(null)
    form.resetFields()
    form.setFieldsValue({ ...node, parentId: findParentId(orgTree, node.id) })
    setModalOpen(true)
  }
  const handleView = (node: OrgNode) => {
    const pId = findParentId(orgTree, node.id)
    const parentName = pId ? findNode(orgTree, pId)?.name || '（无）' : '（无上级）'
    setViewData({
      parentName,
      name: node.name,
      type: node.type,
      leader: node.leader,
      phone: node.phone,
      status: node.status,
    })
    setModalMode('view')
    setEditingId(node.id)
    setParentId(null)
    setModalOpen(true)
  }

  const handleOk = async () => {
    try {
      const v = (await form.validateFields()) as {
        name: string
        type: OrgType
        leader: string
        phone: string
        status: OrgStatus
        parentId: string
      }
      if (modalMode === 'edit' && editingId) {
        setOrgTree((prev) => updateNode(prev as OrgNode[], editingId, {
          name: v.name,
          type: v.type,
          leader: v.leader,
          phone: v.phone,
          status: v.status,
        }))
        message.success('组织信息已更新')
      } else {
        const child: OrgNode = {
          id: 'o_' + Date.now(),
          name: v.name,
          type: v.type,
          leader: v.leader,
          phone: v.phone,
          status: v.status,
          children: [],
        }
        setOrgTree((prev) => addChild(prev as OrgNode[], v.parentId, child))
        message.success('已新增组织')
        setExpandedKeys((prev) => (prev.includes(v.parentId) ? prev : [...prev, v.parentId]))
      }
      setModalOpen(false)
    } catch {
      /* 校验未通过，保持弹窗 */
    }
  }

  const handleDelete = (node: OrgNode) => {
    setOrgTree((prev) => removeNode(prev as OrgNode[], node.id))
    message.success(`已删除组织「${node.name}」`)
  }

  const moreItems = (node: OrgNode): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'edit',
        label: '编辑',
        onClick: () => openEdit(node),
      },
    ]
    if (!node.children?.length) {
      items.push({
        key: 'delete',
        label: (
          <Popconfirm
            title={`确认删除组织「${node.name}」？`}
            description="删除后不可恢复"
            onConfirm={() => handleDelete(node)}
            okText="删除"
            cancelText="取消"
          >
            <span className="org-dropdown-delete">删除</span>
          </Popconfirm>
        ),
      })
    }
    return items
  }

  const columns: TableColumnsType<OrgRow> = [
    {
      title: '组织名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string) => <span className="org-name-text">{name}</span>,
    },
    {
      title: '组织类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      align: 'center',
      render: (t: OrgType) => <Tag color={orgTypeColor[t]} className="org-type-tag">{t}</Tag>,
    },
    {
      title: '下级组织数量',
      dataIndex: 'childCount',
      key: 'childCount',
      width: 110,
      align: 'center',
      render: (n: number) => <span className="org-count">{n}</span>,
    },
    { title: '负责人', dataIndex: 'leader', key: 'leader', width: 100 },
    {
      title: '联系方式',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (s: OrgStatus) => <Tag color={orgStatusColor[s]}>{s}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 190,
      align: 'center',
      render: (_, record) => {
        const node = findNode(orgTree, record.key)
        if (!node) return null
        return (
          <Space size={0} className="org-actions">
            <Button type="link" size="small" onClick={() => handleView(node)}>
              查看
            </Button>
            <Button type="link" size="small" onClick={() => openAddChild(node)}>
              新增
            </Button>
            <Dropdown menu={{ items: moreItems(node) }} placement="bottomRight" arrow>
              <Button type="link" size="small">
                更多
              </Button>
            </Dropdown>
          </Space>
        )
      },
    },
  ]

  return (
    <div className="org-manage">
      <div className="org-search-bar">
        <Form
          form={searchForm}
          layout="horizontal"
          className="org-search-form"
          labelCol={{ flex: '90px' }}
          wrapperCol={{ flex: 'auto' }}
        >
          <Form.Item name="name" label="组织名称" className="org-filter-item">
            <Input allowClear placeholder="输入组织名称" />
          </Form.Item>
          <Form.Item name="type" label="组织类型" className="org-filter-item">
            <Select allowClear placeholder="全部" options={orgTypeOptions} />
          </Form.Item>
          <Form.Item name="status" label="状态" className="org-filter-item">
            <Select allowClear placeholder="全部" options={orgStatusOptions} />
          </Form.Item>
          <div className="org-search-btns">
            <Button type="primary" onClick={onSearch}>
              查询
            </Button>
            <Button onClick={onReset}>重置</Button>
          </div>
        </Form>
      </div>

      <div className="org-action-row">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddRoot}>
          新增
        </Button>
      </div>

      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<OrgRow>
          columns={columns}
          dataSource={rows}
          size="middle"
          rowKey="key"
          pagination={false}
          expandable={{
            expandedRowKeys: displayExpandedKeys,
            onExpandedRowsChange: (keys) => {
              if (!applied.name && !applied.type && !applied.status) setExpandedKeys(keys as string[])
            },
            expandIcon: ({ expanded, onExpand, record }) => {
              const row = record as OrgRow
              const hasChildren = !!row.children?.length
              if (!hasChildren) return <span className="org-tree-indent" />
              return (
                <span className="org-expand-icon" onClick={(e) => onExpand(record, e)}>
                  {expanded ? <DownOutlined /> : <RightOutlined />}
                </span>
              )
            },
          }}
        />
      </Card>

      <Modal
        title={modalMode === 'view' ? '查看组织' : modalMode === 'edit' ? '编辑组织' : parentId ? '新增子组织' : '新增组织'}
        open={modalOpen}
        onOk={modalMode === 'view' ? () => setModalOpen(false) : handleOk}
        onCancel={() => setModalOpen(false)}
        okText={modalMode === 'view' ? '关闭' : '保存'}
        cancelText={modalMode === 'view' ? undefined : '取消'}
        destroyOnClose
      >
        {modalMode === 'view' && viewData ? (
          <Descriptions column={1} bordered size="middle" className="org-view-desc">
            <Descriptions.Item label="上级组织">{viewData.parentName}</Descriptions.Item>
            <Descriptions.Item label="组织名称">{viewData.name}</Descriptions.Item>
            <Descriptions.Item label="组织类型">{viewData.type}</Descriptions.Item>
            <Descriptions.Item label="负责人">{viewData.leader}</Descriptions.Item>
            <Descriptions.Item label="联系方式">{viewData.phone}</Descriptions.Item>
            <Descriptions.Item label="状态">{viewData.status}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="parentId"
              label="上级组织"
              rules={[{ required: true, message: '请选择上级组织' }]}
            >
              <Select placeholder="选择上级组织" options={parentOptions} />
            </Form.Item>
            <Form.Item name="name" label="组织名称" rules={[{ required: true, message: '请输入组织名称' }]}>
              <Input placeholder="如：智能制造事业部" />
            </Form.Item>
            <Form.Item name="type" label="组织类型" rules={[{ required: true, message: '请选择组织类型' }]}>
              <Select placeholder="选择类型" options={orgTypeOptions} />
            </Form.Item>
            <Form.Item name="leader" label="负责人">
              <Input placeholder="如：陈浩" />
            </Form.Item>
            <Form.Item name="phone" label="联系方式">
              <Input placeholder="如：021-62880100" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={orgStatusOptions} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

/* ----------------------------- 视图：人员管理（左侧组织树 + 右侧列表） ----------------------------- */

function buildTreeData(nodes: OrgNode[]): TreeDataNode[] {
  return nodes.map((n) => ({
    key: n.id,
    title: n.name,
    children: n.children ? buildTreeData(n.children) : undefined,
  }))
}

function PeopleView({ orgTree }: { orgTree: OrgNode[] }) {
  const { message } = AntdApp.useApp()
  const [people, setPeople] = useState<Person[]>(seedPeople)
  const [selectedOrg, setSelectedOrg] = useState<string>('xinghui')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)
  const [form] = Form.useForm()

  // 左侧组织树：搜索
  const [treeKeyword, setTreeKeyword] = useState('')
  const [treeExpandedKeys, setTreeExpandedKeys] = useState<string[]>(['xinghui'])

  // 右侧筛选（参考组织管理的筛选区）
  const [filterForm] = Form.useForm()
  const [applied, setApplied] = useState<{
    name: string
    empNo: string
    position: string
    phone: string
    status: string
    education: string
  }>({
    name: '',
    empNo: '',
    position: '',
    phone: '',
    status: '',
    education: '',
  })

  const allNodes = useMemo(() => collectAll(orgTree), [orgTree])
  const orgNameMap = useMemo(() => new Map(allNodes.map((n) => [n.id, n.name])), [allNodes])
  const orgOptions = useMemo(() => allNodes.map((n) => ({ label: n.name, value: n.id })), [allNodes])

  // 组织树按关键字过滤（命中节点本身或含命中子孙均保留，并保留祖先路径）
  const treeDataForDisplay = useMemo(() => {
    const k = treeKeyword.trim().toLowerCase()
    if (!k) return buildTreeData(orgTree)
    const filterNodes = (ns: OrgNode[]): TreeDataNode[] => {
      const res: TreeDataNode[] = []
      for (const n of ns) {
        const children = n.children ? filterNodes(n.children) : undefined
        const selfMatch = n.name.toLowerCase().includes(k)
        if (selfMatch || (children && children.length)) {
          res.push({ key: n.id, title: n.name, children })
        }
      }
      return res
    }
    return filterNodes(orgTree)
  }, [orgTree, treeKeyword])

  // 搜索时自动展开所有命中节点，便于查看
  const allFilteredKeys = useMemo(() => {
    const ids: string[] = []
    const walk = (ts: TreeDataNode[]) =>
      ts.forEach((t) => {
        ids.push(String(t.key))
        if (t.children) walk(t.children)
      })
    walk(treeDataForDisplay)
    return ids
  }, [treeDataForDisplay])
  const treeExpandedForShow = treeKeyword.trim() ? allFilteredKeys : treeExpandedKeys

  const onTreeReset = () => {
    setTreeKeyword('')
    setTreeExpandedKeys(['xinghui'])
  }

  const list = useMemo(() => {
    const ids = descendantIds(orgTree, selectedOrg)
    const kwName = applied.name.trim().toLowerCase()
    const kwEmp = applied.empNo.trim().toLowerCase()
    const kwPos = applied.position.trim().toLowerCase()
    const kwPhone = applied.phone.trim()
    return people
      .filter((p) => ids.includes(p.orgId))
      .filter((p) => !applied.status || p.status === applied.status)
      .filter((p) => !applied.education || p.education === applied.education)
      .filter((p) => {
        if (!kwName) return true
        return p.name.toLowerCase().includes(kwName) || p.empNo.toLowerCase().includes(kwName)
      })
      .filter((p) => !kwEmp || p.empNo.toLowerCase().includes(kwEmp))
      .filter((p) => !kwPos || p.position.toLowerCase().includes(kwPos))
      .filter((p) => !kwPhone || p.phone.includes(kwPhone))
  }, [people, selectedOrg, applied, orgTree])

  const onFilter = () => {
    const v = filterForm.getFieldsValue()
    setApplied({
      name: v.name || '',
      empNo: v.empNo || '',
      position: v.position || '',
      phone: v.phone || '',
      status: v.status || '',
      education: v.education || '',
    })
  }
  const onFilterReset = () => {
    filterForm.resetFields()
    setApplied({ name: '', empNo: '', position: '', phone: '', status: '', education: '' })
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ orgId: selectedOrg, status: '在职' })
    setModalOpen(true)
  }
  const openEdit = (p: Person) => {
    setEditing(p)
    form.setFieldsValue(p)
    setModalOpen(true)
  }
  const handleOk = async () => {
    try {
      const v = await form.validateFields()
      if (editing) {
        setPeople((prev) => prev.map((p) => (p.key === editing.key ? { ...p, ...v } : p)))
        message.success('已更新人员信息')
      } else {
        const no = 'E' + String(Date.now()).slice(-5)
        setPeople((prev) => [...prev, { ...v, key: 'p_' + Date.now(), empNo: no }])
        message.success('已新增人员')
      }
      setModalOpen(false)
    } catch {
      /* 校验未通过，保持弹窗 */
    }
  }
  const handleDelete = (key: string) => {
    setPeople((prev) => prev.filter((p) => p.key !== key))
    message.success('已删除该人员')
  }

  const columns: TableColumnsType<Person> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    { title: '工号', dataIndex: 'empNo', key: 'empNo', width: 110 },
    {
      title: '部门',
      dataIndex: 'orgId',
      key: 'orgId',
      render: (id: string) => orgNameMap.get(id) || id,
    },
    { title: '职位', dataIndex: 'position', key: 'position' },
    { title: '手机', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: PersonStatus) => <Tag color={personStatusColor[s]}>{s}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该人员？" onConfirm={() => handleDelete(record.key)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="people-wrap">
      <div className="people-tree">
        <div className="people-tree-title">
          <UserSwitchOutlined /> 组织架构
        </div>
        <Input
          allowClear
          placeholder="搜索组织"
          value={treeKeyword}
          onChange={(e) => setTreeKeyword(e.target.value)}
          className="people-tree-search"
        />
        <div className="people-tree-body">
          <Tree
            treeData={treeDataForDisplay}
            expandedKeys={treeExpandedForShow}
            onExpand={(keys) => setTreeExpandedKeys(keys as string[])}
            selectedKeys={[selectedOrg]}
            onSelect={(keys) => {
              if (keys[0]) setSelectedOrg(String(keys[0]))
            }}
            blockNode
          />
        </div>
        <div className="people-tree-footer">
          <Button onClick={onTreeReset}>重置</Button>
        </div>
      </div>

      <div className="people-main">
        <div className="org-search-bar">
          <Form
            form={filterForm}
            layout="horizontal"
            className="org-search-form"
            labelCol={{ flex: '90px' }}
            wrapperCol={{ flex: 'auto' }}
          >
            <Form.Item name="name" label="姓名" className="org-filter-item">
              <Input allowClear placeholder="输入姓名" />
            </Form.Item>
            <Form.Item name="empNo" label="工号" className="org-filter-item">
              <Input allowClear placeholder="输入工号" />
            </Form.Item>
            <Form.Item name="position" label="职位" className="org-filter-item">
              <Input allowClear placeholder="输入职位" />
            </Form.Item>
            <Form.Item name="phone" label="手机号" className="org-filter-item">
              <Input allowClear placeholder="输入手机号" />
            </Form.Item>
            <Form.Item name="status" label="状态" className="org-filter-item">
              <Select allowClear placeholder="全部" options={personStatusOptions} />
            </Form.Item>
            <Form.Item name="education" label="学历" className="org-filter-item">
              <Select allowClear placeholder="全部" options={educationOptions} />
            </Form.Item>
            <div className="org-search-btns people-search-btns">
              <Button type="primary" onClick={onFilter}>
                查询
              </Button>
              <Button onClick={onFilterReset}>重置</Button>
            </div>
          </Form>
        </div>

        <div className="org-action-row">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增
          </Button>
        </div>

        <Card className="org-card">
          <Table<Person>
            columns={columns}
            dataSource={list}
            rowKey="key"
            size="middle"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 人`,
            }}
          />
        </Card>
      </div>

      <Modal
        title={editing ? '编辑人员' : '新增人员'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="如：张伟" />
          </Form.Item>
          <Form.Item name="orgId" label="所属部门" rules={[{ required: true, message: '请选择部门' }]}>
            <Select placeholder="选择组织" options={orgOptions} />
          </Form.Item>
          <Form.Item name="position" label="职位" rules={[{ required: true, message: '请输入职位' }]}>
            <Input placeholder="如：前端工程师" />
          </Form.Item>
          <Form.Item name="education" label="学历">
            <Select placeholder="选择学历" options={educationOptions} />
          </Form.Item>
          <Form.Item name="phone" label="手机">
            <Input placeholder="11 位手机号" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="name@xinghui.com" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="在职">
            <Select options={personStatusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

/* ----------------------------- 视图：首页（统计看板） ----------------------------- */

function HomeView({ orgTree }: { orgTree: OrgNode[] }) {
  const orgCount = collectAll(orgTree).length
  const total = seedPeople.length
  const onJob = seedPeople.filter((p) => p.status === '在职').length
  const probation = seedPeople.filter((p) => p.status === '试用期').length

  const orgNameMap = useMemo(() => {
    const m = new Map<string, string>()
    collectAll(orgTree).forEach((n) => m.set(n.id, n.name))
    return m
  }, [orgTree])

  // 近期入职：按入职日期倒序取前 8 条
  const recentHires = useMemo(
    () =>
      [...seedPeople]
        .sort((a, b) => (a.hireDate < b.hireDate ? 1 : a.hireDate > b.hireDate ? -1 : 0))
        .slice(0, 8),
    [],
  )

  // 年龄分布：按年龄分桶统计人数
  const { ageBuckets, ageDist } = useMemo(() => {
    const buckets = ['22-26', '27-31', '32-36', '37-41', '42-46', '47岁以上']
    const ranges: [number, number][] = [
      [22, 26], [27, 31], [32, 36], [37, 41], [42, 46], [47, 200],
    ]
    const dist = buckets.map(() => 0)
    seedPeople.forEach((p) => {
      const idx = ranges.findIndex(([lo, hi]) => p.age >= lo && p.age <= hi)
      if (idx >= 0) dist[idx] += 1
    })
    return { ageBuckets: buckets, ageDist: dist }
  }, [])

  // 司龄分布：按入职年限分桶统计人数（基准 2026-09）
  const { tenureBuckets, tenureDist } = useMemo(() => {
    const buckets = ['1年内', '1-3年', '3-5年', '5-8年', '8年以上']
    const ranges: [number, number][] = [
      [0, 1], [1, 3], [3, 5], [5, 8], [8, 999],
    ]
    const now = new Date(2026, 8, 1) // 2026-09
    const dist = buckets.map(() => 0)
    seedPeople.forEach((p) => {
      const [y, m] = p.hireDate.split('-').map(Number)
      const tenure = Math.max(0, now.getFullYear() - y + (now.getMonth() - (m - 1)) / 12)
      const idx = ranges.findIndex(([lo, hi]) => tenure > lo && tenure <= hi)
      if (idx >= 0) dist[idx] += 1
    })
    return { tenureBuckets: buckets, tenureDist: dist }
  }, [])

  // 通用折线图配置（单系列）
  const buildLineOption = (name: string, labels: string[], data: number[]): EChartsOption => ({
    color: ['#3b5bff'],
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 24, top: 24, bottom: 48 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value', name: '人数', minInterval: 1 },
    series: [
      {
        name,
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data,
        areaStyle: { opacity: 0.1 },
      },
    ],
  })

  const ageOption = buildLineOption('人数', ageBuckets, ageDist)
  const tenureOption = buildLineOption('人数', tenureBuckets, tenureDist)

  const deptRateData = [
    { dept: '研发中心', entry: 18, leave: 6 },
    { dept: '产品中心', entry: 15, leave: 5 },
    { dept: '市场中心', entry: 22, leave: 9 },
    { dept: '运营中心', entry: 14, leave: 7 },
    { dept: '客服中心', entry: 20, leave: 12 },
    { dept: '供应链中心', entry: 10, leave: 4 },
    { dept: '人力资源中心', entry: 8, leave: 3 },
    { dept: '财务中心', entry: 6, leave: 2 },
    { dept: '行政中心', entry: 7, leave: 3 },
    { dept: '数据中心', entry: 12, leave: 4 },
    { dept: '法务中心', entry: 5, leave: 2 },
    { dept: '质量中心', entry: 9, leave: 3 },
    { dept: '子公司', entry: 16, leave: 5 },
  ]

  const rateOption: EChartsOption = {
    color: ['#3b5bff', '#ff7875'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v) => `${v}%` },
    legend: { data: ['入职率', '离职率'], bottom: 0 },
    grid: { left: 36, right: 16, top: 24, bottom: 64 },
    xAxis: {
      type: 'category',
      data: deptRateData.map((d) => d.dept),
      axisLabel: { interval: 0, rotate: 32, fontSize: 11 },
    },
    yAxis: { type: 'value', name: '%', max: 30 },
    series: [
      {
        name: '入职率',
        type: 'bar',
        barMaxWidth: 16,
        data: deptRateData.map((d) => d.entry),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '离职率',
        type: 'bar',
        barMaxWidth: 16,
        data: deptRateData.map((d) => d.leave),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  }

  const stats = [
    { label: '组织数量', value: orgCount, icon: <ApartmentOutlined />, suffix: '个' },
    { label: '人员数量', value: total, icon: <TeamOutlined />, suffix: '人' },
    { label: '在职人数', value: onJob, icon: <UserOutlined />, suffix: '人' },
    { label: '试用期人数', value: probation, icon: <UserSwitchOutlined />, suffix: '人' },
  ]

  const recentColumns: TableColumnsType<Person> = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 90, fixed: 'left', render: (n: string) => <span style={{ fontWeight: 500 }}>{n}</span> },
    { title: '工号', dataIndex: 'empNo', key: 'empNo', width: 100 },
    { title: '部门', dataIndex: 'orgId', key: 'orgId', render: (id: string) => orgNameMap.get(id) || id },
    { title: '职位', dataIndex: 'position', key: 'position' },
    { title: '学历', dataIndex: 'education', key: 'education', width: 90 },
    { title: '手机', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '入职日期', dataIndex: 'hireDate', key: 'hireDate', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: PersonStatus) => <Tag color={personStatusColor[s]}>{s}</Tag>,
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">数据概览</Title>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={24} sm={12} md={6} key={s.label}>
            <Card className="org-stat-card">
              <div className="org-stat-icon">{s.icon}</div>
              <div className="org-stat-body">
                <div className="org-stat-value">
                  {s.value}
                  <span className="org-stat-suffix">{s.suffix}</span>
                </div>
                <div className="org-stat-label">{s.label}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card className="org-card" title="近期入职">
            <Table<Person>
              columns={recentColumns}
              dataSource={recentHires}
              rowKey="key"
              size="middle"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card className="org-card" title="年龄分布">
            <EChart option={ageOption} height={320} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="org-card" title="司龄分布">
            <EChart option={tenureOption} height={320} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card className="org-card" title="各部门入职率 VS 离职率">
            <EChart option={rateOption} height={360} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

/* ----------------------------- 主组件 ----------------------------- */

type MenuKey = 'home' | 'people' | 'org'

// 记住当前所在子页面，刷新后恢复到该页面
const MENU_STORAGE_KEY = 'orgcenter:menu'

export default function OrgCenter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const entryFromCenter = searchParams.get('entry') === 'center'

  const [menu, setMenu] = useState<MenuKey>(() => {
    if (entryFromCenter) return 'home'
    const saved = localStorage.getItem(MENU_STORAGE_KEY)
    return (saved as MenuKey) || 'org'
  })
  const [orgTree, setOrgTree] = useState<OrgNode[]>(initialOrgTree)
  const [collapsed, setCollapsed] = useState(false)

  // 进入系统后清除 entry 标记，保证后续刷新按保存的页面恢复
  useEffect(() => {
    if (entryFromCenter) {
      setSearchParams({}, { replace: true })
    }
  }, [entryFromCenter, setSearchParams])

  // 切换页面时持久化，刷新后停留在原页面
  useEffect(() => {
    localStorage.setItem(MENU_STORAGE_KEY, menu)
  }, [menu])

  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: '首页' },
    { key: 'people', icon: <TeamOutlined />, label: '人员管理' },
    { key: 'org', icon: <ApartmentOutlined />, label: '组织管理' },
  ]

  const menuLabel = menu === 'home' ? '首页' : menu === 'people' ? '人员管理' : '组织管理'
  const breadcrumb = (
    <>
      <Button
        type="text"
        className="sider-collapse-btn"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed((c) => !c)}
        aria-label="收起/展开菜单"
      />
      <Breadcrumb items={[{ title: '人员组织' }, { title: menuLabel }]} />
    </>
  )

  return (
    <Layout className="org-layout">
      <Navbar solid title="人员组织" breadcrumb={breadcrumb} siderRight={collapsed ? 80 : 220} collapsed={collapsed} />
      <div className="org-body">
        <aside className={`org-sider${collapsed ? ' collapsed' : ''}`}>
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[menu]}
            items={menuItems}
            onClick={({ key }) => setMenu(key as MenuKey)}
          />
        </aside>
        <Content className="org-content">
          <div className="org-container">
            {menu === 'home' && <HomeView orgTree={orgTree} />}
            {menu === 'people' && <PeopleView orgTree={orgTree} />}
            {menu === 'org' && <OrgTreeView orgTree={orgTree} setOrgTree={setOrgTree} />}
          </div>
        </Content>
      </div>
    </Layout>
  )
}
