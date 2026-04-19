@echo off
setlocal
cd /d "%~dp0"

echo == check gh CLI ==
where gh >nul 2>nul
if errorlevel 1 (
  echo gh CLI is NOT installed.
  echo Please create the empty repo manually at https://github.com/new
  echo then run:
  echo   git remote remove origin
  echo   git remote add origin https://github.com/ottysanta/zenkoku-jinja-spot.git
  echo   git push -u origin master
  pause
  exit /b 1
)

echo == check gh auth ==
gh auth status
if errorlevel 1 (
  echo Not logged in. Running gh auth login...
  gh auth login
  if errorlevel 1 (
    echo auth failed.
    pause
    exit /b 1
  )
)

echo == remove old remote (matsuisayura-pixel) ==
git remote remove origin 2>nul

echo == create repo and push ==
gh repo create ottysanta/zenkoku-jinja-spot --public --source=. --remote=origin --push
if errorlevel 1 (
  echo repo create or push failed.
  pause
  exit /b 1
)

echo == result ==
git remote -v
git log --oneline -n 5

echo.
echo DONE
pause
