import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'base',
  themeVariables: {
    primaryColor: '#eef2ff',
    primaryBorderColor: '#3b5bff',
    primaryTextColor: '#1f2937',
    secondaryColor: '#f5f7ff',
    tertiaryColor: '#fafbff',
    lineColor: '#93a0c0',
    fontFamily: 'inherit',
    fontSize: '13px',
  },
  flowchart: { curve: 'basis', htmlLabels: true, padding: 12 },
  sequence: { useMaxWidth: true, actorMargin: 56, mirrorActors: false, boxMargin: 8 },
})

let seq = 0

/**
 * 渲染 Mermaid 图表（flowchart / sequenceDiagram 等）
 * 用法：<Mermaid chart={`flowchart TD\n A-->B`} />
 */
export default function Mermaid({ chart, className }: { chart: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    let cancelled = false
    const id = `mmd-${++seq}`
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      })
      .catch((err) => {
        if (ref.current) {
          ref.current.innerHTML = '<div class="mmd-error">图表渲染失败，请检查语法</div>'
        }
        // eslint-disable-next-line no-console
        console.error('[Mermaid] render error:', err)
      })
    return () => {
      cancelled = true
    }
  }, [chart])

  return <div className={'mmd-wrap' + (className ? ' ' + className : '')} ref={ref} />
}
