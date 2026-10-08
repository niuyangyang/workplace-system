import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
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
          return 'vendor'
        },
      },
    },
  },
})
