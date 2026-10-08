/**
 * 一次性脚本：生成演示用附件（最小可用的单页 PDF，正文为占位英文）
 * 生成位置：public/attachments/
 * 说明：正文用 ASCII 是为了避免 PDF 内置字体无法渲染中文；
 *      文件名带中文，模拟「制度正文.pdf」这类真实附件。
 */
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve(process.cwd(), 'public/attachments')
fs.mkdirSync(OUT, { recursive: true })

function makePdf(lines) {
  const text = lines
    .map((l, i) => `BT /F1 ${i === 0 ? 18 : 12} Tf 60 ${760 - i * 26} Td (${l.replace(/[()\\]/g, '')}) Tj ET`)
    .join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = []
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf, 'latin1')
}

const files = [
  ['员工考勤管理办法-2026修订版.pdf', 'Employee Attendance Policy (2026 Rev.)', 'Sample attachment for prototype demo.'],
  ['考勤管理办法修订对照表.pdf', 'Attendance Policy - Revision Comparison', 'Sample attachment for prototype demo.'],
  ['请假与调休申请流程说明.pdf', 'Leave & Compensatory Rest - Process Guide', 'Sample attachment for prototype demo.'],
  ['第3期评审会议材料.pdf', 'Review Meeting Materials (Session 3)', 'Sample attachment for prototype demo.'],
  ['供应商准入制度-征求意见稿.pdf', 'Supplier Admission Policy (Draft)', 'Sample attachment for prototype demo.'],
]

for (const [name, title, note] of files) {
  const buf = makePdf([title, note, 'This file is a placeholder generated for the UI prototype.'])
  fs.writeFileSync(path.join(OUT, name), buf)
  console.log('生成', name, buf.length, 'bytes')
}
