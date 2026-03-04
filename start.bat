@echo off
echo 启动前端 (端口 5173)...
start "Frontend" cmd /c "cd frontend && npm run dev"

echo 启动后端 (端口 8000)...
start "Backend" cmd /c "cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo 前后端启动命令已执行，请查看对应窗口。