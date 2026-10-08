import { useEffect, useRef } from 'react'
import { createEditor, createToolbar } from '@wangeditor/editor'
import type { IDomEditor } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import './richTextEditor.css'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  height?: number
}

// 轻量富文本编辑器（wangEditor v5）：工具栏 + 可编辑区
export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容…',
  height = 260,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const editorInstance = useRef<IDomEditor | null>(null)

  // 用 ref 持有最新回调，避免初始化时闭包捕获旧值
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!editorRef.current || !toolbarRef.current) return

    const editor = createEditor({
      selector: editorRef.current,
      html: value || '<p><br></p>',
      config: {
        placeholder,
        onChange(ed) {
          onChangeRef.current(ed.getHtml())
        },
      },
      mode: 'default',
    })
    const toolbar = createToolbar({
      editor,
      selector: toolbarRef.current,
      config: {},
      mode: 'default',
    })
    editorInstance.current = editor

    return () => {
      toolbar.destroy()
      editor.destroy()
      editorInstance.current = null
    }
    // 仅初始化一次；外部重置内容由下方 effect 处理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 外部值变化（例如弹窗重新打开）时同步内容
  useEffect(() => {
    const ed = editorInstance.current
    if (!ed) return
    const next = value || '<p><br></p>'
    if (next !== ed.getHtml()) ed.setHtml(next)
  }, [value])

  return (
    <div className="rte-wrap">
      <div ref={toolbarRef} className="rte-toolbar" />
      <div ref={editorRef} className="rte-editor" style={{ height }} />
    </div>
  )
}
