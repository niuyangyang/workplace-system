import Navbar from "../components/Navbar";
import {
  GlassmorphismCta,
  PerformanceGauges,
  DiagnosticsPanel,
} from "@designcodeio/threeui";
import "./threeuiShowcase.css";

export default function ThreeuiShowcase() {
  return (
    <div className="tu-root">
      <Navbar solid title="科技风组件 · ThreeUI" />
      <div className="tu-vignette" aria-hidden />

      <header className="tu-hero">
        <span className="tu-tag">POWERED BY THREEUI · MIT</span>
        <h1 className="tu-title">Neuform 科技风组件预览</h1>
        <p className="tu-sub">
          把 Meng To（DesignCode）开源的 Three.js 特效件接入大屏视觉规范，
          作为 KPI 仪表 / 行动召唤 / 系统状态面板的点缀层。组件以沙箱 iframe
          自管理 WebGL，与你现有 ECharts 大屏、R3F 楼宇互不干扰。
        </p>
      </header>

      <main className="tu-grid">
        <section className="tu-card">
          <header className="tu-card__head">
            <h2>Glassmorphism CTA</h2>
            <span className="tu-card__meta">拟物玻璃 · 行动召唤</span>
          </header>
          <div className="tu-stage tu-stage--tall">
            <GlassmorphismCta mode="dark" style={{ height: "100%", width: "100%" }} />
          </div>
        </section>

        <section className="tu-card">
          <header className="tu-card__head">
            <h2>Performance Gauges</h2>
            <span className="tu-card__meta">性能仪表 · tachometer</span>
          </header>
          <div className="tu-stage tu-stage--tall">
            <PerformanceGauges
              mode="dark"
              variant="tachometer"
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </section>

        <section className="tu-card tu-card--wide">
          <header className="tu-card__head">
            <h2>Diagnostics Panel</h2>
            <span className="tu-card__meta">系统诊断 · variant: layers</span>
          </header>
          <div className="tu-stage">
            <DiagnosticsPanel
              mode="dark"
              variant="layers"
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </section>
      </main>

      <footer className="tu-foot">
        组件来源：ThreeUI Community（Meng To / DesignCode）· MIT License ·
        当前为接入预览，可后续折叠进 <code>/app/bigscreen</code> 大屏。
      </footer>
    </div>
  );
}
