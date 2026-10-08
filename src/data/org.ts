/* ===================== 人员组织 · 共享数据（单一事实源） =====================
 * 该文件是「人员组织」应用与「会议室预订」等其它应用的统一组织/人员数据源。
 * 修改组织架构或人员，只要改这里，所有引用它的应用同步生效。
 * ========================================================================= */

export type OrgType = '集团' | '中心' | '部门' | '小组' | '子公司'
export type OrgStatus = '启用' | '筹备中' | '已停用'
export type PersonStatus = '在职' | '试用期' | '离职'
export type EducationLevel = '高中' | '大专' | '本科' | '硕士' | '博士'

export interface OrgNode {
  id: string
  name: string
  type: OrgType
  leader: string
  phone: string
  status: OrgStatus
  children?: OrgNode[]
}

export interface Person {
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

/* ----------------------------- 组织树 ----------------------------- */
export const ORG_TREE: OrgNode[] = [
  {
    id: 'xinghui',
    name: '星辉科技集团',
    type: '集团',
    leader: '沈志远',
    phone: '021-62880000',
    status: '启用',
    children: [
      { id: 'president', name: '总裁办', type: '部门', leader: '周敏', phone: '021-62880010', status: '启用' },
      { id: 'strategy', name: '战略发展部', type: '部门', leader: '高锐', phone: '021-62880011', status: '启用' },
      { id: 'audit-dept', name: '内审部', type: '部门', leader: '罗静', phone: '021-62880012', status: '启用' },
      {
        id: 'rdc',
        name: '研发中心',
        type: '中心',
        leader: '陈浩',
        phone: '021-62880100',
        status: '启用',
        children: [
          { id: 'rd-backend', name: '后端研发组', type: '小组', leader: '刘伟', phone: '021-62880110', status: '启用' },
          { id: 'rd-frontend', name: '前端研发组', type: '小组', leader: '赵磊', phone: '021-62880111', status: '启用' },
          { id: 'rd-test', name: '测试组', type: '小组', leader: '孙琳', phone: '021-62880112', status: '启用' },
          { id: 'rd-algo', name: '算法组', type: '小组', leader: '吴桐', phone: '021-62880113', status: '筹备中' },
          { id: 'rd-ops', name: '运维组', type: '小组', leader: '邵峰', phone: '021-62880114', status: '启用' },
          { id: 'rd-sec', name: '安全组', type: '小组', leader: '贺敏', phone: '021-62880115', status: '启用' },
        ],
      },
      {
        id: 'product',
        name: '产品中心',
        type: '中心',
        leader: '林楠',
        phone: '021-62880200',
        status: '启用',
        children: [
          { id: 'pd-group', name: '产品组', type: '小组', leader: '黄蓉', phone: '021-62880210', status: '启用' },
          { id: 'ds-group', name: '设计组', type: '小组', leader: '徐静', phone: '021-62880211', status: '启用' },
          { id: 'ur-group', name: '用户研究组', type: '小组', leader: '白露', phone: '021-62880212', status: '启用' },
        ],
      },
      {
        id: 'market',
        name: '市场中心',
        type: '中心',
        leader: '郑凯',
        phone: '021-62880300',
        status: '启用',
        children: [
          { id: 'brand-group', name: '品牌组', type: '小组', leader: '苏晴', phone: '021-62880310', status: '启用' },
          { id: 'sales-1', name: '销售一组', type: '小组', leader: '马涛', phone: '021-62880311', status: '启用' },
          { id: 'sales-2', name: '销售二组', type: '小组', leader: '方圆', phone: '021-62880312', status: '启用' },
          { id: 'sales-3', name: '销售三组', type: '小组', leader: '葛亮', phone: '021-62880313', status: '筹备中' },
          { id: 'channel-group', name: '渠道组', type: '小组', leader: '尹航', phone: '021-62880314', status: '启用' },
        ],
      },
      {
        id: 'operation',
        name: '运营中心',
        type: '中心',
        leader: '夏雨',
        phone: '021-62880350',
        status: '启用',
        children: [
          { id: 'user-ops', name: '用户运营组', type: '小组', leader: '范冰', phone: '021-62880351', status: '启用' },
          { id: 'content-ops', name: '内容运营组', type: '小组', leader: '孟非', phone: '021-62880352', status: '启用' },
          { id: 'activity-ops', name: '活动运营组', type: '小组', leader: '邱晨', phone: '021-62880353', status: '启用' },
        ],
      },
      {
        id: 'service',
        name: '客服中心',
        type: '中心',
        leader: '谭松',
        phone: '021-62880380',
        status: '启用',
        children: [
          { id: 'pre-sales', name: '售前客服组', type: '小组', leader: '贾玲', phone: '021-62880381', status: '启用' },
          { id: 'after-sales', name: '售后客服组', type: '小组', leader: '潘虹', phone: '021-62880382', status: '启用' },
        ],
      },
      {
        id: 'supply',
        name: '供应链中心',
        type: '中心',
        leader: '薛强',
        phone: '021-62880450',
        status: '启用',
        children: [
          { id: 'purchase', name: '采购组', type: '小组', leader: '崔健', phone: '021-62880451', status: '启用' },
          { id: 'warehouse', name: '仓储物流组', type: '小组', leader: '叶蓓', phone: '021-62880452', status: '启用' },
          { id: 'vendor', name: '供应商管理组', type: '小组', leader: '顾伟', phone: '021-62880453', status: '筹备中' },
        ],
      },
      {
        id: 'hr',
        name: '人力资源中心',
        type: '中心',
        leader: '何雪',
        phone: '021-62880500',
        status: '启用',
        children: [
          { id: 'recruit', name: '招聘组', type: '小组', leader: '钱进', phone: '021-62880510', status: '启用' },
          { id: 'comp', name: '薪酬绩效组', type: '小组', leader: '冯洁', phone: '021-62880511', status: '启用' },
          { id: 'training', name: '培训发展组', type: '小组', leader: '丁磊', phone: '021-62880512', status: '启用' },
        ],
      },
      {
        id: 'finance',
        name: '财务中心',
        type: '中心',
        leader: '许文',
        phone: '021-62880550',
        status: '启用',
        children: [
          { id: 'account', name: '会计组', type: '小组', leader: '邓超', phone: '021-62880551', status: '启用' },
          { id: 'cashier', name: '出纳组', type: '小组', leader: '韩梅', phone: '021-62880552', status: '启用' },
          { id: 'audit-fin', name: '审计组', type: '小组', leader: '常乐', phone: '021-62880553', status: '启用' },
        ],
      },
      {
        id: 'admin',
        name: '行政中心',
        type: '中心',
        leader: '曹颖',
        phone: '021-62880600',
        status: '启用',
        children: [
          { id: 'reception', name: '前台组', type: '小组', leader: '宋佳', phone: '021-62880610', status: '启用' },
          { id: 'logistics', name: '后勤组', type: '小组', leader: '袁泉', phone: '021-62880611', status: '启用' },
          { id: 'security', name: '安保组', type: '小组', leader: '武警', phone: '021-62880612', status: '启用' },
        ],
      },
      {
        id: 'data',
        name: '数据中心',
        type: '中心',
        leader: '彭飞',
        phone: '021-62880650',
        status: '启用',
        children: [
          { id: 'data-platform', name: '数据平台组', type: '小组', leader: '汪洋', phone: '021-62880651', status: '启用' },
          { id: 'data-analysis', name: '数据分析组', type: '小组', leader: '沈月', phone: '021-62880652', status: '启用' },
          { id: 'bi-group', name: '商业智能组', type: '小组', leader: '蓝天', phone: '021-62880653', status: '筹备中' },
        ],
      },
      {
        id: 'legal',
        name: '法务中心',
        type: '中心',
        leader: '康辉',
        phone: '021-62880680',
        status: '启用',
        children: [
          { id: 'compliance', name: '合规组', type: '小组', leader: '金鑫', phone: '021-62880681', status: '启用' },
          { id: 'ip-group', name: '知识产权组', type: '小组', leader: '魏来', phone: '021-62880682', status: '启用' },
        ],
      },
      {
        id: 'quality',
        name: '质量中心',
        type: '中心',
        leader: '邵兵',
        phone: '021-62880700',
        status: '启用',
        children: [
          { id: 'qa-group', name: '质量管理组', type: '小组', leader: '石磊', phone: '021-62880701', status: '启用' },
          { id: 'cert-group', name: '测试认证组', type: '小组', leader: '田甜', phone: '021-62880702', status: '启用' },
        ],
      },
      {
        id: 'subcompany',
        name: '星辉智能科技（子公司）',
        type: '子公司',
        leader: '唐宁',
        phone: '021-62880800',
        status: '启用',
        children: [
          { id: 'sub-rd', name: '子公司研发部', type: '部门', leader: '尹涛', phone: '021-62880810', status: '启用' },
          { id: 'sub-market', name: '子公司市场部', type: '部门', leader: '柳岩', phone: '021-62880811', status: '启用' },
          { id: 'sub-admin', name: '子公司行政部', type: '部门', leader: '倪萍', phone: '021-62880812', status: '启用' },
        ],
      },
    ],
  },
]

/* ----------------------------- 人员 ----------------------------- */
export type SeedPerson = Omit<Person, 'education'>

export const ORG_PEOPLE_RAW: SeedPerson[] = [
  { key: 'p1', name: '沈志远', empNo: 'E10001', orgId: 'xinghui', position: '董事长', phone: '138-0000-1001', email: 'e10001@xinghui.com', status: '在职', age: 50, hireDate: '2015-03' },
  { key: 'p2', name: '周敏', empNo: 'E10002', orgId: 'president', position: '总裁办主任', phone: '138-0000-1002', email: 'e10002@xinghui.com', status: '在职', age: 45, hireDate: '2016-05' },
  { key: 'p3', name: '陈浩', empNo: 'E10003', orgId: 'rdc', position: '研发总监', phone: '138-0000-1003', email: 'e10003@xinghui.com', status: '在职', age: 38, hireDate: '2016-09' },
  { key: 'p4', name: '刘伟', empNo: 'E10004', orgId: 'rd-backend', position: '后端组长', phone: '138-0000-1004', email: 'e10004@xinghui.com', status: '在职', age: 33, hireDate: '2018-04' },
  { key: 'p5', name: '赵磊', empNo: 'E10005', orgId: 'rd-frontend', position: '前端组长', phone: '138-0000-1005', email: 'e10005@xinghui.com', status: '在职', age: 32, hireDate: '2018-06' },
  { key: 'p6', name: '孙琳', empNo: 'E10006', orgId: 'rd-test', position: '测试组长', phone: '138-0000-1006', email: 'e10006@xinghui.com', status: '在职', age: 30, hireDate: '2019-03' },
  { key: 'p7', name: '吴桐', empNo: 'E10007', orgId: 'rd-algo', position: '算法组长', phone: '138-0000-1007', email: 'e10007@xinghui.com', status: '试用期', age: 29, hireDate: '2026-03' },
  { key: 'p8', name: '林楠', empNo: 'E10008', orgId: 'product', position: '产品总监', phone: '138-0000-1008', email: 'e10008@xinghui.com', status: '在职', age: 36, hireDate: '2017-02' },
  { key: 'p9', name: '黄蓉', empNo: 'E10009', orgId: 'pd-group', position: '产品经理', phone: '138-0000-1009', email: 'e10009@xinghui.com', status: '在职', age: 31, hireDate: '2019-05' },
  { key: 'p10', name: '徐静', empNo: 'E10010', orgId: 'ds-group', position: 'UI设计师', phone: '138-0000-1010', email: 'e10010@xinghui.com', status: '在职', age: 28, hireDate: '2020-03' },
  { key: 'p11', name: '郑凯', empNo: 'E10011', orgId: 'market', position: '市场总监', phone: '138-0000-1011', email: 'e10011@xinghui.com', status: '在职', age: 39, hireDate: '2016-11' },
  { key: 'p12', name: '马涛', empNo: 'E10012', orgId: 'sales-1', position: '销售组长', phone: '138-0000-1012', email: 'e10012@xinghui.com', status: '在职', age: 34, hireDate: '2018-08' },
  { key: 'p13', name: '方圆', empNo: 'E10013', orgId: 'sales-2', position: '销售专员', phone: '138-0000-1013', email: 'e10013@xinghui.com', status: '在职', age: 27, hireDate: '2021-06' },
  { key: 'p14', name: '何雪', empNo: 'E10014', orgId: 'hr', position: 'HR总监', phone: '138-0000-1014', email: 'e10014@xinghui.com', status: '在职', age: 40, hireDate: '2016-04' },
  { key: 'p15', name: '钱进', empNo: 'E10015', orgId: 'recruit', position: '招聘专员', phone: '138-0000-1015', email: 'e10015@xinghui.com', status: '在职', age: 28, hireDate: '2020-09' },
  { key: 'p16', name: '冯洁', empNo: 'E10016', orgId: 'comp', position: '薪酬专员', phone: '138-0000-1016', email: 'e10016@xinghui.com', status: '在职', age: 30, hireDate: '2019-08' },
  { key: 'p17', name: '许文', empNo: 'E10017', orgId: 'finance', position: '财务总监', phone: '138-0000-1017', email: 'e10017@xinghui.com', status: '在职', age: 43, hireDate: '2016-02' },
  { key: 'p18', name: '邓超', empNo: 'E10018', orgId: 'account', position: '会计', phone: '138-0000-1018', email: 'e10018@xinghui.com', status: '在职', age: 29, hireDate: '2019-06' },
  { key: 'p19', name: '韩梅', empNo: 'E10019', orgId: 'cashier', position: '出纳', phone: '138-0000-1019', email: 'e10019@xinghui.com', status: '在职', age: 27, hireDate: '2021-03' },
  { key: 'p20', name: '曹颖', empNo: 'E10020', orgId: 'admin', position: '行政总监', phone: '138-0000-1020', email: 'e10020@xinghui.com', status: '在职', age: 39, hireDate: '2016-06' },
  { key: 'p21', name: '宋佳', empNo: 'E10021', orgId: 'reception', position: '前台', phone: '138-0000-1021', email: 'e10021@xinghui.com', status: '在职', age: 25, hireDate: '2022-08' },
  { key: 'p22', name: '袁泉', empNo: 'E10022', orgId: 'logistics', position: '后勤专员', phone: '138-0000-1022', email: 'e10022@xinghui.com', status: '离职', age: 36, hireDate: '2017-09' },
  { key: 'p23', name: '高锐', empNo: 'E10023', orgId: 'strategy', position: '战略总监', phone: '138-0000-1023', email: 'e10023@xinghui.com', status: '在职', age: 42, hireDate: '2017-08' },
  { key: 'p24', name: '罗静', empNo: 'E10024', orgId: 'audit-dept', position: '内审经理', phone: '138-0000-1024', email: 'e10024@xinghui.com', status: '在职', age: 40, hireDate: '2018-02' },
  { key: 'p25', name: '邵峰', empNo: 'E10025', orgId: 'rd-ops', position: '运维组长', phone: '138-0000-1025', email: 'e10025@xinghui.com', status: '在职', age: 34, hireDate: '2019-07' },
  { key: 'p26', name: '贺敏', empNo: 'E10026', orgId: 'rd-sec', position: '安全组长', phone: '138-0000-1026', email: 'e10026@xinghui.com', status: '在职', age: 35, hireDate: '2020-01' },
  { key: 'p27', name: '白露', empNo: 'E10027', orgId: 'ur-group', position: '用户研究员', phone: '138-0000-1027', email: 'e10027@xinghui.com', status: '在职', age: 30, hireDate: '2021-04' },
  { key: 'p28', name: '苏晴', empNo: 'E10028', orgId: 'brand-group', position: '品牌经理', phone: '138-0000-1028', email: 'e10028@xinghui.com', status: '在职', age: 33, hireDate: '2019-09' },
  { key: 'p29', name: '葛亮', empNo: 'E10029', orgId: 'sales-3', position: '销售专员', phone: '138-0000-1029', email: 'e10029@xinghui.com', status: '试用期', age: 26, hireDate: '2025-11' },
  { key: 'p30', name: '尹航', empNo: 'E10030', orgId: 'channel-group', position: '渠道经理', phone: '138-0000-1030', email: 'e10030@xinghui.com', status: '在职', age: 37, hireDate: '2018-10' },
  { key: 'p31', name: '夏雨', empNo: 'E10031', orgId: 'operation', position: '运营总监', phone: '138-0000-1031', email: 'e10031@xinghui.com', status: '在职', age: 35, hireDate: '2017-05' },
  { key: 'p32', name: '范冰', empNo: 'E10032', orgId: 'user-ops', position: '用户运营', phone: '138-0000-1032', email: 'e10032@xinghui.com', status: '在职', age: 28, hireDate: '2020-07' },
  { key: 'p33', name: '孟非', empNo: 'E10033', orgId: 'content-ops', position: '内容运营', phone: '138-0000-1033', email: 'e10033@xinghui.com', status: '在职', age: 29, hireDate: '2021-02' },
  { key: 'p34', name: '邱晨', empNo: 'E10034', orgId: 'activity-ops', position: '活动运营', phone: '138-0000-1034', email: 'e10034@xinghui.com', status: '在职', age: 27, hireDate: '2022-03' },
  { key: 'p35', name: '谭松', empNo: 'E10035', orgId: 'service', position: '客服总监', phone: '138-0000-1035', email: 'e10035@xinghui.com', status: '在职', age: 41, hireDate: '2016-12' },
  { key: 'p36', name: '贾玲', empNo: 'E10036', orgId: 'pre-sales', position: '售前客服', phone: '138-0000-1036', email: 'e10036@xinghui.com', status: '在职', age: 26, hireDate: '2022-05' },
  { key: 'p37', name: '潘虹', empNo: 'E10037', orgId: 'after-sales', position: '售后客服', phone: '138-0000-1037', email: 'e10037@xinghui.com', status: '在职', age: 30, hireDate: '2021-09' },
  { key: 'p38', name: '薛强', empNo: 'E10038', orgId: 'supply', position: '供应链总监', phone: '138-0000-1038', email: 'e10038@xinghui.com', status: '在职', age: 44, hireDate: '2016-07' },
  { key: 'p39', name: '崔健', empNo: 'E10039', orgId: 'purchase', position: '采购经理', phone: '138-0000-1039', email: 'e10039@xinghui.com', status: '在职', age: 38, hireDate: '2018-03' },
  { key: 'p40', name: '叶蓓', empNo: 'E10040', orgId: 'warehouse', position: '仓储主管', phone: '138-0000-1040', email: 'e10040@xinghui.com', status: '在职', age: 33, hireDate: '2019-11' },
  { key: 'p41', name: '顾伟', empNo: 'E10041', orgId: 'vendor', position: '供应商管理', phone: '138-0000-1041', email: 'e10041@xinghui.com', status: '试用期', age: 31, hireDate: '2026-01' },
  { key: 'p42', name: '丁磊', empNo: 'E10042', orgId: 'training', position: '培训专员', phone: '138-0000-1042', email: 'e10042@xinghui.com', status: '在职', age: 32, hireDate: '2021-07' },
  { key: 'p43', name: '常乐', empNo: 'E10043', orgId: 'audit-fin', position: '审计', phone: '138-0000-1043', email: 'e10043@xinghui.com', status: '在职', age: 34, hireDate: '2018-05' },
  { key: 'p44', name: '武警', empNo: 'E10044', orgId: 'security', position: '安保主管', phone: '138-0000-1044', email: 'e10044@xinghui.com', status: '在职', age: 45, hireDate: '2017-01' },
  { key: 'p45', name: '彭飞', empNo: 'E10045', orgId: 'data', position: '数据总监', phone: '138-0000-1045', email: 'e10045@xinghui.com', status: '在职', age: 37, hireDate: '2017-04' },
  { key: 'p46', name: '汪洋', empNo: 'E10046', orgId: 'data-platform', position: '数据平台', phone: '138-0000-1046', email: 'e10046@xinghui.com', status: '在职', age: 31, hireDate: '2020-02' },
  { key: 'p47', name: '沈月', empNo: 'E10047', orgId: 'data-analysis', position: '数据分析', phone: '138-0000-1047', email: 'e10047@xinghui.com', status: '在职', age: 28, hireDate: '2021-05' },
  { key: 'p48', name: '蓝天', empNo: 'E10048', orgId: 'bi-group', position: '商业智能', phone: '138-0000-1048', email: 'e10048@xinghui.com', status: '试用期', age: 27, hireDate: '2025-12' },
  { key: 'p49', name: '康辉', empNo: 'E10049', orgId: 'legal', position: '法务总监', phone: '138-0000-1049', email: 'e10049@xinghui.com', status: '在职', age: 42, hireDate: '2016-10' },
  { key: 'p50', name: '金鑫', empNo: 'E10050', orgId: 'compliance', position: '合规', phone: '138-0000-1050', email: 'e10050@xinghui.com', status: '在职', age: 33, hireDate: '2019-01' },
  { key: 'p51', name: '魏来', empNo: 'E10051', orgId: 'ip-group', position: '知识产权', phone: '138-0000-1051', email: 'e10051@xinghui.com', status: '在职', age: 35, hireDate: '2018-09' },
  { key: 'p52', name: '邵兵', empNo: 'E10052', orgId: 'quality', position: '质量总监', phone: '138-0000-1052', email: 'e10052@xinghui.com', status: '在职', age: 41, hireDate: '2016-08' },
  { key: 'p53', name: '石磊', empNo: 'E10053', orgId: 'qa-group', position: '质量管理', phone: '138-0000-1053', email: 'e10053@xinghui.com', status: '在职', age: 32, hireDate: '2019-10' },
  { key: 'p54', name: '田甜', empNo: 'E10054', orgId: 'cert-group', position: '测试认证', phone: '138-0000-1054', email: 'e10054@xinghui.com', status: '在职', age: 29, hireDate: '2021-11' },
  { key: 'p55', name: '唐宁', empNo: 'E10055', orgId: 'subcompany', position: '子公司总经理', phone: '138-0000-1055', email: 'e10055@xinghui.com', status: '在职', age: 46, hireDate: '2018-01' },
  { key: 'p56', name: '尹涛', empNo: 'E10056', orgId: 'sub-rd', position: '子公司研发', phone: '138-0000-1056', email: 'e10056@xinghui.com', status: '在职', age: 34, hireDate: '2019-04' },
  { key: 'p57', name: '柳岩', empNo: 'E10057', orgId: 'sub-market', position: '子公司市场', phone: '138-0000-1057', email: 'e10057@xinghui.com', status: '在职', age: 31, hireDate: '2020-06' },
  { key: 'p58', name: '倪萍', empNo: 'E10058', orgId: 'sub-admin', position: '子公司行政', phone: '138-0000-1058', email: 'e10058@xinghui.com', status: '在职', age: 33, hireDate: '2019-12' },
]

// 学历按序轮转，保证数据多样
export const EDUCATION_POOL: EducationLevel[] = ['本科', '硕士', '博士', '大专', '高中']
export const ORG_PEOPLE: Person[] = ORG_PEOPLE_RAW.map((p, i) => ({
  ...p,
  education: EDUCATION_POOL[i % EDUCATION_POOL.length],
}))

export const ORG_ROOT_ID = ORG_TREE[0].id
export const ORG_ROOT_NAME = ORG_TREE[0].name

/* ----------------------------- 索引与工具 ----------------------------- */
function walk(
  nodes: OrgNode[],
  cb: (n: OrgNode, parentId: string | null) => void,
  parentId: string | null = null,
) {
  nodes.forEach((n) => {
    cb(n, parentId)
    if (n.children) walk(n.children, cb, n.id)
  })
}

export const ORG_NODE_MAP: Record<string, OrgNode> = {}
export const ORG_PARENT_MAP: Record<string, string | null> = {}
walk(ORG_TREE, (n, parentId) => {
  ORG_NODE_MAP[n.id] = n
  ORG_PARENT_MAP[n.id] = parentId
})

/** 部门节点的名称（叶子组织名，如“后端研发组”） */
export function orgLeafName(id: string): string {
  return ORG_NODE_MAP[id]?.name ?? ''
}

/**
 * 人员所属的“一级组织”名称（集团直属部门或中心，如“研发中心”）。
 * 用于把人员归到较粗的部门分组（通讯录按此分组）。
 */
export function orgGroupName(id: string): string {
  if (!ORG_NODE_MAP[id]) return ''
  if (id === ORG_ROOT_ID) return ORG_ROOT_NAME
  let cur = id
  let parent = ORG_PARENT_MAP[cur]
  while (parent && parent !== ORG_ROOT_ID) {
    cur = parent
    parent = ORG_PARENT_MAP[cur]
  }
  return ORG_NODE_MAP[cur]?.name ?? ''
}
