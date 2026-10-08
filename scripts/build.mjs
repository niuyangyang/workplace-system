/**
 * 生产构建包装脚本
 *
 * 背景：本项目的 esbuild 是以独立 Go 进程运行的。本机内存偏紧时，
 * 它的 GC 会放任堆增长，最终以 `The service was stopped` 或 native OOM 崩掉，
 * 表现为 `npm run build` 随机在中途失败（日志停在 transforming，没有报错信息）。
 *
 * 解决：在 Vite 启动前（此时 esbuild 还没被 spawn）给 Go 运行时设
 *   - GOMEMLIMIT：软内存上限，触发更积极的 GC，避免堆无限膨胀
 *   - GOMAXPROCS：限制并行度，压低瞬时峰值
 * 子进程会继承这两个环境变量，实测构建稳定性明显提升。
 *
 * 用法：node --max-old-space-size=3072 scripts/build.mjs
 */
process.env.GOMAXPROCS ??= '4'
process.env.GOMEMLIMIT ??= '1500MiB'

const { build } = await import('vite')

try {
  await build()
} catch (err) {
  console.error('\n[build] 构建失败：', err?.message ?? err)
  if (/service was stopped|out of memory|Zone/i.test(String(err?.message ?? err))) {
    console.error(
      '[build] 检测到内存相关崩溃。可关闭其它占内存的程序后重试，' +
        '或再把 GOMEMLIMIT / GOMAXPROCS 调低一档。',
    )
  }
  process.exit(1)
}
