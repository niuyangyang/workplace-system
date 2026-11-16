/* 统一处理部署子路径前缀。
   根路径部署（Cloudflare Pages / CloudStudio）时 BASE_URL='/'，BASE=''，行为不变；
   GitHub Pages 等子路径部署时 BASE='/workplace-system'，静态资源与 window.open 需要加前缀。
   react-router 的 <Link>/<navigate> 已由 BrowserRouter basename 处理，无需使用本函数。 */
const RAW_BASE = import.meta.env.BASE_URL || '/'
export const BASE = RAW_BASE === '/' ? '' : RAW_BASE.replace(/\/$/, '')
export const withBase = (p: string) => BASE + p
