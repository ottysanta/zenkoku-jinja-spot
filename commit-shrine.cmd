@echo off
cd /d "%~dp0"

echo == force release git lock ==
if exist .git\index.lock del /f /q .git\index.lock
if exist .git\index.lock (
  echo ERROR: .git\index.lock is still held by another process.
  echo Please close VSCode / GitHub Desktop / Sourcetree / any git tool then retry.
  pause
  exit /b 1
)

echo == staging ==
git add .gitignore
git add apps
git add packages
git add backend
git add ops
git add package.json
git add package-lock.json
git add docker-compose.yml
git add Procfile
git add README.md
git add render.yaml
git add .env.example
git add .mcp.json
git add -u .
if errorlevel 1 (
  echo ERROR: git add failed.
  pause
  exit /b 1
)

echo == staged diffstat ==
git diff --cached --stat

echo == commit ==
git commit -F commit-message.txt
if errorlevel 1 (
  echo ERROR: git commit failed.
  pause
  exit /b 1
)

echo == push ==
git push origin master
if errorlevel 1 (
  echo ERROR: git push failed (check credentials / network).
  pause
  exit /b 1
)

echo == recent log ==
git log --oneline -n 5

echo.
echo DONE
pause
