@echo off
rem 独立启动开发服务（脱离调用方进程，避免随会话被回收）
rem 用法：直接双击本文件，或在终端执行 scripts\dev-server.cmd
cd /d "%~dp0.."
echo [dev-server] 工作目录: %CD%
echo [dev-server] 启动 Vite（http://localhost:5173）...
npx vite --port 5173 --host > .dev.log 2>&1
