-- Заполняем NULL event_key для существующих записей 
UPDATE event SET event_key = gen_random_uuid()::text WHERE event_key IS NULL;

-- Делаем колонку NOT NULL
ALTER TABLE event ALTER COLUMN event_key SET NOT NULL;
