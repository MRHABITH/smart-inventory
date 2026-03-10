$base = "c:\Users\Gen-AI Tech\OneDrive\Desktop\nasreen gang\smart\ai-inventory-os"
Set-Location $base

# Remove .env files from git tracking (so they never get committed)
git rm --cached backend/.env 2>$null
git rm --cached backend/.env.example 2>$null

git add .
git commit -m "fix: make CELERY and ALLOWED_ORIGINS optional with defaults"
git push origin main --force
