-- ============================================================
-- GymFlow — Seed: +60 exercícios adicionais
-- ============================================================
insert into exercises (name, name_pt, muscle_groups, equipment, difficulty, is_global) values

-- ► PEITO
('Decline Bench Press',        'Supino Declinado com Barra',       array['Peito','Tríceps'],              array['Barra','Banco'],          'intermediate', true),
('Close-Grip Bench Press',     'Supino Fechado com Barra',         array['Tríceps','Peito'],              array['Barra','Banco'],          'intermediate', true),
('Pec Deck',                   'Peck Deck (Máquina)',              array['Peito'],                        array['Máquina'],                'beginner',     true),
('High Cable Crossover',       'Crossover Cabo Alto',              array['Peito'],                        array['Cabo'],                   'beginner',     true),
('Low Cable Crossover',        'Crossover Cabo Baixo',             array['Peito'],                        array['Cabo'],                   'beginner',     true),
('Dumbbell Pullover',          'Pullover com Haltere',             array['Peito','Costas'],               array['Halteres','Banco'],       'intermediate', true),
('Incline Push-up',            'Flexão Inclinada',                 array['Peito','Tríceps','Ombros'],     array['Peso Corporal'],          'beginner',     true),
('Decline Push-up',            'Flexão Declinada',                 array['Peito','Ombros'],               array['Peso Corporal'],          'intermediate', true),

-- ► COSTAS
('T-Bar Row',                  'Remada no Cavalinho',              array['Costas','Bíceps'],              array['Barra'],                  'intermediate', true),
('Chest-Supported Row',        'Remada Apoiada no Banco',          array['Costas','Bíceps'],              array['Halteres','Banco'],       'beginner',     true),
('Straight-Arm Pulldown',      'Puxada de Braço Reto',             array['Costas'],                       array['Cabo'],                   'beginner',     true),
('Hyperextension',             'Hiperextensão Lombar',             array['Lombar','Glúteos'],             array['Máquina'],                'beginner',     true),
('Good Morning',               'Bom Dia com Barra',                array['Lombar','Isquiotibiais'],       array['Barra'],                  'intermediate', true),
('Chin-up',                    'Barra Fixa Supinada',              array['Costas','Bíceps'],              array['Barra Fixa'],             'intermediate', true),
('Meadows Row',                'Remada Meadows',                   array['Costas','Bíceps'],              array['Barra'],                  'intermediate', true),
('Face Pull Rope',             'Face Pull com Corda',              array['Ombros','Trapézio','Costas'],   array['Cabo'],                   'beginner',     true),

-- ► OMBROS
('Dumbbell Front Raise',       'Elevação Frontal com Halteres',    array['Ombros'],                       array['Halteres'],               'beginner',     true),
('Barbell Upright Row',        'Remada Alta com Barra',            array['Ombros','Trapézio'],            array['Barra'],                  'intermediate', true),
('Shoulder Shrug',             'Encolhimento de Ombros',           array['Trapézio'],                     array['Halteres'],               'beginner',     true),
('Reverse Pec Deck',           'Voador Invertido (Máquina)',       array['Ombros','Trapézio'],            array['Máquina'],                'beginner',     true),
('Cable Lateral Raise',        'Elevação Lateral no Cabo',         array['Ombros'],                       array['Cabo'],                   'beginner',     true),
('Single-arm Overhead Press',  'Desenvolvimento Unilateral',       array['Ombros','Tríceps'],             array['Halteres'],               'intermediate', true),
('Pike Push-up',               'Flexão em Pike',                   array['Ombros','Tríceps'],             array['Peso Corporal'],          'intermediate', true),

-- ► BÍCEPS
('Concentration Curl',         'Rosca Concentrada',                array['Bíceps'],                       array['Halteres'],               'beginner',     true),
('Preacher Curl',              'Rosca Scott com Barra',            array['Bíceps'],                       array['Barra','Máquina'],        'beginner',     true),
('Alternating Dumbbell Curl',  'Rosca Alternada com Haltere',      array['Bíceps'],                       array['Halteres'],               'beginner',     true),
('Reverse Curl',               'Rosca Inversa',                    array['Bíceps','Antebraços'],          array['Barra'],                  'beginner',     true),
('Spider Curl',                'Rosca Aranha',                     array['Bíceps'],                       array['Barra','Banco'],          'intermediate', true),
('Cable Hammer Curl',          'Rosca Martelo no Cabo',            array['Bíceps','Antebraços'],          array['Cabo'],                   'beginner',     true),

-- ► TRÍCEPS
('Diamond Push-up',            'Flexão Diamante',                  array['Tríceps','Peito'],              array['Peso Corporal'],          'intermediate', true),
('Tricep Kickback',            'Tríceps Coice',                    array['Tríceps'],                      array['Halteres'],               'beginner',     true),
('Rope Pushdown',              'Tríceps no Pulley com Corda',      array['Tríceps'],                      array['Cabo'],                   'beginner',     true),
('Single-arm Cable Extension', 'Extensão de Tríceps Unilateral',   array['Tríceps'],                      array['Cabo'],                   'beginner',     true),

-- ► PERNAS
('Sumo Squat',                 'Agachamento Sumô',                 array['Quadríceps','Glúteos','Adutores'],array['Halteres'],             'beginner',     true),
('Goblet Squat',               'Agachamento Goblet',               array['Quadríceps','Glúteos'],         array['Halteres'],               'beginner',     true),
('Hack Squat',                 'Hack Squat (Máquina)',             array['Quadríceps','Glúteos'],         array['Máquina'],                'intermediate', true),
('Smith Machine Squat',        'Agachamento no Smith',             array['Quadríceos','Glúteos'],         array['Smith'],                  'beginner',     true),
('Seated Leg Curl',            'Flexão de Joelho Sentado',         array['Isquiotibiais'],                array['Máquina'],                'beginner',     true),
('Standing Leg Curl',          'Flexão de Joelho em Pé',           array['Isquiotibiais'],                array['Máquina'],                'beginner',     true),
('Abductor Machine',           'Cadeira Abdutora',                 array['Glúteos','Abdutores'],          array['Máquina'],                'beginner',     true),
('Adductor Machine',           'Cadeira Adutora',                  array['Adutores'],                     array['Máquina'],                'beginner',     true),
('Seated Calf Raise',          'Panturrilha Sentado',              array['Panturrilhas'],                 array['Máquina'],                'beginner',     true),
('Step-up',                    'Subida no Banco',                  array['Quadríceps','Glúteos'],         array['Halteres','Banco'],       'beginner',     true),
('Glute Kickback',             'Kickback de Glúteos',              array['Glúteos'],                      array['Cabo','Peso Corporal'],   'beginner',     true),
('Reverse Lunge',              'Avanço Reverso',                   array['Quadríceps','Glúteos'],         array['Halteres'],               'beginner',     true),
('Lateral Lunge',              'Avanço Lateral',                   array['Quadríceps','Adutores','Glúteos'],array['Peso Corporal'],        'beginner',     true),
('Glute Bridge',               'Ponte de Glúteos',                 array['Glúteos','Isquiotibiais'],      array['Peso Corporal'],          'beginner',     true),
('Single-leg Deadlift',        'Terra Unilateral (Pistol DL)',     array['Isquiotibiais','Glúteos','Lombar'],array['Halteres'],            'advanced',     true),

-- ► CORE / ABDÔMEN
('Side Plank',                 'Prancha Lateral',                  array['Oblíquos','Abdômen'],           array['Peso Corporal'],          'beginner',     true),
('Bicycle Crunch',             'Abdominal Bicicleta',              array['Abdômen','Oblíquos'],           array['Peso Corporal'],          'beginner',     true),
('V-Up',                       'Tesoura em V',                     array['Abdômen'],                      array['Peso Corporal'],          'intermediate', true),
('Mountain Climber',           'Escalador',                        array['Abdômen','Cardio'],             array['Peso Corporal'],          'intermediate', true),
('Ab Wheel Rollout',           'Abdominal com Roda',               array['Abdômen','Lombar'],             array['Roda de Abdominal'],      'advanced',     true),
('Lying Leg Raise',            'Elevação de Pernas Deitado',       array['Abdômen'],                      array['Peso Corporal'],          'beginner',     true),
('Pallof Press',               'Pallof Press',                     array['Abdômen','Oblíquos'],           array['Cabo'],                   'intermediate', true),
('Dead Bug',                   'Dead Bug',                         array['Abdômen','Lombar'],             array['Peso Corporal'],          'beginner',     true),
('Toe Touch',                  'Abdominal Toque no Pé',            array['Abdômen'],                      array['Peso Corporal'],          'beginner',     true),
('Dragon Flag',                'Dragon Flag',                      array['Abdômen','Lombar'],             array['Banco'],                  'advanced',     true),

-- ► CARDIO / FUNCIONAL
('Jump Rope',                  'Pular Corda',                      array['Cardio','Panturrilhas'],        array['Corda'],                  'beginner',     true),
('Jumping Jacks',              'Polichinelo',                      array['Cardio'],                       array['Peso Corporal'],          'beginner',     true),
('Squat Jump',                 'Agachamento com Salto',            array['Quadríceps','Glúteos','Cardio'],array['Peso Corporal'],          'intermediate', true),
('Kettlebell Swing',           'Swing com Kettlebell',             array['Glúteos','Isquiotibiais','Cardio'],array['Kettlebell'],          'intermediate', true),
('Farmer Walk',                'Caminhada do Agricultor',          array['Antebraços','Trapézio','Cardio'],array['Halteres'],              'beginner',     true),
('Turkish Get-up',             'Turkish Get-up',                   array['Ombros','Abdômen','Cardio'],    array['Kettlebell'],             'advanced',     true),
('Sled Push',                  'Empurrão no Trenó',                array['Quadríceps','Glúteos','Cardio'],array['Trenó'],                  'intermediate', true),
('Bear Crawl',                 'Engatinhamento do Urso',           array['Abdômen','Ombros','Cardio'],    array['Peso Corporal'],          'intermediate', true),
('Tuck Jump',                  'Salto com Joelhos ao Peito',       array['Cardio','Quadríceps'],          array['Peso Corporal'],          'intermediate', true);
