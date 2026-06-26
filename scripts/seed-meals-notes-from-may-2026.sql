BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'mateocelis1550@gmail.com'
  ) THEN
    RAISE EXCEPTION 'No existe el usuario mateocelis1550@gmail.com';
  END IF;
END
$$;

WITH params AS (
  SELECT
    DATE '2026-05-01' AS start_date,
    DATE '2026-06-25' AS end_date
),
target_user AS (
  SELECT id AS "userId"
  FROM users
  WHERE email = 'mateocelis1550@gmail.com'
),
deleted_meals AS (
  DELETE FROM meals
  USING params, target_user
  WHERE meals."userId" = target_user."userId"
    AND meals.date BETWEEN params.start_date AND params.end_date
  RETURNING meals.id
),
days AS (
  SELECT day::date AS date
  FROM params,
    generate_series(params.start_date, params.end_date, INTERVAL '1 day') AS day
),
meal_plan AS (
  SELECT
    days.date,
    meal.type,
    meal.time,
    meal.name,
    meal.calories,
    meal.proteins,
    meal.carbs,
    meal.fats
  FROM days
  CROSS JOIN LATERAL (
    VALUES
      (
        'breakfast'::meals_type_enum,
        TIME '07:35',
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 'Huevos con Arepa y Fruta'
          WHEN 1 THEN 'Avena con Banano y Yogur Griego'
          WHEN 2 THEN 'Tostadas Integrales con Huevo'
          ELSE 'Batido de Proteina con Fruta'
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 520
          WHEN 1 THEN 470
          WHEN 2 THEN 490
          ELSE 430
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 28
          WHEN 1 THEN 31
          WHEN 2 THEN 26
          ELSE 35
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 58
          WHEN 1 THEN 62
          WHEN 2 THEN 54
          ELSE 48
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 18
          WHEN 1 THEN 11
          WHEN 2 THEN 16
          ELSE 8
        END
      ),
      (
        'lunch'::meals_type_enum,
        TIME '12:45',
        CASE EXTRACT(DAY FROM days.date)::int % 5
          WHEN 0 THEN 'Sancocho con Arroz y Aguacate'
          WHEN 1 THEN 'Pollo a la Plancha con Arroz y Ensalada'
          WHEN 2 THEN 'Carne Magra con Papa y Verduras'
          WHEN 3 THEN 'Bowl de Lentejas con Arroz y Ensalada'
          ELSE 'Arroz con Pollo y Verduras'
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 5
          WHEN 0 THEN 950
          WHEN 1 THEN 720
          WHEN 2 THEN 780
          WHEN 3 THEN 690
          ELSE 660
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 5
          WHEN 0 THEN 52
          WHEN 1 THEN 48
          WHEN 2 THEN 45
          WHEN 3 THEN 34
          ELSE 43
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 5
          WHEN 0 THEN 120
          WHEN 1 THEN 78
          WHEN 2 THEN 82
          WHEN 3 THEN 92
          ELSE 64
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 5
          WHEN 0 THEN 36
          WHEN 1 THEN 20
          WHEN 2 THEN 24
          WHEN 3 THEN 16
          ELSE 26
        END
      ),
      (
        'dinner'::meals_type_enum,
        TIME '19:30',
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 'Ensalada con Atun y Aguacate'
          WHEN 1 THEN 'Tortilla de Huevos con Verduras'
          WHEN 2 THEN 'Sopa de Verduras con Pollo'
          ELSE 'Pechuga con Verduras Salteadas'
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 520
          WHEN 1 THEN 460
          WHEN 2 THEN 430
          ELSE 560
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 36
          WHEN 1 THEN 30
          WHEN 2 THEN 34
          ELSE 44
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 32
          WHEN 1 THEN 28
          WHEN 2 THEN 34
          ELSE 36
        END,
        CASE EXTRACT(DAY FROM days.date)::int % 4
          WHEN 0 THEN 26
          WHEN 1 THEN 22
          WHEN 2 THEN 12
          ELSE 18
        END
      )
  ) AS meal(type, time, name, calories, proteins, carbs, fats)
  UNION ALL
  SELECT
    days.date,
    'snack'::meals_type_enum,
    TIME '16:30',
    CASE EXTRACT(DAY FROM days.date)::int % 3
      WHEN 0 THEN 'Yogur Griego con Fruta'
      WHEN 1 THEN 'Frutos Secos Medidos con Manzana'
      ELSE 'Atun con Galletas Integrales'
    END,
    CASE EXTRACT(DAY FROM days.date)::int % 3
      WHEN 0 THEN 260
      WHEN 1 THEN 310
      ELSE 280
    END,
    CASE EXTRACT(DAY FROM days.date)::int % 3
      WHEN 0 THEN 22
      WHEN 1 THEN 8
      ELSE 24
    END,
    CASE EXTRACT(DAY FROM days.date)::int % 3
      WHEN 0 THEN 30
      WHEN 1 THEN 24
      ELSE 28
    END,
    CASE EXTRACT(DAY FROM days.date)::int % 3
      WHEN 0 THEN 4
      WHEN 1 THEN 22
      ELSE 8
    END
  FROM days
  WHERE EXTRACT(DOW FROM days.date)::int IN (1, 3, 5, 6)
)
INSERT INTO meals (
  name,
  calories,
  time,
  date,
  type,
  "userId",
  proteins,
  carbs,
  fats
)
SELECT
  meal_plan.name,
  meal_plan.calories,
  meal_plan.time,
  meal_plan.date,
  meal_plan.type,
  target_user."userId",
  meal_plan.proteins,
  meal_plan.carbs,
  meal_plan.fats
FROM meal_plan
CROSS JOIN target_user
ORDER BY meal_plan.date, meal_plan.time;

WITH params AS (
  SELECT
    DATE '2026-05-01' AS start_date,
    DATE '2026-06-25' AS end_date
),
target_user AS (
  SELECT id AS "userId"
  FROM users
  WHERE email = 'mateocelis1550@gmail.com'
),
days AS (
  SELECT day::date AS date
  FROM params,
    generate_series(params.start_date, params.end_date, INTERVAL '1 day') AS day
),
note_plan AS (
  SELECT
    days.date,
    CASE EXTRACT(DAY FROM days.date)::int % 7
      WHEN 0 THEN 'Dia con buena saciedad. La comida principal tuvo buena proteina, pero podria agregar mas verduras en la cena.'
      WHEN 1 THEN 'Me senti con energia estable. El almuerzo fue balanceado y el snack ayudo a no llegar con tanta hambre a la cena.'
      WHEN 2 THEN 'El arroz estuvo presente en varias comidas. Para mejorar variedad podria cambiar una por papa, legumbres o mas ensalada.'
      WHEN 3 THEN 'Dia alto en carbohidratos. Me conviene reforzar proteina en desayuno o snack para sentir mas saciedad.'
      WHEN 4 THEN 'Buena distribucion durante el dia. Mantener porciones moderadas de grasas como aguacate y frutos secos.'
      WHEN 5 THEN 'Comida principal abundante. Para la noche funciono mejor una cena ligera con proteina y verduras.'
      ELSE 'Dia repetitivo pero ordenado. Probar otra proteina o una ensalada diferente ayudaria a mejorar variedad.'
    END AS note
  FROM days
)
INSERT INTO daily_food_notes (
  "userId",
  date,
  note,
  "createdAt",
  "updatedAt"
)
SELECT
  target_user."userId",
  note_plan.date,
  note_plan.note,
  now(),
  now()
FROM note_plan
CROSS JOIN target_user
ON CONFLICT ("userId", date) DO UPDATE SET
  note = EXCLUDED.note,
  "updatedAt" = now();

COMMIT;
