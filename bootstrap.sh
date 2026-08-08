#!/usr/bin/env bash
set -euo pipefail

# --- Interactive Onboarding: первый запуск проекта ---
# 1. Копируем .env, если его ещё нет
# 2. Поднимаем базовые сервисы
# 3. Прогоняем миграции БД
# 4. Наполняем БД сидами

echo "==> Проверка .env"
if [ -f .env ]; then
    echo "    .env уже существует, пропускаю копирование"
else
    cp .env.example .env
    echo "    .env создан из .env.example"
fi

echo "==> Поднимаю сервисы (docker compose up -d)"
make up

echo "==> Жду, пока db_scenarios станет healthy"
until [ "$(docker inspect -f '{{.State.Health.Status}}' db_scenarios 2>/dev/null)" = "healthy" ]; do
    printf '.'
    sleep 2
done
echo " OK"

echo "==> Применяю миграции"
make migrate-up

echo "==> Заполняю БД сидами"
make seed

echo "==> Готово! Проект поднят, миграции применены, данные засеяны."