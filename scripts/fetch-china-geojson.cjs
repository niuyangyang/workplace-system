/**
 * 一次性生成中国省级行政区边界 GeoJSON（供 ECharts 使用）
 *
 * 数据来源：天地图（国家地理信息公共服务平台，合规白名单内）
 *   接口： http://api.tianditu.gov.cn/v2/administrative?keyword=156<adcode>&childLevel=0&extensions=true&tk=<tk>
 *   返回： data.district[0].boundary 为 WKT（POLYGON / MULTIPOLYGON）
 *
 * 用法：
 *   node scripts/fetch-china-geojson.cjs --tk=你的天地图Key
 *   node scripts/fetch-china-geojson.cjs --tk=xxx --out=public/china-provinces.json
 *
 * 说明：
 *   - 只在“生成阶段”联网一次；产物是本地静态文件，运行时零请求、零 Key。
 *   - 坐标保留 4 位小数（约 11m，足够大屏使用）；仅对超大环做 Douglas-Peucker 抽稀，
 *     小环（岛屿）原样保留，避免丢失南海诸岛等要素。
 */

const fs = require('fs')
const path = require('path')

/**
 * 备注：项目内现有的 public/china-provinces.json 是 2026-09-17 用**腾讯位置服务行政区划**
 * （经 WorkBuddy 代理，前端零密钥）一次性导出的，共 34 个省级行政区 / 845 个多边形 / 约 0.9MB。
 * 本脚本则是同等的**天地图**通道，用于无腾讯代理环境下的重新生成，产物结构完全一致。
 */

const PROVINCES = [
  { name: '北京', adcode: 110000 }, { name: '天津', adcode: 120000 },
  { name: '河北', adcode: 130000 }, { name: '山西', adcode: 140000 },
  { name: '内蒙古', adcode: 150000 }, { name: '辽宁', adcode: 210000 },
  { name: '吉林', adcode: 220000 }, { name: '黑龙江', adcode: 230000 },
  { name: '上海', adcode: 310000 }, { name: '江苏', adcode: 320000 },
  { name: '浙江', adcode: 330000 }, { name: '安徽', adcode: 340000 },
  { name: '福建', adcode: 350000 }, { name: '江西', adcode: 360000 },
  { name: '山东', adcode: 370000 }, { name: '河南', adcode: 410000 },
  { name: '湖北', adcode: 420000 }, { name: '湖南', adcode: 430000 },
  { name: '广东', adcode: 440000 }, { name: '广西', adcode: 450000 },
  { name: '海南', adcode: 460000 }, { name: '重庆', adcode: 500000 },
  { name: '四川', adcode: 510000 }, { name: '贵州', adcode: 520000 },
  { name: '云南', adcode: 530000 }, { name: '西藏', adcode: 540000 },
  { name: '陕西', adcode: 610000 }, { name: '甘肃', adcode: 620000 },
  { name: '青海', adcode: 630000 }, { name: '宁夏', adcode: 640000 },
  { name: '新疆', adcode: 650000 }, { name: '台湾', adcode: 710000 },
  { name: '香港', adcode: 810000 }, { name: '澳门', adcode: 820000 },
]

const args = process.argv.slice(2)
const getArg = (k) => {
  const hit = args.find((a) => a.startsWith('--' + k + '='))
  return hit ? hit.slice(k.length + 3) : ''
}
const TK = getArg('tk') || process.env.TIANDITU_TK || ''
const OUT = getArg('out') || 'public/china-provinces.json'

if (!TK) {
  console.error('缺少天地图 Key。用法：node scripts/fetch-china-geojson.cjs --tk=你的Key')
  console.error('申请地址：https://console.tianditu.gov.cn/api/key （免费）')
  process.exit(1)
}

/* ---------- WKT → GeoJSON coordinates ---------- */
function ringFromString(str) {
  const out = []
  for (const pair of str.split(',')) {
    const nums = pair.trim().split(/\s+/)
    if (nums.length < 2) continue
    const x = Number(nums[0])
    const y = Number(nums[1])
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    const px = Math.round(x * 1e4) / 1e4
    const py = Math.round(y * 1e4) / 1e4
    if (out.length) {
      const prev = out[out.length - 1]
      if (prev[0] === px && prev[1] === py) continue
    }
    out.push([px, py])
  }
  return out
}

/** 解析 WKT（POLYGON / MULTIPOLYGON）→ MultiPolygon coordinates */
function wktToCoords(wkt) {
  if (!wkt) return []
  let s = String(wkt).trim()
  if (/EMPTY/i.test(s)) return []
  if (/^POLYGON\b/i.test(s)) {
    s = 'MULTIPOLYGON(' + s.slice(s.indexOf('(')) + ')'
  }
  if (!/^MULTIPOLYGON\b/i.test(s)) return []
  s = s.slice(s.indexOf('('))
  const polys = []
  let depth = 0
  let ringStart = -1
  let polyIdx = -1
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') {
      depth++
      if (depth === 2) { polyIdx++; polys.push([]) }
      if (depth === 3) ringStart = i + 1
    } else if (ch === ')') {
      if (depth === 3 && ringStart >= 0) {
        const ring = ringFromString(s.slice(ringStart, i))
        if (ring.length >= 4) {
          const first = ring[0]
          const last = ring[ring.length - 1]
          if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]])
          polys[polyIdx].push(ring)
        }
        ringStart = -1
      }
      depth--
    }
  }
  return polys.filter((p) => p.length > 0)
}

/* ---------- 大环抽稀（Douglas-Peucker），小环（岛屿）保留 ---------- */
function perpDist(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
  const cx = a[0] + t * dx
  const cy = a[1] + t * dy
  return Math.hypot(p[0] - cx, p[1] - cy)
}
function simplify(points, tol) {
  if (points.length < 3) return points
  let maxD = 0
  let idx = 0
  const first = 0
  const last = points.length - 1
  for (let i = 1; i < last; i++) {
    const d = perpDist(points[i], points[first], points[last])
    if (d > maxD) { maxD = d; idx = i }
  }
  if (maxD > tol) {
    const left = simplify(points.slice(0, idx + 1), tol)
    const right = simplify(points.slice(idx), tol)
    return left.slice(0, -1).concat(right)
  }
  return [points[first], points[last]]
}
function simplifyRings(polys, tol, minPointsToSimplify = 220) {
  return polys.map((rings) =>
    rings.map((ring) => (ring.length >= minPointsToSimplify ? simplify(ring, tol) : ring)),
  )
}

/* ---------- 拉取 ---------- */
async function fetchProvince(p) {
  const kw = '156' + p.adcode
  const urls = [
    'https://api.tianditu.gov.cn/v2/administrative?keyword=' + kw + '&childLevel=0&extensions=true&tk=' + TK,
    'http://api.tianditu.gov.cn/v2/administrative?keyword=' + kw + '&childLevel=0&extensions=true&tk=' + TK,
  ]
  let lastErr = null
  for (const u of urls) {
    try {
      const r = await fetch(u)
      const j = await r.json()
      const d = j && j.data && j.data.district && j.data.district[0]
      if (!d) throw new Error((j && j.message) || 'no district data')
      const coords = wktToCoords(d.boundary)
      if (!coords.length) throw new Error('empty boundary')
      return { name: p.name, adcode: p.adcode, coords }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('unknown')
}

;(async () => {
  console.log('天地图省界数据生成中（共 ' + PROVINCES.length + ' 个省级行政区）…')
  const features = []
  const failed = []

  for (const p of PROVINCES) {
    try {
      const r = await fetchProvince(p)
      const simplified = simplifyRings(r.coords, 0.004)
      features.push({
        type: 'Feature',
        properties: { name: r.name, adcode: r.adcode },
        geometry: { type: 'MultiPolygon', coordinates: simplified },
      })
      process.stdout.write('  ✓ ' + r.name + '\n')
    } catch (e) {
      failed.push(p.name + ' (' + (e && e.message) + ')')
      process.stdout.write('  ✗ ' + p.name + ' 失败：' + (e && e.message) + '\n')
    }
    await new Promise((res) => setTimeout(res, 120))
  }

  if (!features.length) {
    console.error('\n全部失败，未生成文件。请检查 tk 是否有效。')
    process.exit(1)
  }

  const fc = { type: 'FeatureCollection', features }
  const outPath = path.resolve(process.cwd(), OUT)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(fc), 'utf8')

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2)
  console.log('\n已写入：' + outPath + '（' + features.length + ' 个要素，' + sizeMB + ' MB）')
  if (failed.length) console.log('失败 ' + failed.length + ' 个：' + failed.join('；'))
})().catch((e) => {
  console.error('生成失败：', e)
  process.exit(1)
})
