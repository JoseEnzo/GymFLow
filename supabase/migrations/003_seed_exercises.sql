-- ============================================================
-- GymFlow — Seed: 40 exercícios globais
-- ============================================================
insert into exercises (name, name_pt, muscle_groups, equipment, difficulty, is_global) values

-- PEITO
('Barbell Bench Press',      'Supino Reto com Barra',       array['Peito','Tríceps','Ombros'], array['Barra','Banco'],    'intermediate', true),
('Incline Dumbbell Press',   'Supino Inclinado com Halteres',array['Peito','Ombros'],          array['Halteres','Banco'], 'intermediate', true),
('Cable Crossover',          'Crucifixo no Cabo',            array['Peito'],                   array['Cabo'],             'intermediate', true),
('Push-up',                  'Flexão de Braço',              array['Peito','Tríceps','Ombros'],array['Peso Corporal'],    'beginner',     true),
('Dumbbell Fly',             'Crucifixo com Halteres',       array['Peito'],                   array['Halteres','Banco'], 'beginner',     true),

-- COSTAS
('Pull-up',                  'Barra Fixa',                   array['Costas','Bíceps'],         array['Barra Fixa'],       'intermediate', true),
('Barbell Row',              'Remada Curvada com Barra',     array['Costas','Bíceps'],         array['Barra'],            'intermediate', true),
('Lat Pulldown',             'Puxada no Pulley',             array['Costas','Bíceps'],         array['Máquina','Cabo'],   'beginner',     true),
('Seated Cable Row',         'Remada Sentada no Cabo',       array['Costas','Bíceps'],         array['Cabo','Máquina'],   'beginner',     true),
('Deadlift',                 'Levantamento Terra',           array['Costas','Lombar','Glúteos','Isquiotibiais'], array['Barra'], 'advanced', true),
('Single-arm Dumbbell Row',  'Remada Unilateral com Haltere',array['Costas','Bíceps'],         array['Halteres','Banco'], 'beginner',     true),

-- OMBROS
('Overhead Press',           'Desenvolvimento com Barra',    array['Ombros','Tríceps'],        array['Barra'],            'intermediate', true),
('Dumbbell Lateral Raise',   'Elevação Lateral com Halteres',array['Ombros'],                  array['Halteres'],         'beginner',     true),
('Face Pull',                'Face Pull',                    array['Ombros','Trapézio'],       array['Cabo'],             'beginner',     true),
('Arnold Press',             'Desenvolvimento Arnold',       array['Ombros','Tríceps'],        array['Halteres'],         'intermediate', true),

-- BÍCEPS
('Barbell Curl',             'Rosca Direta com Barra',       array['Bíceps'],                  array['Barra'],            'beginner',     true),
('Incline Dumbbell Curl',    'Rosca Inclinada com Halteres', array['Bíceps'],                  array['Halteres','Banco'], 'beginner',     true),
('Hammer Curl',              'Rosca Martelo',                array['Bíceps','Antebraços'],     array['Halteres'],         'beginner',     true),
('Cable Curl',               'Rosca no Cabo',                array['Bíceps'],                  array['Cabo'],             'beginner',     true),

-- TRÍCEPS
('Tricep Dips',              'Tríceps no Banco / Paralela',  array['Tríceps','Peito'],         array['Paralela','Banco'], 'intermediate', true),
('Skull Crusher',            'Tríceps Testa',                array['Tríceps'],                 array['Barra','Banco'],    'intermediate', true),
('Tricep Pushdown',          'Tríceps no Pulley',            array['Tríceps'],                 array['Cabo'],             'beginner',     true),
('Overhead Tricep Extension','Tríceps Francês',              array['Tríceps'],                 array['Halteres'],         'beginner',     true),

-- PERNAS
('Barbell Back Squat',       'Agachamento com Barra',        array['Quadríceps','Glúteos','Isquiotibiais'], array['Barra'], 'intermediate', true),
('Romanian Deadlift',        'Stiff / Terra Romeno',         array['Isquiotibiais','Glúteos','Lombar'], array['Barra'], 'intermediate', true),
('Leg Press',                'Leg Press 45°',                array['Quadríceps','Glúteos'],    array['Máquina'],          'beginner',     true),
('Walking Lunge',            'Avanço Caminhando',            array['Quadríceps','Glúteos'],    array['Halteres'],         'beginner',     true),
('Leg Curl',                 'Flexão de Joelho (mesa flexora)', array['Isquiotibiais'],        array['Máquina'],          'beginner',     true),
('Leg Extension',            'Extensão de Joelho',           array['Quadríceps'],              array['Máquina'],          'beginner',     true),
('Hip Thrust',               'Elevação Pélvica com Barra',   array['Glúteos','Isquiotibiais'], array['Barra','Banco'],    'intermediate', true),
('Calf Raise',               'Panturrilha em Pé',            array['Panturrilhas'],            array['Máquina','Peso Corporal'], 'beginner', true),
('Bulgarian Split Squat',    'Agachamento Búlgaro',          array['Quadríceps','Glúteos'],    array['Halteres','Banco'], 'intermediate', true),

-- CORE / ABDÔMEN
('Plank',                    'Prancha Isométrica',           array['Abdômen','Lombar'],        array['Peso Corporal'],    'beginner',     true),
('Crunch',                   'Abdominal Crunch',             array['Abdômen'],                 array['Peso Corporal'],    'beginner',     true),
('Russian Twist',            'Abdominal Russo',              array['Abdômen','Oblíquos'],      array['Peso Corporal'],    'beginner',     true),
('Cable Crunch',             'Abdominal no Cabo',            array['Abdômen'],                 array['Cabo'],             'intermediate', true),
('Hanging Leg Raise',        'Elevação de Pernas na Barra',  array['Abdômen','Quadríceps'],    array['Barra Fixa'],       'intermediate', true),

-- CARDIO / FUNCIONAL
('Burpee',                   'Burpee',                       array['Cardio'],                  array['Peso Corporal'],    'intermediate', true),
('Box Jump',                 'Salto na Caixa',               array['Quadríceps','Glúteos','Cardio'], array['Peso Corporal'], 'intermediate', true),
('Battle Rope',              'Corda de Batalha',             array['Ombros','Cardio'],         array['Elástico'],         'intermediate', true);
