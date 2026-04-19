@echo off
cd /d "%~dp0"

if exist .git\index.lock del /f /q .git\index.lock

echo == staging deploy files ==
git add apps/web/package.json
git add apps/web/scripts/fetch-db.mjs
git add apps/web/vercel.json
git add commit-shrine.cmd
git add commit-deploy.cmd
git add commit-shrine-refresh.ps1
git add setup-new-repo.cmd
git add commit-message.txt

git diff --cached --stat

echo == commit ==
git commit -m "Add Vercel deploy config: fetch-db prebuild + vercel.json"
if errorlevel 1 (
  echo commit failed
  pause
  exit /b 1
)

echo == push ==
git push origin master
if errorlevel 1 (
  echo push failed
  pause
  exit /b 1
)

git log --oneline -n 5
echo.
echo DONE
pause
