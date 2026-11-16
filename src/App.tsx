import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AppPlaceholder from './pages/AppPlaceholder'
import PolicyPortal, { PolicyPortalDetail, PolicyDiff } from './pages/PolicyPortal'
import OpinionCollect from './pages/OpinionCollect'
import OpinionSubmit from './pages/OpinionSubmit'
import PersonaScreen from './pages/PersonaScreen'
import MeetingRoom from './pages/MeetingRoom'
import MeetingRoomDetail from './pages/MeetingRoomDetail'
import TodoCenter from './pages/TodoCenter'
import NoticeCenter from './pages/NoticeCenter'
import Manual from './pages/Manual'
import MealOrdering from './pages/MealOrdering'
import FloorPlan from './pages/FloorPlan'
import AgileDev from './pages/AgileDev'
import Scaffold from './pages/Scaffold'
import SmartQA from './pages/SmartQA'
import WorkSummary from './pages/WorkSummary'

/* 重依赖页面按需加载：docs(wangEditor) / bigscreen(echarts) / building(three)
   / org & system(echarts) / intro(mermaid)。
   这几个库合计约 5MB，首屏不再加载，首页只需 antd + 门户代码。 */
const DocsCenter = lazy(() => import('./pages/DocsCenter'))
const MapScreen = lazy(() => import('./pages/MapScreen'))
const BuildingScreen = lazy(() => import('./pages/BuildingScreen'))
const OrgCenter = lazy(() => import('./pages/OrgCenter'))
const SystemMgmt = lazy(() => import('./pages/SystemMgmt'))
const IntroSite = lazy(() => import('./pages/IntroSite'))
const ThreeuiShowcase = lazy(() => import('./pages/ThreeuiShowcase'))
const Bigscreen3D = lazy(() => import('./pages/Bigscreen3D'))

/* 路由级加载占位：极轻，避免跳转时白屏 */
function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f7fb',
        color: '#5b647a',
        fontSize: 14,
        gap: 10,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '2px solid #d9dfeb',
          borderTopColor: '#3b5bff',
          display: 'inline-block',
          animation: 'routeSpin .8s linear infinite',
        }}
      />
      正在加载…
      <style>{'@keyframes routeSpin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* 门户顶部导航：待办事项 / 通知公告 / 使用手册 */}
        <Route path="/todos" element={<TodoCenter />} />
        <Route path="/notices" element={<NoticeCenter />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/app/docs" element={<DocsCenter />} />
        <Route path="/app/org" element={<OrgCenter />} />
        <Route path="/app/system" element={<SystemMgmt />} />
        <Route path="/app/policy" element={<PolicyPortal />} />
        <Route path="/app/policy/opinions" element={<OpinionCollect />} />
        <Route path="/app/policy/opinions/:id" element={<OpinionSubmit />} />
        <Route path="/app/policy/detail/:id" element={<PolicyPortalDetail />} />
        <Route path="/app/policy/diff/:id" element={<PolicyDiff />} />
        <Route path="/app/bigscreen" element={<MapScreen />} />
        <Route path="/app/persona" element={<PersonaScreen />} />
        <Route path="/app/building" element={<BuildingScreen />} />
        <Route path="/app/meeting" element={<MeetingRoom />} />
        <Route path="/app/meeting/:id" element={<MeetingRoomDetail />} />
        <Route path="/app/threeui" element={<ThreeuiShowcase />} />
        <Route path="/app/bigscreen3d" element={<Bigscreen3D />} />
        <Route path="/app/intro" element={<IntroSite />} />
        <Route path="/app/meal" element={<MealOrdering />} />
        <Route path="/app/floorplan" element={<FloorPlan />} />
        <Route path="/app/agile" element={<AgileDev />} />
        <Route path="/app/scaffold" element={<Scaffold />} />
        <Route path="/app/qa" element={<SmartQA />} />
        <Route path="/app/worksummary" element={<WorkSummary />} />
        <Route path="/app/:id" element={<AppPlaceholder />} />
      </Routes>
    </Suspense>
  )
}
