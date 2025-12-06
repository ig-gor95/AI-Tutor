# 🚀 Быстрое исправление истории Git

## Проблема
GitHub заблокировал push из-за API ключей в истории коммитов.

## ✅ Решение (выберите один вариант)

### Вариант 1: Переписать проблемный коммит (если коммиты только локально)

```bash
# 1. Убедитесь, что файлы исправлены (уже сделано)
git status

# 2. Добавьте исправления в последний коммит
git add src/main/resources/application.yml .gitignore API_KEYS_SETUP.md
git commit --amend --no-edit

# 3. Если есть более старые коммиты с ключами, используйте rebase
git rebase -i HEAD~3
# В редакторе измените "pick" на "edit" для проблемного коммита c96b8d1
# Затем исправьте файлы и выполните: git commit --amend && git rebase --continue

# 4. Force push
git push --force-with-lease origin init
```

### Вариант 2: Использовать filter-branch (для очистки всей истории)

```bash
# Запустите готовый скрипт
./fix-git-history.sh

# Или вручную:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/main/resources/application-local.yml" \
  --prune-empty --tag-name-filter cat -- --all

# Затем force push
git push --force-with-lease origin init
```

### Вариант 3: Создать новую чистую ветку (самый безопасный)

```bash
# 1. Создайте новую ветку от исправленного состояния
git checkout -b main-clean

# 2. Убедитесь, что все файлы без ключей
git add .
git commit -m "Clean initial commit without API keys"

# 3. Push новой ветки
git push origin main-clean

# 4. На GitHub удалите старую ветку init и переименуйте main-clean в main
```

## ⚠️ После исправления

Убедитесь, что ключи удалены:
```bash
git log --all -p | grep -i "sk-proj\|AQVN.*-xFWTLr" | head -5
```

Если команда ничего не выводит - успех! 🎉

