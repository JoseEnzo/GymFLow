-- ============================================================
-- GymFlow — Novos exercícios + fix typo Quadríceos → Quadríceps
-- Usa WHERE NOT EXISTS para ser idempotente.
-- ============================================================

-- Fix typo: Quadríceos → Quadríceps no Box Squat
update exercises
set muscle_groups = array_replace(muscle_groups, 'Quadríceos', 'Quadríceps')
where 'Quadríceos' = any(muscle_groups);

-- Inserir novos exercícios
insert into exercises (name, name_pt, muscle_groups, equipment, difficulty, is_global)
select v.name, v.name_pt, v.muscle_groups, v.equipment, v.difficulty::exercise_difficulty, true
from (values

-- ► PEITO (variações faltando)
('Incline Barbell Press',         'Supino Inclinado com Barra',          array['Peito','Tríceps','Ombros'],            array['Barra','Banco'],          'intermediate'),
('Decline Dumbbell Press',        'Supino Declinado com Halteres',       array['Peito','Tríceps'],                     array['Halteres','Banco'],       'intermediate'),
('Chest Dips',                    'Paralela para Peito',                 array['Peito','Tríceps'],                     array['Paralela'],               'intermediate'),
('Ring Push-up',                  'Flexão nos Anéis',                    array['Peito','Tríceps','Ombros'],            array['Anéis'],                  'intermediate'),
('Single-arm Dumbbell Press',     'Supino Unilateral com Haltere',       array['Peito','Tríceps'],                     array['Halteres','Banco'],       'intermediate'),

-- ► COSTAS (variações faltando)
('Inverted Row',                  'Remada Invertida (Barra Fixa Baixa)', array['Costas','Bíceps'],                     array['Barra Fixa'],             'beginner'),
('Renegade Row',                  'Remada Renegade',                     array['Costas','Bíceps','Abdômen'],           array['Halteres'],               'advanced'),
('Seal Row',                      'Remada Apoiada Supinada',             array['Costas','Bíceps'],                     array['Barra','Banco'],          'intermediate'),
('Sumo Deadlift',                 'Terra Sumô',                          array['Glúteos','Adutores','Isquiotibiais','Costas'], array['Barra'],         'intermediate'),
('Deficit Deadlift',              'Terra em Déficit',                    array['Costas','Lombar','Glúteos','Isquiotibiais'], array['Barra'],           'advanced'),
('Band Pull-Apart',               'Abertura com Elástico (Pull-Apart)',  array['Ombros','Trapézio','Costas'],          array['Elástico'],               'beginner'),
('Rope Face Pull',                'Face Pull com Corda e Rotação',       array['Ombros','Trapézio','Costas'],          array['Cabo'],                   'beginner'),

-- ► LOMBAR / MOBILIDADE
('Bird Dog',                      'Pássaro-cão',                         array['Lombar','Glúteos','Abdômen'],          array['Peso Corporal'],          'beginner'),
('Superman',                      'Superman',                            array['Lombar','Glúteos'],                    array['Peso Corporal'],          'beginner'),
('Reverse Hyperextension',        'Hiperextensão Reversa',               array['Lombar','Glúteos','Isquiotibiais'],    array['Máquina'],                'beginner'),
('Back Extension with Rotation',  'Hiperextensão com Rotação',           array['Lombar','Oblíquos'],                   array['Máquina'],                'intermediate'),
('Cat-Cow Stretch',               'Mobilidade Gato-Vaca',                array['Lombar'],                              array['Peso Corporal'],          'beginner'),

-- ► PERNAS — PANTURRILHAS (grupo carente)
('Donkey Calf Raise',             'Panturrilha no Burro',                array['Panturrilhas'],                        array['Máquina','Peso Corporal'],'intermediate'),
('Single-leg Calf Raise',         'Panturrilha Unilateral',              array['Panturrilhas'],                        array['Peso Corporal'],          'beginner'),
('Leg Press Calf Raise',          'Panturrilha no Leg Press',            array['Panturrilhas'],                        array['Máquina'],                'beginner'),
('Tibialis Raise',                'Elevação de Tibial',                  array['Panturrilhas'],                        array['Peso Corporal'],          'beginner'),
('Seated Machine Calf Raise',     'Panturrilha Sentado na Máquina',      array['Panturrilhas'],                        array['Máquina'],                'beginner'),

-- ► PERNAS — ABDUTORES (grupo carente)
('Banded Lateral Walk',           'Caminhada Lateral com Elástico',      array['Glúteos','Abdutores'],                 array['Elástico'],               'beginner'),
('Side-lying Hip Abduction',      'Abdução de Quadril Deitado',          array['Glúteos','Abdutores'],                 array['Peso Corporal'],          'beginner'),
('Cable Hip Abduction',           'Abdução de Quadril no Cabo',          array['Glúteos','Abdutores'],                 array['Cabo'],                   'beginner'),
('Clamshell',                     'Abrir e Fechar (Concha)',             array['Glúteos','Abdutores'],                 array['Peso Corporal','Elástico'],'beginner'),

-- ► PERNAS — ADUTORES (grupo carente)
('Cable Hip Adduction',           'Adução de Quadril no Cabo',           array['Adutores'],                            array['Cabo'],                   'beginner'),
('Banded Hip Adduction',          'Adução de Quadril com Elástico',      array['Adutores'],                            array['Elástico'],               'beginner'),
('Copenhagen Adductor Press',     'Adução de Copenhague (Deitado)',       array['Adutores','Oblíquos'],                 array['Peso Corporal'],          'intermediate'),
('Standing Hip Adduction',        'Adução de Quadril em Pé',             array['Adutores'],                            array['Cabo'],                   'beginner'),

-- ► PERNAS — GLÚTEOS / QUADRÍCEPS extras
('Single-leg Hip Thrust',         'Elevação Pélvica Unilateral',         array['Glúteos','Isquiotibiais'],             array['Banco'],                  'intermediate'),
('Barbell Hip Thrust',            'Elevação Pélvica com Barra (Pesada)', array['Glúteos','Isquiotibiais'],             array['Barra','Banco'],          'intermediate'),
('Pistol Squat',                  'Agachamento Pistol',                  array['Quadríceps','Glúteos'],                array['Peso Corporal'],          'advanced'),
('Bulgarian Split Squat Barbell', 'Agachamento Búlgaro com Barra',       array['Quadríceps','Glúteos'],                array['Barra','Banco'],          'advanced'),
('Heel-elevated Goblet Squat',    'Agachamento Goblet com Calcanhar Elevado', array['Quadríceps','Glúteos'],          array['Halteres'],               'beginner'),
('Pendulum Squat',                'Agachamento Pêndulo',                 array['Quadríceps','Glúteos'],                array['Máquina'],                'beginner'),

-- ► ANTEBRAÇOS / GRIP (grupo muito carente)
('Dead Hang',                     'Pendurado na Barra (Isometria)',       array['Antebraços','Costas'],                 array['Barra Fixa'],             'beginner'),
('Barbell Hold',                  'Segurar Barra (Isometria de Grip)',    array['Antebraços'],                          array['Barra'],                  'beginner'),
('Towel Pull-up',                 'Barra Fixa com Toalha',               array['Costas','Bíceps','Antebraços'],        array['Barra Fixa'],             'advanced'),
('Hand Gripper',                  'Exercitador de Mão (Gripper)',         array['Antebraços'],                          array['Grip'],                   'beginner'),
('Rice Bucket Training',          'Treino no Balde de Arroz',            array['Antebraços'],                          array['Outros'],                 'beginner'),

-- ► KETTLEBELL extras
('Kettlebell Deadlift',           'Terra com Kettlebell',                array['Glúteos','Isquiotibiais','Costas'],    array['Kettlebell'],             'beginner'),
('Kettlebell Row',                'Remada com Kettlebell',               array['Costas','Bíceps'],                     array['Kettlebell'],             'beginner'),
('Kettlebell Romanian Deadlift',  'Stiff com Kettlebell',                array['Isquiotibiais','Glúteos','Lombar'],    array['Kettlebell'],             'intermediate'),
('Kettlebell Goblet Squat',       'Agachamento Goblet com Kettlebell',   array['Quadríceps','Glúteos'],                array['Kettlebell'],             'beginner'),
('Kettlebell Snatch',             'Arranco com Kettlebell',              array['Ombros','Glúteos','Costas','Cardio'],  array['Kettlebell'],             'advanced'),
('Kettlebell Front Rack Squat',   'Agachamento com Kettlebell no Rack',  array['Quadríceps','Glúteos','Ombros'],       array['Kettlebell'],             'intermediate'),

-- ► CARDIO / FUNCIONAL extras
('Sprint',                        'Corrida de Alta Velocidade',          array['Cardio','Quadríceps','Glúteos'],       array['Peso Corporal'],          'intermediate'),
('Rowing Machine Sprint',         'Remo Ergométrico em Sprint',          array['Cardio','Costas','Bíceps'],            array['Ergômetro'],              'advanced'),
('Step Machine',                  'Escada Rolante / Step Machine',       array['Cardio','Quadríceps','Glúteos'],       array['Máquina'],                'beginner'),
('Ski Erg',                       'Ski Ergômetro',                       array['Cardio','Costas','Ombros'],            array['Ergômetro'],              'intermediate'),
('Sled Drag',                     'Arrasto no Trenó',                    array['Isquiotibiais','Glúteos','Cardio'],    array['Trenó'],                  'intermediate')

) as v(name, name_pt, muscle_groups, equipment, difficulty)
where not exists (
  select 1 from exercises e where e.name = v.name
);
