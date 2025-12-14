#!/bin/bash

# Скрипт для запуска Python-сервиса анализа формант

# Проверяем наличие виртуального окружения
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Активируем виртуальное окружение
source venv/bin/activate

# Устанавливаем зависимости
echo "Installing dependencies..."
pip install -r requirements.txt

# Запускаем сервис
echo "Starting phonetics analysis service on port 8041..."
python app.py

