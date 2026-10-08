import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

type EChartsOption = echarts.EChartsOption

interface EChartProps {
  option: EChartsOption
  height?: number | string
  className?: string
}

export default function EChart({ option, height = 320, className }: EChartProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!elRef.current) return
    const chart = echarts.init(elRef.current)
    chartRef.current = chart

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(elRef.current)

    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, true)
  }, [option])

  return <div ref={elRef} className={className} style={{ width: '100%', height }} />
}
