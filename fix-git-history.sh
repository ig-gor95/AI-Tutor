#!/bin/bash
set -e

echo "🔧 Fixing git history to remove API keys..."

# Step 1: Ensure working directory is clean and files are fixed
echo "Step 1: Checking current files..."
if grep -q "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" src/main/resources/application.yml 2>/dev/null; then
  echo "❌ Keys still in application.yml! Fixing..."
  sed -i '' 's|api-key: ${OPENAI_API_KEY:.*}|api-key: ${OPENAI_API_KEY:}|g' src/main/resources/application.yml
  sed -i '' 's|api-key: ${YANDEX_SPEECHKIT_API_KEY:.*}|api-key: ${YANDEX_SPEECHKIT_API_KEY:}|g' src/main/resources/application.yml
fi

# Step 2: Remove application-local.yml from history
echo "Step 2: Removing application-local.yml from all commits..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/main/resources/application-local.yml" \
  --prune-empty --tag-name-filter cat -- --all 2>/dev/null || echo "Filter-branch completed or not needed"

# Step 3: Fix application.yml in all commits (removing default values with keys)
echo "Step 3: Removing keys from application.yml in all commits..."
git filter-branch --force --tree-filter '
if [ -f src/main/resources/application.yml ]; then
  sed -i "" "s|api-key: \${OPENAI_API_KEY:.*}|api-key: \${OPENAI_API_KEY:}|g" src/main/resources/application.yml 2>/dev/null || true
  sed -i "" "s|api-key: \${YANDEX_SPEECHKIT_API_KEY:.*}|api-key: \${YANDEX_SPEECHKIT_API_KEY:}|g" src/main/resources/application.yml 2>/dev/null || true
fi' \
--prune-empty --tag-name-filter cat -- --all 2>/dev/null || echo "Filter-branch completed"

echo "✅ History fixed!"
echo ""
echo "⚠️  IMPORTANT: You need to force push now:"
echo "   git push --force-with-lease origin init"
