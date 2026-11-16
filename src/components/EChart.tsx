import { useEffect, useRef } from 'react'
import type { ECharts, EChartsOption as Option } from 'echarts'

type EChartsOption = Option

interface EChartProps {
  option: EChartsOption
  height?: number | string
  className?: string
}

/* echarts 走动态 import：它只在图表页/统计页用到，约 1.1MB。
   静态导入会让所有引用 EChart 的页面（含被 Scaffold 复用的页面）在首屏就拉整包。 */
export default function EChart({ option, height = 320, className }: EChartProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)
  const optionRef = useRef(option)
  optionRef.current = option

  useEffect(() => {
    let disposed = false
    let ro: ResizeObserver | undefined
    void import('echarts').then(({ init }) => {
      if (disposed || !elRef.current) return
      const chart = init(elRef.current)
      chartRef.current = chart
      chart.setOption(optionRef.current, true)
      ro = new ResizeObserver(() => chart.resize())
      ro.observe(elRef.current)
    })
    return () => {
      disposed = true
      ro?.disconnect()
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, true)
  }, [option])

  return <div ref={elRef} className={className} style={{ width: '100%', height }} />
}
