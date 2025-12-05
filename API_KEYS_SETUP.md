# 🔐 Настройка API ключей

## ⚠️ Важно

**API ключи НЕ должны попадать в git!** Они настроены через переменные окружения или локальные конфигурационные файлы.

## 🔑 Настройка ключей

### Вариант 1: Переменные окружения (Рекомендуется)

Установите переменные окружения перед запуском:

```bash
export OPENAI_API_KEY="your-openai-api-key"
export YANDEX_SPEECHKIT_API_KEY="your-yandex-api-key"
export YANDEX_FOLDER_ID="your-folder-id"  # опционально
```

### Вариант 2: Локальный конфигурационный файл

Создайте файл `src/main/resources/application-local.yml` (этот файл в .gitignore):

```yaml
openai:
  api-key: your-openai-api-key

yandex:
  speechkit:
    api-key: your-yandex-api-key
    folder-id: your-folder-id  # опционально
```

### Вариант 3: .env файл

Создайте файл `.env` в корне проекта (этот файл в .gitignore):

```bash
OPENAI_API_KEY=your-openai-api-key
YANDEX_SPEECHKIT_API_KEY=your-yandex-api-key
YANDEX_FOLDER_ID=your-folder-id
```

## 📝 Примечания

- Файл `application-local.yml` автоматически игнорируется git (в .gitignore)
- Файл `.env` автоматически игнорируется git (в .gitignore)
- Основной файл `application.yml` использует только переменные окружения
- Никогда не коммитьте файлы с реальными API ключами!

## 🚀 Запуск с ключами

После настройки ключей запустите backend:

```bash
mvn spring-boot:run
```

Backend автоматически подхватит ключи из переменных окружения или локальных конфигурационных файлов.

