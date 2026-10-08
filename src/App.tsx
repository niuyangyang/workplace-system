import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AppPlaceholder from './pages/AppPlaceholder'
import DocsCenter from './pages/DocsCenter'
import OrgCenter from './pages/OrgCenter'
import SystemMgmt from './pages/SystemMgmt'
import PolicyPortal, { PolicyPortalDetail, PolicyDiff } from './pages/PolicyPortal'
import OpinionCollect from './pages/OpinionCollect'
import OpinionSubmit from './pages/OpinionSubmit'
import MapScreen from './pages/MapScreen'
import PersonaScreen from './pages/PersonaScreen'
import BuildingScreen from './pages/BuildingScreen'
import MeetingRoom from './pages/MeetingRoom'
import MeetingRoomDetail from './pages/MeetingRoomDetail'
import ThreeuiShowcase from './pages/ThreeuiShowcase'
import Bigscreen3D from './pages/Bigscreen3D'
import TodoCenter from './pages/TodoCenter'
import NoticeCenter from './pages/NoticeCenter'
import Manual from './pages/Manual'
import IntroSite from './pages/IntroSite'
import MealOrdering from './pages/MealOrdering'

export default function App() {
  return (
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
      <Route path="/app/:id" element={<AppPlaceholder />} />
    </Routes>
  )
}