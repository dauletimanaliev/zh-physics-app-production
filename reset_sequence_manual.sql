-- Полный сброс последовательности materials_id_seq к 1
DELETE FROM materials;
ALTER SEQUENCE materials_id_seq RESTART WITH 1;
SELECT setval('materials_id_seq', 1, false);

-- Проверка текущего значения последовательности
SELECT last_value FROM materials_id_seq;
