# ⚙️ OpenAI - Краткая сводка настроек

## 📝 Текущие настройки (application.yml)

```yaml
openai:
  # Модель
  model: gpt-4-turbo-preview  # Варианты: gpt-4, gpt-4o, gpt-4o-mini, gpt-3.5-turbo
  
  # Длина ответа
  max-tokens: 2000  # 1 токен ≈ 0.75 слова
  
  # Креативность
  temperature: 0.7  # 0.0-2.0 (0.7 = баланс)
  top-p: 1.0        # 0.0-1.0 (альтернатива temperature)
  
  # Контроль повторений
  frequency-penalty: 0.0  # -2.0 до 2.0
  presence-penalty: 0.0   # -2.0 до 2.0
  
  # Streaming
  streaming: true  # Потоковая передача ответов
  
  # Таймауты
  timeout: 60      # секунды
  max-retries: 3   # попытки при ошибке
```

---

## 🎯 Быстрые настройки

### Короткие ответы (экономия токенов)
```yaml
max-tokens: 1000
temperature: 0.5
```

### Длинные детальные ответы
```yaml
max-tokens: 4000
temperature: 0.5
```

### Креативные диалоги
```yaml
temperature: 0.9
presence-penalty: 0.6
```

### Точные ответы (для обучения)
```yaml
temperature: 0.3
frequency-penalty: 0.5
```

### Быстрая модель (экономия денег)
```yaml
model: gpt-3.5-turbo
max-tokens: 1500
timeout: 30
```

---

## 💡 Рекомендации

1. **Для обучения**: `temperature: 0.3-0.5`, `max-tokens: 2000`
2. **Для чата**: `streaming: true` (всегда)
3. **Для экономии**: `model: gpt-3.5-turbo` или `gpt-4o-mini`
4. **Для качества**: `model: gpt-4-turbo-preview`

---

## 🔄 Изменение настроек

### Через application.yml
Отредактируйте файл и перезапустите backend.

### Через переменные окружения
```bash
export OPENAI_MODEL=gpt-4o-mini
export OPENAI_MAX_TOKENS=1500
export OPENAI_TEMPERATURE=0.5
```

---

**Подробная документация**: см. `OPENAI_CONFIG.md`

