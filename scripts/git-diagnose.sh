#!/usr/bin/env bash
set -e

echo "=== git-diagnose: running from $(pwd) ==="
echo
echo "1) git status:"
git status
echo
echo "2) current branch:"
git rev-parse --abbrev-ref HEAD
echo
echo "3) branch verbose:"
git branch -vv
echo
echo "4) remotes:"
git remote -v
echo
echo "5) last 5 commits:"
git log --oneline -n 5
echo
echo "6) unpushed commits (git cherry -v):"
git cherry -v || true
echo
echo "7) show commits not on origin (if origin exists):"
BR=$(git rev-parse --abbrev-ref HEAD)
if git show-ref --verify --quiet refs/remotes/origin/$BR; then
  git log --oneline origin/$BR..HEAD || true
else
  echo "No origin/$BR found (no upstream configured)"
fi
echo
echo "8) remote URL:"
git config --get remote.origin.url || echo "no origin.url"
echo
echo "9) dry-run push (will not send data):"
git push --dry-run origin HEAD || true
echo
echo "Done. If push still fails in VS Code, check the Git output panel and authentication method (PAT for HTTPS or SSH key)."
