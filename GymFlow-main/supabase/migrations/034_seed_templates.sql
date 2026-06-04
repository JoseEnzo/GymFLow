-- ============================================================
-- GymFlow — Seed: 45 fichas-modelo (15 grupos × 3 níveis)
-- ============================================================

-- helper: insere template e retorna id
-- cada bloco: WITH tmpl AS (INSERT ... RETURNING id), exs AS (valores ordenados)
-- INSERT INTO template_exercises SELECT tmpl.id, e.id, ord, sets, reps, rest FROM tmpl CROSS JOIN exs JOIN exercises e ON ...

-- ──────────────────────────────────────────────
-- PEITO
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Peito — Iniciante', 'Peito', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Supino Hammer Strength',        0, 3, '12',   60),
  ('Supino na Máquina',             1, 3, '12',   60),
  ('Crucifixo com Halteres',        2, 3, '12',   60),
  ('Flexão de Braço',               3, 3, '15',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Peito — Intermediário', 'Peito', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Supino Reto com Barra',         0, 4, '8',    90),
  ('Supino Inclinado com Halteres', 1, 3, '10',   90),
  ('Crucifixo no Cabo',             2, 3, '12',   60),
  ('Peck Deck Inclinado',           3, 3, '12',   60),
  ('Flexão com Peso',               4, 3, '10',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Peito — Avançado', 'Peito', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Supino Reto com Barra',         0, 5, '5',    120),
  ('Crucifixo nos Anéis',           1, 4, '8',    90),
  ('Supino Guilhotina',             2, 4, '6',    120),
  ('Flexão Arqueiro',               3, 3, '6',    90),
  ('Flexão Pliométrica',            4, 3, '8',    90)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- COSTAS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Costas — Iniciante', 'Costas', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Remada Sentada no Cabo',        0, 3, '12',   60),
  ('Puxada no Pulley',              1, 3, '12',   60),
  ('Remada com Haltere Pegada Neutra', 2, 3, '12', 60),
  ('Remada Apoiada na Máquina',     3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Costas — Intermediário', 'Costas', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Remada Curvada com Barra',      0, 4, '8',    90),
  ('Barra Fixa',                    1, 4, '6',    90),
  ('Puxada Unilateral no Pulley',   2, 3, '10',   60),
  ('Remada Pronada com Barra',      3, 3, '10',   90),
  ('Puxada com Corda no Pulley',    4, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Costas — Avançado', 'Costas', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Levantamento Terra',            0, 4, '5',    180),
  ('Barra Fixa com Peso',           1, 5, '5',    120),
  ('Barra Fixa para a Nuca',        2, 4, '6',    90),
  ('Remada Curvada com Barra',      3, 4, '6',    90),
  ('Barra Fixa Pliométrica',        4, 3, '5',    120)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- OMBROS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Ombros — Iniciante', 'Ombros', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Elevação Lateral com Halteres', 0, 3, '12',   60),
  ('Face Pull',                     1, 3, '15',   60),
  ('Elevação Frontal com Anilha',   2, 3, '12',   60),
  ('Remada Alta com Haltere',       3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Ombros — Intermediário', 'Ombros', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Desenvolvimento com Barra',     0, 4, '8',    90),
  ('Desenvolvimento Arnold Sentado',1, 3, '10',   90),
  ('Elevação Lateral com Halteres', 2, 3, '15',   60),
  ('Face Pull',                     3, 3, '15',   60),
  ('Bradford Press',                4, 3, '10',   90)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Ombros — Avançado', 'Ombros', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Desenvolvimento para a Nuca',   0, 4, '6',    120),
  ('Desenvolvimento Arnold em Pé',  1, 4, '8',    90),
  ('Bradford Press',                2, 4, '8',    90),
  ('Push Jerk',                     3, 5, '3',    120),
  ('Elevação Lateral com Halteres', 4, 4, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- BÍCEPS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Bíceps — Iniciante', 'Bíceps', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Rosca Direta com Barra',        0, 3, '12',   60),
  ('Rosca Martelo',                 1, 3, '12',   60),
  ('Rosca Inclinada com Halteres',  2, 3, '12',   60),
  ('Rosca no Cabo',                 3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Bíceps — Intermediário', 'Bíceps', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Rosca Bayesiana (Cabo Atrás)',  0, 4, '10',   60),
  ('Rosca Scott com Haltere',       1, 3, '12',   60),
  ('Rosca Isométrica na Barra',     2, 3, '8',    90),
  ('Rosca no Cabo pelas Costas',    3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Bíceps — Avançado', 'Bíceps', 'Avançado', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('21s com Elástico',              0, 4, '21',   90),
  ('Rosca Bayesiana (Cabo Atrás)',  1, 4, '8',    90),
  ('Rosca Isométrica na Barra',     2, 4, '6',    90),
  ('Rosca Scott na Máquina',        3, 4, '8',    60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- TRÍCEPS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Tríceps — Iniciante', 'Tríceps', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Tríceps no Pulley com Barra V', 0, 3, '12',   60),
  ('Tríceps Francês',               1, 3, '12',   60),
  ('Extensão de Tríceps na Máquina',2, 3, '15',   60),
  ('Tríceps no Pulley',             3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Tríceps — Intermediário', 'Tríceps', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Tríceps Testa com Barra EZ',    0, 4, '10',   90),
  ('Paralela na Barra',             1, 3, '8',    90),
  ('Extensão Rolante com Haltere',  2, 3, '10',   60),
  ('Tríceps Testa com Haltere',     3, 3, '10',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Tríceps — Avançado', 'Tríceps', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Paralela com Peso',             0, 5, '6',    120),
  ('Paralela nos Anéis',            1, 4, '6',    120),
  ('Mergulho Coreano',              2, 4, '6',    90),
  ('Tríceps Testa com Haltere',     3, 4, '8',    90)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- ANTEBRAÇOS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Antebraços — Iniciante', 'Antebraços', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Rolo de Punho',                 0, 3, '12',   60),
  ('Flexão dos Dedos',              1, 3, '15',   60),
  ('Desvio Radial',                 2, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Antebraços — Intermediário', 'Antebraços', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Carregar Anilha com Pinça',     0, 3, '30s',  60),
  ('Rolo de Punho',                 1, 3, '12',   60),
  ('Desvio Ulnar',                  2, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Antebraços — Avançado', 'Antebraços', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Rosca Inversa com Barra EZ',    0, 4, '12',   60),
  ('Carregar Anilha com Pinça',     1, 4, '30s',  60),
  ('Pronação com Peso',             2, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- ABDÔMEN
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Abdômen — Iniciante', 'Abdômen', 'Iniciante', 'Condicionamento') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Abdominal Crunch',              0, 3, '15',   60),
  ('Prancha Isométrica',            1, 3, '30s',  60),
  ('Elevação de Joelhos na Barra',  2, 3, '12',   60),
  ('Abdominal Russo',               3, 3, '20',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Abdômen — Intermediário', 'Abdômen', 'Intermediário', 'Condicionamento') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Abdominal no Banco Declinado',  0, 3, '15',   60),
  ('Abdominal no Cabo Ajoelhado',   1, 3, '12',   60),
  ('Prancha no TRX',                2, 3, '30s',  60),
  ('Pallof Press com Elástico',     3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Abdômen — Avançado', 'Abdômen', 'Avançado', 'Condicionamento') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Prancha com Rotação (Stir the Pot)', 0, 3, '10', 60),
  ('Abdominal com Carrinho',        1, 4, '8',    60),
  ('Fallout no TRX',                2, 3, '8',    60),
  ('Prancha Estendida',             3, 3, '45s',  60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- OBLÍQUOS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Oblíquos — Iniciante', 'Oblíquos', 'Iniciante', 'Condicionamento') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Abdominal Russo',               0, 3, '20',   60),
  ('Elevação de Joelhos Oblíqua',   1, 3, '12',   60),
  ('Pallof Press com Elástico',     2, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Oblíquos — Intermediário', 'Oblíquos', 'Intermediário', 'Condicionamento') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Abdominal Russo com Medicine Ball', 0, 3, '15', 60),
  ('Pallof Press com Rotação',      1, 3, '10',   60),
  ('Elevação de Joelhos Oblíqua',   2, 3, '15',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Oblíquos — Avançado', 'Oblíquos', 'Avançado', 'Condicionamento') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Prancha Estrela',               0, 4, '10',   60),
  ('Pallof Press com Rotação',      1, 4, '10',   60),
  ('Abdominal Russo com Medicine Ball', 2, 4, '15', 60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- GLÚTEOS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Glúteos — Iniciante', 'Glúteos', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Elevação Pélvica na Máquina',          0, 3, '12',   60),
  ('Extensão de Quadril em Quatro Apoios', 1, 3, '15',   60),
  ('Coice de Burro com Peso',              2, 3, '15',   60),
  ('Ponte de Glúteos com Elástico',        3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Glúteos — Intermediário', 'Glúteos', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Elevação Pélvica com Barra',           0, 4, '10',   90),
  ('Hiperextensão Reversa na Máquina',     1, 3, '12',   60),
  ('Swing Duplo com Kettlebell',           2, 4, '10',   60),
  ('Terra com Elástico',                   3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Glúteos — Avançado', 'Glúteos', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Elevação Pélvica com Barra',           0, 5, '5',    120),
  ('Swing Duplo com Kettlebell',           1, 4, '8',    90),
  ('Hiperextensão Reversa na Máquina',     2, 4, '10',   60),
  ('Pull-Through + Agachamento no Cabo',   3, 3, '10',   90)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- QUADRÍCEPS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Quadríceps — Iniciante', 'Quadríceps', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Leg Press 45°',                 0, 3, '12',   90),
  ('Extensão de Joelho na Máquina', 1, 3, '15',   60),
  ('Agachamento com Elástico',      2, 3, '12',   60),
  ('Avanço Caminhando',             3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Quadríceps — Intermediário', 'Quadríceps', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Agachamento com Barra',         0, 4, '8',    90),
  ('Leg Press 45°',                 1, 3, '12',   90),
  ('Agachamento Búlgaro',           2, 3, '10',   90),
  ('Avanço com Barra',              3, 3, '10',   60),
  ('Hack Squat Pés Fechados',       4, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Quadríceps — Avançado', 'Quadríceps', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Agachamento com Barra',         0, 5, '5',    180),
  ('Agachamento Búlgaro',           1, 4, '8',    90),
  ('Agachamento com Pausa',         2, 4, '5',    120),
  ('Salto na Caixa',                3, 4, '6',    90)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- ISQUIOTIBIAIS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Isquiotibiais — Iniciante', 'Isquiotibiais', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Flexão de Joelho (mesa flexora)',0, 3, '12',   60),
  ('Mesa Flexora na Máquina',       1, 3, '12',   60),
  ('Stiff no Smith',                2, 3, '12',   60),
  ('Bom Dia com Elástico',          3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Isquiotibiais — Intermediário', 'Isquiotibiais', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Stiff / Terra Romeno',          0, 4, '10',   90),
  ('Flexão de Joelho no TRX',       1, 3, '10',   60),
  ('Stiff Unilateral com Haltere',  2, 3, '10',   60),
  ('Levantamento Terra com Pernas Retas', 3, 3, '10', 90)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Isquiotibiais — Avançado', 'Isquiotibiais', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Glute-Ham Raise (GHR)',         0, 4, '6',    120),
  ('Stiff em Déficit',              1, 4, '6',    90),
  ('Flexão de Joelho no GHD',       2, 3, '8',    90),
  ('Stiff Unilateral com Haltere',  3, 3, '8',    90)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- PANTURRILHAS
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Panturrilhas — Iniciante', 'Panturrilhas', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Panturrilha em Pé',             0, 4, '15',   60),
  ('Panturrilha Sentado na Máquina',1, 3, '15',   60),
  ('Panturrilha no Smith',          2, 3, '15',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Panturrilhas — Intermediário', 'Panturrilhas', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Panturrilha Excêntrica',        0, 4, '12',   60),
  ('Panturrilha Explosiva',         1, 3, '15',   60),
  ('Salto Reativo de Panturrilha',  2, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Panturrilhas — Avançado', 'Panturrilhas', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Panturrilha Excêntrica',        0, 5, '8',    90),
  ('Salto Reativo de Panturrilha',  1, 4, '12',   60),
  ('Panturrilha com Salto',         2, 4, '15',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- TRAPÉZIO
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Trapézio — Iniciante', 'Trapézio', 'Iniciante', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Remada Alta com Haltere',       0, 3, '12',   60),
  ('Face Pull',                     1, 3, '15',   60),
  ('Crucifixo Invertido com Haltere',2,3, '12',   60),
  ('Elevação em W no Cabo',         3, 3, '15',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Trapézio — Intermediário', 'Trapézio', 'Intermediário', 'Hipertrofia') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Bradford Press',                0, 4, '10',   90),
  ('Remada Alta no Cabo',           1, 3, '12',   60),
  ('Face Pull na Máquina',          2, 3, '15',   60),
  ('Voador Posterior na Máquina',   3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Trapézio — Avançado', 'Trapézio', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Desenvolvimento para a Nuca',   0, 4, '6',    120),
  ('Puxada Alta',                   1, 4, '6',    90),
  ('Stiff com Encolhimento',        2, 3, '10',   90),
  ('Bradford Press',                3, 4, '8',    90)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- LOMBAR
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Lombar — Iniciante', 'Lombar', 'Iniciante', 'Reabilitação') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Prancha Isométrica',            0, 3, '30s',  60),
  ('Bom Dia com Elástico',          1, 3, '12',   60),
  ('Extensão de Quadril a 45°',     2, 3, '15',   60),
  ('Posição da Criança',            3, 3, '30s',  30)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Lombar — Intermediário', 'Lombar', 'Intermediário', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Stiff / Terra Romeno',          0, 4, '10',   90),
  ('Extensão de Quadril a 45°',     1, 3, '15',   60),
  ('Hiperextensão Reversa na Máquina', 2, 3, '12', 60),
  ('Prancha Estendida',             3, 3, '30s',  60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Lombar — Avançado', 'Lombar', 'Avançado', 'Força') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Levantamento Terra',            0, 4, '5',    180),
  ('Stiff em Déficit',              1, 4, '6',    90),
  ('Prancha Deslizante (Body Saw)', 2, 4, '8',    60),
  ('Abdominal com Carrinho',        3, 3, '8',    60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

-- ──────────────────────────────────────────────
-- CARDIO
-- ──────────────────────────────────────────────

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Cardio — Iniciante', 'Cardio', 'Iniciante', 'Condicionamento') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Escada de Agilidade',           0, 3, '30s',  60),
  ('Polichinelo com Palmas à Frente',1,3, '30s',  60),
  ('Carioca (Passada Cruzada Lateral)',2,3,'30s', 60),
  ('Drills com Cones',              3, 3, '30s',  60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Cardio — Intermediário', 'Cardio', 'Intermediário', 'Condicionamento') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Burpee',                        0, 4, '10',   60),
  ('Escalador Cruzado',             1, 3, '30s',  60),
  ('Corda de Batalha',              2, 3, '30s',  60),
  ('Saltos Estrela',                3, 3, '12',   60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;

WITH tmpl AS (
  INSERT INTO workout_sheet_templates (name, muscle_group, level, goal)
  VALUES ('Cardio — Avançado', 'Cardio', 'Avançado', 'Condicionamento') RETURNING id
), exs(n, ord, sets, reps, rest) AS (VALUES
  ('Burpee com Barra Fixa',         0, 4, '6',    90),
  ('Tiro em Subida',                1, 4, '10s',  90),
  ('Flexão com Palmas',             2, 3, '8',    90),
  ('Corda de Batalha',              3, 3, '30s',  60)
)
INSERT INTO template_exercises (template_id, exercise_id, order_index, sets, reps, rest_seconds)
SELECT tmpl.id, (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1), exs.ord, exs.sets, exs.reps, exs.rest
FROM tmpl CROSS JOIN exs WHERE (SELECT id FROM exercises WHERE name_pt = exs.n AND is_global = true LIMIT 1) IS NOT NULL;
