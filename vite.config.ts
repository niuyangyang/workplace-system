import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// base 可通过 VITE_BASE 环境变量切换：
// - 默认 '/'：根路径部署（CloudStudio / Cloudflare Pages），行为与原来完全一致
// - VITE_BASE=/workplace-system/：GitHub Pages 项目站点（URL 带仓库名子路径）
// loadEnv 会合并 shell 里同前缀的环境变量，所以构建时直接传 VITE_BASE 即可。
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],
    resolve: {
      // 强制单实例：react-router v6 没有 exports 字段（只有 main=CJS / module=ESM），
      // 依赖树里一旦出现第二份副本，就会被打进两份 react-router 代码，
      // 两份 context 实例互不相认 → 生产构建下 <Link> 读到 null context，报
      // "Cannot destructure property 'basename' of useContext(...) as it is null" 并白屏。
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    },
    server: {
      host: true,
      port: 5173,
      // 允许外部隧道域名（ngrok 免费域名每次都变，用通配符覆盖）
      // 否则 Vite 默认会返回 403 "Blocked request. This host is not allowed."
      allowedHosts: ['.ngrok-free.dev', '.ngrok.io', 'localhost', '127.0.0.1'],
    },
    build: {
      // 不统计 gzip 体积：省一次全量分配，构建更快也更省内存
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        maxParallelFileOps: 40,
        output: {
          // 把常驻依赖按生态拆成独立 chunk：单 chunk 从 4MB+ 降到 1MB 级，
          // 打包/压缩的峰值内存明显下降（本机内存紧张时 build 不再随机崩），
          // 同时首屏可以并行加载。mermaid 自带大量动态分包，交给 Rollup 自动处理。
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return
            if (/node_modules[\\/](mermaid|cytoscape|dagre|khroma|katex|elkjs|dompurify|marked|roughjs|d3[-a-z]*)[\\/]/.test(id)) return
            if (/node_modules[\\/](echarts|zrender)[\\/]/.test(id)) return 'vendor-echarts'
            if (/node_modules[\\/](three|@react-three)[\\/]/.test(id)) return 'vendor-three'
            if (/node_modules[\\/](antd|@ant-design|@rc-component)[\\/]/.test(id)) return 'vendor-antd'
            if (/node_modules[\\/]@wangeditor[\\/]/.test(id)) return 'vendor-editor'
            // threeui（54MB 包，产物 ~1.85MB）只被懒加载页面使用：
            // 必须显式指定独立 chunk —— 交给 Rollup 自动分块会让 build 卡死（实测 4 分钟无产出）；
            // 独立 chunk 又不会进首屏（没有首屏模块引用它），体积可控。
            if (/node_modules[\\/]@designcodeio[\\/]/.test(id)) return 'vendor-threeui'
            if (/node_modules[\\/](framer-motion|motion|lucide-react|lottie-web)[\\/]/.test(id)) return 'vendor-threeui'
            return 'vendor'
          },
        },
      },
    },
  }
})
