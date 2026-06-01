-- ============================================================
-- GymFlow — Seed: +50 exercícios adicionais (migration 011)
-- ============================================================
insert into exercises (name, name_pt, muscle_groups, equipment, difficulty, is_global) values

-- ► PEITO
('Flat Dumbbell Press',          'Supino Reto com Halteres',         array['Peito','Tríceps','Ombros'],     array['Halteres','Banco'],       'intermediate', true),
('Machine Chest Press',          'Supino na Máquina',                array['Peito','Tríceps'],              array['Máquina'],                'beginner',     true),
('Resistance Band Chest Press',  'Supino com Elástico',              array['Peito','Tríceps'],              array['Elástico'],               'beginner',     true),
('Chest Dip',                    'Mergulho para Peito',              array['Peito','Tríceps','Ombros'],     array['Paralela'],               'intermediate', true),

-- ► COSTAS
('Inverted Row',                 'Remada Invertida',                 array['Costas','Bíceps'],              array['Barra Fixa'],             'beginner',     true),
('Superman',                     'Superman',                         array['Lombar','Glúteos'],             array['Peso Corporal'],          'beginner',     true),
('Machine Row',                  'Remada na Máquina',                array['Costas','Bíceps'],              array['Máquina'],                'beginner',     true),
('Cable Pullover',               'Pullover no Cabo',                 array['Costas'],                       array['Cabo'],                   'intermediate', true),
('Sumo Deadlift',                'Levantamento Terra Sumô',          array['Costas','Glúteos','Isquiotibiais','Lombar'], array['Barra'],  'advanced',     true),
('Trap Bar Deadlift',            'Terra com Barra Hexagonal',        array['Costas','Glúteos','Isquiotibiais','Quadríceps'], array['Barra'], 'intermediate', true),
('Resistance Band Row',          'Remada com Elástico',              array['Costas','Bíceps'],              array['Elástico'],               'beginner',     true),

-- ► OMBROS
('Machine Shoulder Press',       'Desenvolvimento na Máquina',       array['Ombros','Tríceps'],             array['Máquina'],                'beginner',     true),
('Cable Front Raise',            'Elevação Frontal no Cabo',         array['Ombros'],                       array['Cabo'],                   'beginner',     true),
('Rear Delt Fly',                'Voador Posterior com Halteres',    array['Ombros','Trapézio'],            array['Halteres'],               'beginner',     true),
('Handstand Push-up',            'Flexão Invertida na Parede',       array['Ombros','Tríceps'],             array['Peso Corporal'],          'advanced',     true),
('Resistance Band Lateral Raise','Elevação Lateral com Elástico',    array['Ombros'],                       array['Elástico'],               'beginner',     true),
('Cable Rear Delt Fly',          'Voador Posterior no Cabo',         array['Ombros','Trapézio'],            array['Cabo'],                   'beginner',     true),

-- ► BÍCEPS
('EZ-Bar Curl',                  'Rosca com Barra W (EZ)',           array['Bíceps'],                       array['Barra'],                  'beginner',     true),
('Zottman Curl',                 'Rosca Zottman',                    array['Bíceps','Antebraços'],          array['Halteres'],               'intermediate', true),
('Cross Body Curl',              'Rosca Cruzada',                    array['Bíceps','Antebraços'],          array['Halteres'],               'beginner',     true),
('Machine Curl',                 'Rosca na Máquina',                 array['Bíceps'],                       array['Máquina'],                'beginner',     true),
('Resistance Band Curl',         'Rosca com Elástico',               array['Bíceps'],                       array['Elástico'],               'beginner',     true),

-- ► TRÍCEPS
('Bench Dip',                    'Tríceps no Banco',                 array['Tríceps','Peito'],              array['Banco'],                  'beginner',     true),
('Close-grip Push-up',           'Flexão Fechada',                   array['Tríceps','Peito'],              array['Peso Corporal'],          'intermediate', true),
('Machine Tricep Extension',     'Extensão de Tríceps na Máquina',   array['Tríceps'],                      array['Máquina'],                'beginner',     true),
('Resistance Band Tricep Press', 'Tríceps com Elástico',             array['Tríceps'],                      array['Elástico'],               'beginner',     true),

-- ► PERNAS
('Front Squat',                  'Agachamento Frontal',              array['Quadríceps','Glúteos'],         array['Barra'],                  'advanced',     true),
('Nordic Hamstring Curl',        'Flexão Nórdica de Isquiotibiais',  array['Isquiotibiais'],                array['Peso Corporal'],          'advanced',     true),
('Wall Sit',                     'Cadeira na Parede',                array['Quadríceps','Glúteos'],         array['Peso Corporal'],          'beginner',     true),
('Sissy Squat',                  'Agachamento Sissy',                array['Quadríceps'],                   array['Peso Corporal'],          'advanced',     true),
('Leg Press Calf Raise',         'Panturrilha no Leg Press',         array['Panturrilhas'],                 array['Máquina'],                'beginner',     true),
('Pistol Squat',                 'Agachamento Unilateral (Pistol)',  array['Quadríceps','Glúteos'],         array['Peso Corporal'],          'advanced',     true),
('Smith Machine Hip Thrust',     'Elevação Pélvica no Smith',        array['Glúteos','Isquiotibiais'],      array['Smith'],                  'intermediate', true),
('Resistance Band Hip Thrust',   'Elevação Pélvica com Elástico',    array['Glúteos','Isquiotibiais'],      array['Elástico'],               'beginner',     true),
('Cable Kickback',               'Kickback de Glúteos no Cabo',      array['Glúteos'],                      array['Cabo'],                   'beginner',     true),
('Kettlebell Deadlift',          'Levantamento Terra com Kettlebell',array['Costas','Glúteos','Isquiotibiais'], array['Kettlebell'],         'intermediate', true),

-- ► ANTEBRAÇOS
('Wrist Curl',                   'Rosca de Punho',                   array['Antebraços'],                   array['Barra'],                  'beginner',     true),
('Reverse Wrist Curl',           'Rosca de Punho Invertida',         array['Antebraços'],                   array['Barra'],                  'beginner',     true),
('Plate Pinch',                  'Pinça com Anilha',                 array['Antebraços'],                   array['Peso Corporal'],          'beginner',     true),

-- ► CORE / ABDÔMEN
('Hollow Body Hold',             'Prancha Hollow Body',              array['Abdômen','Lombar'],             array['Peso Corporal'],          'intermediate', true),
('Cable Woodchop',               'Madeireiro no Cabo',               array['Abdômen','Oblíquos'],           array['Cabo'],                   'intermediate', true),
('Reverse Crunch',               'Abdominal Reverso',                array['Abdômen'],                      array['Peso Corporal'],          'beginner',     true),
('Windmill',                     'Moinho de Vento',                  array['Oblíquos','Abdômen','Ombros'],  array['Kettlebell'],             'intermediate', true),
('Ab Machine',                   'Abdominal na Máquina',             array['Abdômen'],                      array['Máquina'],                'beginner',     true),
('Stability Ball Crunch',        'Abdominal na Bola Suíça',          array['Abdômen'],                      array['Peso Corporal'],          'beginner',     true),
('Copenhagen Plank',             'Prancha de Copenhague',            array['Oblíquos','Abdômen'],           array['Banco'],                  'advanced',     true),
('L-Sit',                        'Apoio em L',                       array['Abdômen','Tríceps'],            array['Paralela','Peso Corporal'],'advanced',    true),

-- ► CARDIO / FUNCIONAL
('High Knees',                   'Corrida com Joelhos Altos',        array['Cardio','Quadríceps'],          array['Peso Corporal'],          'beginner',     true),
('Rowing Machine',               'Remo Ergométrico',                 array['Cardio','Costas','Bíceps'],     array['Máquina'],                'intermediate', true),
('Sprint Intervals',             'Tiros de Corrida',                 array['Cardio'],                       array['Peso Corporal'],          'intermediate', true),
('Kettlebell Clean',             'Clean com Kettlebell',             array['Glúteos','Ombros','Cardio'],    array['Kettlebell'],             'advanced',     true),
('Kettlebell Press',             'Desenvolvimento com Kettlebell',   array['Ombros','Tríceps'],             array['Kettlebell'],             'intermediate', true),
('Resistance Band Pull-apart',   'Abertura com Elástico',            array['Ombros','Trapézio'],            array['Elástico'],               'beginner',     true);
