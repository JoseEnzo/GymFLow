-- ============================================================
-- GymFlow — Expansão massiva da biblioteca de exercícios
-- +350 novos exercícios globais organizados por grupo muscular
-- Idempotente via WHERE NOT EXISTS
-- ============================================================

insert into exercises (name, name_pt, muscle_groups, equipment, difficulty, is_global)
select v.name, v.name_pt, v.muscle_groups, v.equipment, v.difficulty::exercise_difficulty, true
from (values

-- ══════════════════════════════════════════════════════════════
-- ► PEITO — variações avançadas e máquinas
-- ══════════════════════════════════════════════════════════════
('Incline Cable Fly',               'Crucifixo Inclinado no Cabo',              array['Peito'],                               array['Cabo'],                   'intermediate'),
('Decline Cable Fly',               'Crucifixo Declinado no Cabo',              array['Peito'],                               array['Cabo'],                   'intermediate'),
('Incline Pec Deck',                'Peck Deck Inclinado',                      array['Peito'],                               array['Máquina'],                'beginner'),
('Plate Press',                     'Supino com Anilha (Squeeze)',              array['Peito'],                               array['Anilhas'],                'beginner'),
('Wide Push-up',                    'Flexão com Mãos Abertas',                  array['Peito','Ombros'],                      array['Peso Corporal'],          'beginner'),
('Archer Push-up',                  'Flexão Arqueiro',                          array['Peito','Tríceps'],                     array['Peso Corporal'],          'advanced'),
('Pseudo Planche Push-up',          'Flexão Pseudo-Plancha',                    array['Peito','Ombros','Tríceps'],            array['Peso Corporal'],          'advanced'),
('One-arm Push-up',                 'Flexão com Um Braço',                      array['Peito','Tríceps','Ombros'],            array['Peso Corporal'],          'advanced'),
('Weighted Push-up',                'Flexão com Peso',                          array['Peito','Tríceps','Ombros'],            array['Colete'],                 'intermediate'),
('Ring Chest Fly',                  'Crucifixo nos Anéis',                      array['Peito','Ombros'],                      array['Anéis'],                  'advanced'),
('Ring Push-up Feet Elevated',      'Flexão nos Anéis com Pés Elevados',        array['Peito','Tríceps','Ombros'],            array['Anéis'],                  'advanced'),
('Smith Machine Incline Press',     'Supino Inclinado no Smith',                array['Peito','Ombros','Tríceps'],            array['Smith'],                  'beginner'),
('Smith Machine Decline Press',     'Supino Declinado no Smith',                array['Peito','Tríceps'],                     array['Smith'],                  'beginner'),
('Reverse-grip Bench Press',        'Supino com Pegada Invertida',              array['Peito','Tríceps'],                     array['Barra','Banco'],          'intermediate'),
('Guillotine Press',                'Supino Guilhotina',                        array['Peito'],                               array['Barra','Banco'],          'advanced'),
('Low-to-High Cable Fly',           'Crucifixo Cabo Baixo para Cima',           array['Peito'],                               array['Cabo'],                   'beginner'),
('High-to-Low Cable Fly',           'Crucifixo Cabo Alto para Baixo',           array['Peito'],                               array['Cabo'],                   'beginner'),
('Chest Press Machine',             'Supino na Máquina',                        array['Peito','Tríceps','Ombros'],            array['Máquina'],                'beginner'),
('Incline Chest Press Machine',     'Supino Inclinado na Máquina',              array['Peito','Ombros'],                      array['Máquina'],                'beginner'),
('Hammer Strength Chest Press',     'Supino Hammer Strength',                   array['Peito','Tríceps'],                     array['Máquina'],                'beginner'),
('Dumbbell Pullover Chest Focus',   'Pullover com Ênfase no Peito',             array['Peito'],                               array['Halteres','Banco'],       'intermediate'),
('Landmine Chest Press',            'Supino no Landmine',                       array['Peito','Ombros'],                      array['Barra'],                  'intermediate'),
('TRX Push-up',                     'Flexão no TRX',                            array['Peito','Tríceps','Ombros'],            array['TRX'],                    'intermediate'),
('TRX Chest Fly',                   'Crucifixo no TRX',                         array['Peito'],                               array['TRX'],                    'intermediate'),
('Dumbbell Squeeze Press',          'Supino com Squeeze (Halteres)',            array['Peito'],                               array['Halteres','Banco'],       'beginner'),
('Close-grip Dumbbell Press',       'Supino Fechado com Halteres',              array['Peito','Tríceps'],                     array['Halteres','Banco'],       'beginner'),

-- ══════════════════════════════════════════════════════════════
-- ► COSTAS — variações e máquinas
-- ══════════════════════════════════════════════════════════════
('Wide-grip Pull-up',               'Barra Fixa com Pegada Aberta',             array['Costas','Bíceps'],                     array['Barra Fixa'],             'advanced'),
('Neutral-grip Pull-up',            'Barra Fixa com Pegada Neutra',             array['Costas','Bíceps'],                     array['Barra Fixa'],             'intermediate'),
('Behind-the-neck Pull-up',         'Barra Fixa para a Nuca',                   array['Costas','Bíceps'],                     array['Barra Fixa'],             'advanced'),
('Weighted Pull-up',                'Barra Fixa com Peso',                      array['Costas','Bíceps'],                     array['Barra Fixa','Colete'],    'advanced'),
('Band-assisted Pull-up',           'Barra Fixa com Elástico',                  array['Costas','Bíceps'],                     array['Barra Fixa','Elástico'],  'beginner'),
('Scapular Pull-up',                'Retração Escapular na Barra',              array['Costas'],                              array['Barra Fixa'],             'beginner'),
('Lat Pulldown Neutral Grip',       'Puxada Pegada Neutra',                     array['Costas','Bíceps'],                     array['Máquina','Cabo'],         'beginner'),
('Lat Pulldown Close Grip',         'Puxada Pegada Fechada',                    array['Costas','Bíceps'],                     array['Máquina','Cabo'],         'beginner'),
('Lat Pulldown Behind Neck',        'Puxada para a Nuca',                       array['Costas','Bíceps'],                     array['Máquina','Cabo'],         'advanced'),
('Lat Pulldown Single Arm',         'Puxada Unilateral no Pulley',              array['Costas','Bíceps'],                     array['Máquina','Cabo'],         'intermediate'),
('Seated Cable Row Close Grip',     'Remada Sentada Pegada Fechada',            array['Costas','Bíceps'],                     array['Cabo','Máquina'],         'beginner'),
('Seated Cable Row Wide Grip',      'Remada Sentada Pegada Aberta',             array['Costas','Ombros'],                     array['Cabo','Máquina'],         'beginner'),
('Cable Row to Chest',              'Remada no Cabo ao Peito',                  array['Costas','Bíceps'],                     array['Cabo'],                   'intermediate'),
('Cable Row to Waist',              'Remada no Cabo à Cintura',                 array['Costas','Bíceps'],                     array['Cabo'],                   'beginner'),
('Barbell Row Supinated',           'Remada Curvada Supinada',                  array['Costas','Bíceps'],                     array['Barra'],                  'intermediate'),
('Kroc Row',                        'Remada Kroc',                              array['Costas','Bíceps','Trapézio'],          array['Halteres','Banco'],       'advanced'),
('Barbell Row Overhand',            'Remada Pronada com Barra',                 array['Costas','Bíceps'],                     array['Barra'],                  'intermediate'),
('Dumbbell Row Neutral Grip',       'Remada com Haltere Pegada Neutra',         array['Costas','Bíceps'],                     array['Halteres'],               'beginner'),
('Smith Machine Row',               'Remada no Smith',                          array['Costas','Bíceps'],                     array['Smith'],                  'beginner'),
('Hammer Strength Row',             'Remada Hammer Strength',                   array['Costas','Bíceps'],                     array['Máquina'],                'beginner'),
('Cable Single Arm Pulldown',       'Puxada Unilateral no Cabo',                array['Costas','Bíceps'],                     array['Cabo'],                   'intermediate'),
('TRX Row',                         'Remada no TRX',                            array['Costas','Bíceps'],                     array['TRX'],                    'beginner'),
('TRX Inverted Row',                'Remada Invertida no TRX',                  array['Costas','Bíceps'],                     array['TRX'],                    'beginner'),
('Stiff-legged Deadlift',           'Levantamento Terra com Pernas Retas',      array['Isquiotibiais','Lombar','Glúteos'],    array['Barra'],                  'intermediate'),
('Sumo Deadlift High Pull',         'Terra Sumô com Puxada Alta',               array['Glúteos','Costas','Ombros'],           array['Barra'],                  'advanced'),
('Banded Pull-apart',               'Abertura com Banda (Posterior)',           array['Costas','Ombros'],                     array['Elástico'],               'beginner'),
('Rope Pulldown',                   'Puxada com Corda no Pulley',               array['Costas'],                              array['Cabo'],                   'intermediate'),
('Dumbbell Shrug Overhead',         'Encolhimento em Cima com Haltere',         array['Trapézio'],                            array['Halteres'],               'intermediate'),
('Cable Shrug',                     'Encolhimento no Cabo',                     array['Trapézio'],                            array['Cabo'],                   'beginner'),
('Behind-the-back Barbell Shrug',   'Encolhimento com Barra pelas Costas',      array['Trapézio'],                            array['Barra'],                  'intermediate'),
('Power Shrug',                     'Encolhimento de Potência',                 array['Trapézio','Glúteos'],                  array['Barra'],                  'intermediate'),
('Deficit Romanian Deadlift',       'Stiff em Déficit',                         array['Isquiotibiais','Glúteos','Lombar'],    array['Barra'],                  'advanced'),
('45-degree Hyperextension',        'Hiperextensão 45° com Rotação',            array['Lombar','Glúteos'],                    array['Máquina'],                'beginner'),
('GHD Back Extension',              'Hiperextensão no GHD',                     array['Lombar','Glúteos','Isquiotibiais'],    array['Máquina GHD'],            'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► OMBROS — variações e isolamento
-- ══════════════════════════════════════════════════════════════
('Dumbbell Upright Row',            'Remada Alta com Haltere',                  array['Ombros','Trapézio'],                   array['Halteres'],               'beginner'),
('Cable Upright Row',               'Remada Alta no Cabo',                      array['Ombros','Trapézio'],                   array['Cabo'],                   'beginner'),
('Machine Lateral Raise',           'Elevação Lateral na Máquina',              array['Ombros'],                              array['Máquina'],                'beginner'),
('Cable Y-Raise',                   'Elevação em Y no Cabo',                    array['Ombros'],                              array['Cabo'],                   'beginner'),
('Cable W-Raise',                   'Elevação em W no Cabo',                    array['Ombros','Trapézio'],                   array['Cabo'],                   'beginner'),
('Band Shoulder Press',             'Desenvolvimento com Elástico',             array['Ombros','Tríceps'],                    array['Elástico'],               'beginner'),
('Band Lateral Raise',              'Elevação Lateral com Elástico',            array['Ombros'],                              array['Elástico'],               'beginner'),
('Incline Dumbbell Front Raise',    'Elevação Frontal Inclinada com Haltere',   array['Ombros'],                              array['Halteres','Banco'],       'beginner'),
('Plate Front Raise',               'Elevação Frontal com Anilha',              array['Ombros'],                              array['Anilhas'],                'beginner'),
('Plate Lateral Raise',             'Elevação Lateral com Anilha',              array['Ombros'],                              array['Anilhas'],                'beginner'),
('Dumbbell Rear Delt Fly',          'Crucifixo Invertido com Haltere',          array['Ombros','Trapézio'],                   array['Halteres'],               'beginner'),
('Machine Rear Delt Fly',           'Voador Posterior na Máquina',              array['Ombros','Trapézio'],                   array['Máquina'],                'beginner'),
('Cable Rear Delt Fly',             'Crucifixo Posterior no Cabo',              array['Ombros','Trapézio'],                   array['Cabo'],                   'beginner'),
('Seated Arnold Press',             'Desenvolvimento Arnold Sentado',           array['Ombros','Tríceps'],                    array['Halteres','Banco'],       'intermediate'),
('Standing Arnold Press',           'Desenvolvimento Arnold em Pé',             array['Ombros','Tríceps'],                    array['Halteres'],               'intermediate'),
('Leaning Lateral Raise',           'Elevação Lateral Inclinada na Polia',      array['Ombros'],                              array['Cabo'],                   'beginner'),
('Kneeling Overhead Press',         'Desenvolvimento Ajoelhado',                array['Ombros','Core'],                       array['Barra'],                  'intermediate'),
('Z-press',                         'Z-Press (Desenvolvimento no Chão)',        array['Ombros','Tríceps','Core'],             array['Barra'],                  'advanced'),
('Bradford Press',                  'Bradford Press',                           array['Ombros','Trapézio'],                   array['Barra'],                  'intermediate'),
('Circus Dumbbell Press',           'Press com Haltere Pesado (Circus)',        array['Ombros','Tríceps'],                    array['Halteres'],               'advanced'),
('Push Jerk',                       'Push Jerk',                                array['Ombros','Quadríceps','Tríceps'],       array['Barra'],                  'advanced'),
('Split Jerk',                      'Split Jerk',                               array['Ombros','Quadríceps','Core'],          array['Barra'],                  'advanced'),
('Behind-the-neck Press',           'Desenvolvimento para a Nuca',              array['Ombros','Trapézio'],                   array['Barra'],                  'advanced'),
('TRX W-Pull',                      'Puxada em W no TRX',                       array['Ombros','Trapézio','Costas'],          array['TRX'],                    'beginner'),
('Face Pull Machine',               'Face Pull na Máquina',                     array['Ombros','Trapézio'],                   array['Máquina'],                'beginner'),

-- ══════════════════════════════════════════════════════════════
-- ► BÍCEPS — variações e isolamento
-- ══════════════════════════════════════════════════════════════
('EZ Bar Curl',                     'Rosca com Barra EZ',                       array['Bíceps'],                              array['Barra EZ'],               'beginner'),
('Reverse EZ Bar Curl',             'Rosca Inversa com Barra EZ',               array['Bíceps','Antebraços'],                 array['Barra EZ'],               'beginner'),
('Cable Rope Curl',                 'Rosca com Corda no Cabo',                  array['Bíceps'],                              array['Cabo'],                   'beginner'),
('Machine Preacher Curl',           'Rosca Scott na Máquina',                   array['Bíceps'],                              array['Máquina'],                'beginner'),
('Dumbbell Preacher Curl',          'Rosca Scott com Haltere',                  array['Bíceps'],                              array['Halteres','Banco'],       'beginner'),
('Incline Alternating Curl',        'Rosca Inclinada Alternada',                array['Bíceps'],                              array['Halteres','Banco'],       'beginner'),
('Supinating Dumbbell Curl',        'Rosca com Supinação',                      array['Bíceps'],                              array['Halteres'],               'beginner'),
('Wide-grip Barbell Curl',          'Rosca com Pegada Aberta',                  array['Bíceps'],                              array['Barra'],                  'beginner'),
('Close-grip Barbell Curl',         'Rosca com Pegada Fechada',                 array['Bíceps'],                              array['Barra'],                  'beginner'),
('Seated Dumbbell Curl',            'Rosca Sentado com Haltere',                array['Bíceps'],                              array['Halteres','Banco'],       'beginner'),
('Standing Cable Curl',             'Rosca no Cabo em Pé',                      array['Bíceps'],                              array['Cabo'],                   'beginner'),
('Low Cable Curl',                  'Rosca no Cabo Baixo',                      array['Bíceps'],                              array['Cabo'],                   'beginner'),
('Bayesian Curl',                   'Rosca Bayesiana (Cabo Atrás)',             array['Bíceps'],                              array['Cabo'],                   'intermediate'),
('Waiter Curl',                     'Rosca Garçom',                             array['Bíceps'],                              array['Halteres'],               'beginner'),
('TRX Bicep Curl',                  'Rosca no TRX',                             array['Bíceps'],                              array['TRX'],                    'beginner'),
('Band Curl',                       'Rosca com Elástico',                       array['Bíceps'],                              array['Elástico'],               'beginner'),
('Band Hammer Curl',                'Rosca Martelo com Elástico',               array['Bíceps','Antebraços'],                 array['Elástico'],               'beginner'),
('Behind-the-back Cable Curl',      'Rosca no Cabo pelas Costas',               array['Bíceps'],                              array['Cabo'],                   'intermediate'),
('Ledge Curl (chin over bar iso)',  'Rosca Isométrica na Barra',                array['Bíceps'],                              array['Barra Fixa'],             'intermediate'),
('Resistance Band 21s',             '21s com Elástico',                         array['Bíceps'],                              array['Elástico'],               'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► TRÍCEPS — variações e isolamento
-- ══════════════════════════════════════════════════════════════
('EZ Bar Skull Crusher',            'Tríceps Testa com Barra EZ',               array['Tríceps'],                             array['Barra EZ','Banco'],       'intermediate'),
('Dumbbell Skull Crusher',          'Tríceps Testa com Haltere',                array['Tríceps'],                             array['Halteres','Banco'],       'intermediate'),
('Cable Overhead Tricep Extension', 'Tríceps Francês no Cabo',                  array['Tríceps'],                             array['Cabo'],                   'beginner'),
('Band Tricep Pushdown',            'Tríceps no Elástico',                      array['Tríceps'],                             array['Elástico'],               'beginner'),
('Incline Overhead Tricep Ext',     'Tríceps Francês Inclinado',                array['Tríceps'],                             array['Halteres','Banco'],       'beginner'),
('Single-arm Overhead Dumbbell Ext','Tríceps Francês Unilateral',               array['Tríceps'],                             array['Halteres'],               'beginner'),
('Dips Weighted',                   'Paralela com Peso',                        array['Tríceps','Peito'],                     array['Paralela','Colete'],      'advanced'),
('Cable Kickback Single Arm',       'Coice de Tríceps Unilateral no Cabo',      array['Tríceps'],                             array['Cabo'],                   'beginner'),
('TRX Tricep Extension',            'Extensão de Tríceps no TRX',               array['Tríceps'],                             array['TRX'],                    'intermediate'),
('Band Overhead Tricep Extension',  'Tríceps Francês com Elástico',             array['Tríceps'],                             array['Elástico'],               'beginner'),
('Reverse Grip Pushdown',           'Tríceps Pulley Pegada Invertida',          array['Tríceps'],                             array['Cabo'],                   'beginner'),
('V-bar Pushdown',                  'Tríceps no Pulley com Barra V',            array['Tríceps'],                             array['Cabo'],                   'beginner'),
('Bar Pushdown',                    'Tríceps no Pulley com Barra Reta',         array['Tríceps'],                             array['Cabo'],                   'beginner'),
('Close-grip Smith Press',          'Supino Fechado no Smith',                  array['Tríceps','Peito'],                     array['Smith'],                  'beginner'),
('Rolling Dumbbell Extension',      'Extensão Rolante com Haltere',             array['Tríceps'],                             array['Halteres','Banco'],       'intermediate'),
('Ring Dips',                       'Paralela nos Anéis',                       array['Tríceps','Peito'],                     array['Anéis'],                  'advanced'),

-- ══════════════════════════════════════════════════════════════
-- ► QUADRÍCEPS — variações
-- ══════════════════════════════════════════════════════════════
('Belt Squat',                      'Agachamento com Cinto (Belt Squat)',        array['Quadríceps','Glúteos'],                array['Máquina'],                'beginner'),
('Spanish Squat',                   'Agachamento Espanhol com Elástico',        array['Quadríceps'],                          array['Elástico'],               'beginner'),
('Narrow-stance Squat',             'Agachamento com Pés Fechados',             array['Quadríceps'],                          array['Barra'],                  'intermediate'),
('Wide-stance Squat',               'Agachamento com Pés Abertos',              array['Quadríceps','Glúteos','Adutores'],     array['Barra'],                  'intermediate'),
('Overhead Squat',                  'Agachamento Overhead',                     array['Quadríceps','Glúteos','Ombros','Core'],array['Barra'],                  'advanced'),
('Paused Squat',                    'Agachamento com Pausa',                    array['Quadríceps','Glúteos'],                array['Barra'],                  'advanced'),
('Tempo Squat',                     'Agachamento com Tempo Controlado',         array['Quadríceps','Glúteos'],                array['Barra'],                  'intermediate'),
('High-bar Squat',                  'Agachamento Barra Alta',                   array['Quadríceps','Glúteos'],                array['Barra'],                  'intermediate'),
('Low-bar Squat',                   'Agachamento Barra Baixa',                  array['Quadríceps','Glúteos','Lombar'],       array['Barra'],                  'intermediate'),
('Safety Bar Squat',                'Agachamento com Barra Safety',             array['Quadríceps','Glúteos'],                array['Barra Safety'],           'intermediate'),
('Leg Press Single Leg',            'Leg Press Unilateral',                     array['Quadríceps','Glúteos'],                array['Máquina'],                'beginner'),
('Leg Extension Single Leg',        'Extensão de Joelho Unilateral',            array['Quadríceps'],                          array['Máquina'],                'beginner'),
('Hack Squat Narrow Stance',        'Hack Squat Pés Fechados',                  array['Quadríceps'],                          array['Máquina'],                'intermediate'),
('Cable Single Leg Extension',      'Extensão de Joelho no Cabo',               array['Quadríceps'],                          array['Cabo'],                   'beginner'),
('Landmine Squat',                  'Agachamento no Landmine',                  array['Quadríceps','Glúteos'],                array['Barra'],                  'beginner'),
('TRX Squat',                       'Agachamento no TRX',                       array['Quadríceps','Glúteos'],                array['TRX'],                    'beginner'),
('Barbell Lunge',                   'Avanço com Barra',                         array['Quadríceps','Glúteos'],                array['Barra'],                  'intermediate'),
('Overhead Lunge',                  'Avanço com Peso Overhead',                 array['Quadríceps','Glúteos','Ombros'],       array['Halteres'],               'intermediate'),
('Jumping Lunge',                   'Avanço com Salto',                         array['Quadríceps','Glúteos','Cardio'],       array['Peso Corporal'],          'intermediate'),
('Clock Lunge',                     'Avanço em Relógio',                        array['Quadríceps','Glúteos','Adutores'],     array['Peso Corporal'],          'intermediate'),
('Rear-foot Elevated Split Squat',  'Agachamento Búlgaro com Pé Elevado',       array['Quadríceps','Glúteos'],                array['Peso Corporal','Banco'],  'intermediate'),
('Cyclist Squat',                   'Agachamento Ciclista (Calcanhar Elevado)', array['Quadríceps'],                          array['Anilhas'],                'beginner'),

-- ══════════════════════════════════════════════════════════════
-- ► ISQUIOTIBIAIS — variações
-- ══════════════════════════════════════════════════════════════
('Prone Leg Curl',                  'Flexão de Joelho Deitado',                 array['Isquiotibiais'],                       array['Máquina'],                'beginner'),
('Cable Leg Curl',                  'Flexão de Joelho no Cabo',                 array['Isquiotibiais'],                       array['Cabo'],                   'beginner'),
('Single-leg Romanian Deadlift',    'Stiff Unilateral com Haltere',             array['Isquiotibiais','Glúteos'],             array['Halteres'],               'intermediate'),
('Banded Good Morning',             'Bom Dia com Elástico',                     array['Isquiotibiais','Lombar'],              array['Elástico'],               'beginner'),
('Swiss Ball Leg Curl',             'Flexão de Joelho na Bola Suíça',           array['Isquiotibiais','Glúteos'],             array['Bola Suíça'],             'intermediate'),
('GHD Leg Curl',                    'Flexão de Joelho no GHD',                  array['Isquiotibiais','Glúteos'],             array['Máquina GHD'],            'advanced'),
('Kettlebell Romanian Deadlift SL', 'Stiff Unilateral com Kettlebell',          array['Isquiotibiais','Glúteos'],             array['Kettlebell'],             'intermediate'),
('Lying Band Leg Curl',             'Flexão de Joelho com Elástico Deitado',    array['Isquiotibiais'],                       array['Elástico'],               'beginner'),
('TRX Hamstring Curl',              'Flexão de Joelho no TRX',                  array['Isquiotibiais','Glúteos'],             array['TRX'],                    'intermediate'),
('Glute-ham Raise',                 'Glute-Ham Raise (GHR)',                    array['Isquiotibiais','Glúteos'],             array['Máquina GHD'],            'advanced'),

-- ══════════════════════════════════════════════════════════════
-- ► GLÚTEOS — variações
-- ══════════════════════════════════════════════════════════════
('Banded Hip Thrust',               'Elevação Pélvica com Elástico',            array['Glúteos','Isquiotibiais'],             array['Elástico','Banco'],       'beginner'),
('Cable Pull Through Single',       'Pull-Through Unilateral no Cabo',          array['Glúteos','Isquiotibiais'],             array['Cabo'],                   'beginner'),
('Sumo Romanian Deadlift',          'Stiff Sumô',                               array['Glúteos','Adutores','Isquiotibiais'],  array['Barra'],                  'intermediate'),
('Hip Thrust Machine',              'Elevação Pélvica na Máquina',              array['Glúteos'],                             array['Máquina'],                'beginner'),
('Reverse Hyperextension Machine',  'Hiperextensão Reversa na Máquina',         array['Glúteos','Isquiotibiais','Lombar'],    array['Máquina'],                'intermediate'),
('Standing Cable Hip Extension',    'Extensão de Quadril em Pé no Cabo',        array['Glúteos'],                             array['Cabo'],                   'beginner'),
('Banded Glute Bridge',             'Ponte de Glúteos com Elástico',            array['Glúteos','Isquiotibiais'],             array['Elástico'],               'beginner'),
('Elevated Glute Bridge',           'Ponte de Glúteos com Pés Elevados',        array['Glúteos','Isquiotibiais'],             array['Banco'],                  'beginner'),
('Weighted Donkey Kick',            'Coice de Burro com Peso',                  array['Glúteos'],                             array['Elástico','Cabo'],        'beginner'),
('Hip Circle Walk',                 'Caminhada com Círculo de Quadril',         array['Glúteos','Abdutores'],                 array['Elástico'],               'beginner'),
('Cable Glute Kickback',            'Kickback de Glúteos no Cabo',              array['Glúteos'],                             array['Cabo'],                   'beginner'),
('Smith Machine Hip Thrust',        'Elevação Pélvica no Smith',                array['Glúteos','Isquiotibiais'],             array['Smith','Banco'],          'beginner'),
('45 Hip Extension',                'Extensão de Quadril a 45°',                array['Glúteos','Lombar'],                    array['Máquina'],                'beginner'),
('Quadruped Hip Extension',         'Extensão de Quadril em Quatro Apoios',     array['Glúteos'],                             array['Peso Corporal'],          'beginner'),

-- ══════════════════════════════════════════════════════════════
-- ► PANTURRILHAS — variações
-- ══════════════════════════════════════════════════════════════
('Barbell Calf Raise',              'Panturrilha com Barra',                    array['Panturrilhas'],                        array['Barra'],                  'beginner'),
('Dumbbell Calf Raise',             'Panturrilha com Haltere',                  array['Panturrilhas'],                        array['Halteres'],               'beginner'),
('Cable Calf Raise',                'Panturrilha no Cabo',                      array['Panturrilhas'],                        array['Cabo'],                   'beginner'),
('Smith Machine Calf Raise',        'Panturrilha no Smith',                     array['Panturrilhas'],                        array['Smith'],                  'beginner'),
('Hack Squat Calf Raise',           'Panturrilha no Hack Squat',                array['Panturrilhas'],                        array['Máquina'],                'beginner'),
('Explosive Calf Raise',            'Panturrilha Explosiva',                    array['Panturrilhas'],                        array['Peso Corporal'],          'intermediate'),
('Eccentric Calf Raise',            'Panturrilha Excêntrica',                   array['Panturrilhas'],                        array['Peso Corporal'],          'intermediate'),
('Seated Calf Raise Band',          'Panturrilha Sentado com Elástico',         array['Panturrilhas'],                        array['Elástico'],               'beginner'),
('Jumping Calf Raise',              'Panturrilha com Salto',                    array['Panturrilhas','Cardio'],               array['Peso Corporal'],          'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► CORE / ABDÔMEN — variações
-- ══════════════════════════════════════════════════════════════
('Reverse Crunch',                  'Abdominal Invertido',                      array['Abdômen'],                             array['Peso Corporal'],          'beginner'),
('Cable Pallof Press Rotation',     'Pallof Press com Rotação',                 array['Abdômen','Oblíquos'],                  array['Cabo'],                   'intermediate'),
('Barbell Rollout',                 'Abdominal com Barra',                      array['Abdômen','Lombar'],                    array['Barra'],                  'advanced'),
('TRX Fallout',                     'Fallout no TRX',                           array['Abdômen','Lombar'],                    array['TRX'],                    'advanced'),
('TRX Pike',                        'Pike no TRX',                              array['Abdômen','Ombros'],                    array['TRX'],                    'advanced'),
('TRX Knee Tuck',                   'Joelhos ao Peito no TRX',                  array['Abdômen'],                             array['TRX'],                    'intermediate'),
('Med Ball Russian Twist',          'Abdominal Russo com Medicine Ball',        array['Abdômen','Oblíquos'],                  array['Medicine Ball'],          'intermediate'),
('Med Ball Crunch',                 'Abdominal com Medicine Ball',              array['Abdômen'],                             array['Medicine Ball'],          'beginner'),
('Decline Crunch',                  'Abdominal no Banco Declinado',             array['Abdômen'],                             array['Banco'],                  'intermediate'),
('Decline Weighted Crunch',         'Abdominal com Peso no Banco Declinado',    array['Abdômen'],                             array['Banco','Anilhas'],        'intermediate'),
('Hanging Knee Raise',              'Elevação de Joelhos na Barra',             array['Abdômen'],                             array['Barra Fixa'],             'beginner'),
('Hanging Oblique Knee Raise',      'Elevação de Joelhos Oblíqua',              array['Abdômen','Oblíquos'],                  array['Barra Fixa'],             'intermediate'),
('GHD Sit-up',                      'Abdominal no GHD',                         array['Abdômen'],                             array['Máquina GHD'],            'intermediate'),
('Cable Side Bend',                 'Flexão Lateral no Cabo',                   array['Oblíquos'],                            array['Cabo'],                   'beginner'),
('Dumbbell Side Bend',              'Flexão Lateral com Haltere',               array['Oblíquos'],                            array['Halteres'],               'beginner'),
('Plank with Hip Dip',              'Prancha com Rotação de Quadril',           array['Oblíquos','Abdômen'],                  array['Peso Corporal'],          'intermediate'),
('Plank with Shoulder Tap',         'Prancha com Toque no Ombro',               array['Abdômen','Ombros'],                    array['Peso Corporal'],          'intermediate'),
('Plank with Leg Lift',             'Prancha com Elevação de Perna',            array['Abdômen','Glúteos'],                   array['Peso Corporal'],          'intermediate'),
('Extended Plank',                  'Prancha Estendida',                        array['Abdômen','Lombar'],                    array['Peso Corporal'],          'advanced'),
('Weighted Plank',                  'Prancha com Peso',                         array['Abdômen','Lombar'],                    array['Colete','Anilhas'],       'advanced'),
('Star Plank',                      'Prancha Estrela',                          array['Abdômen','Oblíquos'],                  array['Peso Corporal'],          'advanced'),
('Body Saw',                        'Prancha Deslizante (Body Saw)',             array['Abdômen','Lombar'],                    array['Disco','Peso Corporal'],  'advanced'),
('Stir the Pot',                    'Prancha com Rotação (Stir the Pot)',        array['Abdômen'],                             array['Bola Suíça'],             'advanced'),
('Cable Crunch Kneeling',           'Abdominal no Cabo Ajoelhado',              array['Abdômen'],                             array['Cabo'],                   'beginner'),
('Landmine Rotation',               'Rotação no Landmine',                      array['Oblíquos','Abdômen'],                  array['Barra'],                  'intermediate'),
('Landmine Twist',                  'Torção no Landmine',                       array['Oblíquos','Abdômen'],                  array['Barra'],                  'intermediate'),
('Ab Dolly Rollout',                'Abdominal com Carrinho',                   array['Abdômen','Lombar'],                    array['Outros'],                 'advanced'),
('Suitcase Carry',                  'Caminhada Valise',                         array['Oblíquos','Core','Antebraços'],        array['Halteres'],               'intermediate'),
('Offset Carry',                    'Caminhada Assimétrica',                    array['Core','Antebraços'],                   array['Halteres','Kettlebell'],  'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► CARDIO / FUNCIONAL / HIIT
-- ══════════════════════════════════════════════════════════════
('Burpee Pull-up',                  'Burpee com Barra Fixa',                    array['Cardio','Costas','Bíceps'],            array['Barra Fixa'],             'advanced'),
('Burpee Box Jump',                 'Burpee com Salto na Caixa',                array['Cardio','Quadríceps','Glúteos'],       array['Caixa'],                  'advanced'),
('Lateral Box Jump',                'Salto Lateral na Caixa',                   array['Cardio','Quadríceps','Glúteos'],       array['Caixa'],                  'intermediate'),
('Depth Jump',                      'Salto em Profundidade (Depth Jump)',        array['Cardio','Quadríceps','Glúteos'],       array['Caixa'],                  'advanced'),
('Broad Jump',                      'Salto Horizontal (Broad Jump)',             array['Cardio','Quadríceps','Glúteos'],       array['Peso Corporal'],          'intermediate'),
('Single-leg Box Jump',             'Salto Unilateral na Caixa',                array['Cardio','Quadríceps','Glúteos'],       array['Caixa'],                  'advanced'),
('Plyo Push-up',                    'Flexão Pliométrica',                       array['Cardio','Peito','Tríceps'],            array['Peso Corporal'],          'advanced'),
('Clap Push-up',                    'Flexão com Palmas',                        array['Cardio','Peito','Tríceps'],            array['Peso Corporal'],          'advanced'),
('Sprint Intervals',                'Tiro de Velocidade Intervalado',           array['Cardio','Quadríceps','Glúteos'],       array['Peso Corporal'],          'advanced'),
('Hill Sprint',                     'Tiro em Subida',                           array['Cardio','Glúteos','Isquiotibiais'],    array['Peso Corporal'],          'advanced'),
('Shuttle Run',                     'Corrida Shuttle',                          array['Cardio','Quadríceps'],                 array['Peso Corporal'],          'intermediate'),
('Agility Ladder',                  'Escada de Agilidade',                      array['Cardio'],                              array['Escada'],                 'beginner'),
('Cone Drills',                     'Drills com Cones',                         array['Cardio'],                              array['Cones'],                  'intermediate'),
('Speed Skater',                    'Patinador (Speed Skater)',                  array['Cardio','Glúteos','Quadríceps'],       array['Peso Corporal'],          'intermediate'),
('Star Jumps',                      'Saltos Estrela',                           array['Cardio'],                              array['Peso Corporal'],          'intermediate'),
('Jump Rope Double Under',          'Pular Corda Dois Giros',                   array['Cardio','Panturrilhas'],               array['Corda'],                  'advanced'),
('Box Step-up',                     'Subida na Caixa (Step)',                   array['Cardio','Quadríceps','Glúteos'],       array['Caixa'],                  'beginner'),
('Lateral Shuffle',                 'Passada Lateral Rápida',                   array['Cardio','Glúteos','Quadríceps'],       array['Peso Corporal'],          'beginner'),
('Carioca',                         'Carioca (Passada Cruzada Lateral)',        array['Cardio'],                              array['Peso Corporal'],          'intermediate'),
('Butt Kicks',                      'Calcanhar no Glúteo (Corrida)',             array['Cardio','Isquiotibiais'],              array['Peso Corporal'],          'beginner'),
('A-skip',                          'Corrida com Skip A',                       array['Cardio','Quadríceps'],                 array['Peso Corporal'],          'beginner'),
('B-skip',                          'Corrida com Skip B',                       array['Cardio','Isquiotibiais'],              array['Peso Corporal'],          'intermediate'),
('Frog Jump',                       'Salto do Sapo',                            array['Cardio','Quadríceps','Glúteos'],       array['Peso Corporal'],          'intermediate'),
('Seal Jump',                       'Polichinelo com Palmas à Frente',          array['Cardio'],                              array['Peso Corporal'],          'beginner'),
('Cross-body Mountain Climber',     'Escalador Cruzado',                        array['Abdômen','Cardio'],                    array['Peso Corporal'],          'intermediate'),
('Sliding Mountain Climber',        'Escalador com Disco Deslizante',           array['Abdômen','Cardio'],                    array['Disco'],                  'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► LEVANTAMENTO OLÍMPICO
-- ══════════════════════════════════════════════════════════════
('Power Clean',                     'Power Clean',                              array['Glúteos','Quadríceps','Costas','Ombros'],array['Barra'],                'advanced'),
('Hang Power Clean',                'Hang Power Clean',                         array['Glúteos','Costas','Ombros'],            array['Barra'],                  'advanced'),
('Clean and Jerk',                  'Arremesso',                                array['Quadríceps','Glúteos','Ombros','Core'],array['Barra'],                  'advanced'),
('Power Snatch',                    'Arremesso de Potência',                    array['Glúteos','Costas','Ombros'],            array['Barra'],                  'advanced'),
('Hang Power Snatch',               'Arranque de Potência na Pendura',          array['Glúteos','Costas','Ombros'],            array['Barra'],                  'advanced'),
('Hang Clean',                      'Hang Clean (Arremesso na Pendura)',        array['Glúteos','Costas','Ombros'],            array['Barra'],                  'advanced'),
('Romanian Deadlift to Shrug',      'Stiff com Encolhimento',                   array['Isquiotibiais','Trapézio','Glúteos'],  array['Barra'],                  'intermediate'),
('High Pull',                       'Puxada Alta',                              array['Ombros','Trapézio','Glúteos'],          array['Barra'],                  'advanced'),
('Dumbbell Power Clean',            'Power Clean com Haltere',                  array['Glúteos','Ombros','Costas'],            array['Halteres'],               'intermediate'),
('Dumbbell Snatch',                 'Arranque com Haltere',                     array['Glúteos','Ombros','Costas'],            array['Halteres'],               'advanced'),
('Kettlebell High Pull',            'Puxada Alta com Kettlebell',               array['Glúteos','Ombros','Trapézio'],          array['Kettlebell'],             'intermediate'),
('Medicine Ball Clean',             'Clean com Medicine Ball',                  array['Glúteos','Costas','Ombros'],            array['Medicine Ball'],          'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► CROSSFIT / HALTEROFILISMO FUNCIONAL
-- ══════════════════════════════════════════════════════════════
('Wall Ball Shot',                  'Arremesso na Parede com Bola',             array['Quadríceps','Glúteos','Ombros','Cardio'],array['Medicine Ball'],        'intermediate'),
('Double Kettlebell Swing',         'Swing Duplo com Kettlebell',               array['Glúteos','Isquiotibiais','Cardio'],    array['Kettlebell'],             'intermediate'),
('Single-arm Kettlebell Swing',     'Swing Unilateral com Kettlebell',          array['Glúteos','Isquiotibiais','Cardio'],    array['Kettlebell'],             'intermediate'),
('Kettlebell Windmill',             'Moinho de Vento com Kettlebell',           array['Oblíquos','Ombros','Isquiotibiais'],   array['Kettlebell'],             'advanced'),
('Kettlebell Jerk',                 'Jerk com Kettlebell',                      array['Ombros','Quadríceps','Tríceps'],       array['Kettlebell'],             'advanced'),
('Kettlebell Bottoms-up Press',     'Press com Kettlebell Invertido',           array['Ombros','Core'],                       array['Kettlebell'],             'advanced'),
('Loaded Carry',                    'Caminhada com Carga',                      array['Core','Antebraços','Trapézio'],        array['Halteres','Kettlebell'],  'intermediate'),
('Zercher Carry',                   'Caminhada Zercher',                        array['Core','Quadríceps','Bíceps'],          array['Barra'],                  'advanced'),
('Yoke Walk',                       'Caminhada com Jugo (Yoke)',                array['Trapézio','Core','Quadríceps'],        array['Jugo'],                   'advanced'),
('Atlas Stone Lift',                'Levantamento de Pedra Atlas',              array['Costas','Glúteos','Isquiotibiais'],    array['Pedra Atlas'],            'advanced'),
('Log Press',                       'Press com Tora (Log Lift)',                array['Ombros','Tríceps','Core'],             array['Log'],                    'advanced'),
('Axle Deadlift',                   'Terra com Eixo (Axle)',                    array['Costas','Glúteos','Isquiotibiais'],    array['Barra Axle'],             'advanced'),
('Tire Flip',                       'Virar Pneu',                               array['Costas','Glúteos','Quadríceps','Cardio'],array['Pneu'],                 'advanced'),
('Tractor Pull',                    'Puxada de Trator',                         array['Costas','Bíceps','Cardio'],            array['Corda'],                  'advanced'),
('Keg Carry',                       'Carregar Barril',                          array['Core','Antebraços'],                   array['Barril'],                 'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► CALISTENIA / GINÁSTICA
-- ══════════════════════════════════════════════════════════════
('Muscle-up',                       'Muscle-up',                                array['Costas','Peito','Tríceps','Bíceps'],   array['Barra Fixa'],             'advanced'),
('Ring Muscle-up',                  'Muscle-up nos Anéis',                      array['Costas','Peito','Tríceps'],            array['Anéis'],                  'advanced'),
('Front Lever',                     'Alavanca Frontal',                         array['Costas','Abdômen'],                    array['Barra Fixa'],             'advanced'),
('Back Lever',                      'Alavanca Posterior',                       array['Costas','Peito'],                      array['Barra Fixa'],             'advanced'),
('Planche Lean',                    'Inclinação de Plancha',                    array['Ombros','Peito','Abdômen'],            array['Peso Corporal'],          'advanced'),
('Tuck Planche',                    'Plancha Encolhida',                        array['Ombros','Peito','Abdômen'],            array['Peso Corporal','Barras'], 'advanced'),
('Human Flag',                      'Bandeira Humana',                          array['Oblíquos','Costas','Ombros'],          array['Poste'],                  'advanced'),
('Handstand',                       'Apoio Invertido (Handstand)',              array['Ombros','Core'],                       array['Peso Corporal'],          'advanced'),
('Handstand Push-up',               'Flexão Invertida',                         array['Ombros','Tríceps'],                    array['Peso Corporal'],          'advanced'),
('Wall-supported Handstand',        'Apoio Invertido na Parede',                array['Ombros','Core'],                       array['Peso Corporal'],          'intermediate'),
('Box Handstand Push-up',           'Flexão em Apoio Invertido na Caixa',       array['Ombros','Tríceps'],                    array['Caixa'],                  'intermediate'),
('Pike Push-up Feet Elevated',      'Flexão em Pike com Pés Elevados',          array['Ombros','Tríceps'],                    array['Banco'],                  'intermediate'),
('Tuck Front Lever Row',            'Remada na Alavanca Frontal',               array['Costas','Bíceps'],                     array['Barra Fixa'],             'advanced'),
('Ring Row',                        'Remada nos Anéis',                         array['Costas','Bíceps'],                     array['Anéis'],                  'beginner'),
('Ring Push-up Wide',               'Flexão nos Anéis Pegada Aberta',           array['Peito','Ombros'],                      array['Anéis'],                  'intermediate'),
('Australian Pull-up',              'Barra Fixa Horizontal (Australiana)',      array['Costas','Bíceps'],                     array['Barra Fixa'],             'beginner'),
('Bar Dip',                         'Paralela na Barra',                        array['Tríceps','Peito'],                     array['Barra Fixa'],             'intermediate'),
('Korean Dip',                      'Mergulho Coreano',                         array['Tríceps','Ombros'],                    array['Paralela'],               'advanced'),
('Typewriter Pull-up',              'Barra Fixa Tipo Máquina de Escrever',      array['Costas','Bíceps'],                     array['Barra Fixa'],             'advanced'),

-- ══════════════════════════════════════════════════════════════
-- ► ANTEBRAÇOS / PUNHOS / GRIP
-- ══════════════════════════════════════════════════════════════
('Finger Extension',                'Extensão dos Dedos',                       array['Antebraços'],                          array['Elástico'],               'beginner'),
('Finger Curl',                     'Flexão dos Dedos',                         array['Antebraços'],                          array['Barra'],                  'beginner'),
('Radial Deviation',                'Desvio Radial',                            array['Antebraços'],                          array['Halteres'],               'beginner'),
('Ulnar Deviation',                 'Desvio Ulnar',                             array['Antebraços'],                          array['Halteres'],               'beginner'),
('Pronation with Weight',           'Pronação com Peso',                        array['Antebraços'],                          array['Halteres'],               'beginner'),
('Supination with Weight',          'Supinação com Peso',                       array['Antebraços'],                          array['Halteres'],               'beginner'),
('Towel Row',                       'Remada com Toalha',                        array['Antebraços','Costas','Bíceps'],        array['Toalha'],                 'intermediate'),
('Rope Climb Legless',              'Subida na Corda Sem Pernas',               array['Costas','Bíceps','Antebraços'],        array['Corda'],                  'advanced'),
('Pinch Grip Plate Carry',          'Carregar Anilha com Pinça',                array['Antebraços'],                          array['Anilhas'],                'intermediate'),
('Wrist Roller',                    'Rolo de Punho',                            array['Antebraços'],                          array['Rolo'],                   'beginner'),

-- ══════════════════════════════════════════════════════════════
-- ► MOBILIDADE / FLEXIBILIDADE / RECUPERAÇÃO
-- ══════════════════════════════════════════════════════════════
('Hip Flexor Stretch',              'Alongamento do Flexor de Quadril',         array['Isquiotibiais','Quadríceps'],          array['Peso Corporal'],          'beginner'),
('Pigeon Pose',                     'Posição do Pombo (Pigeon Pose)',            array['Glúteos','Quadríceps'],                array['Peso Corporal'],          'beginner'),
('World Greatest Stretch',          'O Maior Alongamento do Mundo',             array['Quadríceps','Isquiotibiais','Costas'], array['Peso Corporal'],          'intermediate'),
('Thoracic Rotation',               'Rotação Torácica',                         array['Costas'],                              array['Peso Corporal'],          'beginner'),
('Ankle Mobility',                  'Mobilidade de Tornozelo',                  array['Panturrilhas'],                        array['Peso Corporal'],          'beginner'),
('Hip 90-90 Stretch',               'Alongamento 90-90 de Quadril',             array['Glúteos','Adutores'],                  array['Peso Corporal'],          'beginner'),
('Couch Stretch',                   'Alongamento do Sofá',                      array['Quadríceps','Flexor de Quadril'],      array['Peso Corporal'],          'intermediate'),
('Lacrosse Ball Pec Release',       'Liberação de Peito com Bola',              array['Peito'],                               array['Bola Lacrosse'],          'beginner'),
('Foam Roll IT Band',               'Rolo de Espuma no IT Band',                array['Quadríceps'],                          array['Rolo de Espuma'],         'beginner'),
('Foam Roll Thoracic',              'Rolo de Espuma Torácico',                  array['Costas'],                              array['Rolo de Espuma'],         'beginner'),
('Box Hip Stretch',                 'Alongamento de Quadril na Caixa',          array['Glúteos','Adutores'],                  array['Caixa'],                  'beginner'),
('Doorway Chest Stretch',           'Alongamento de Peito na Porta',            array['Peito'],                               array['Peso Corporal'],          'beginner'),
('Shoulder Dislocate',              'Dislocação de Ombro com Bastão',           array['Ombros'],                              array['Bastão'],                 'beginner'),
('Jefferson Stretch',               'Alongamento Jefferson',                    array['Costas','Isquiotibiais'],              array['Peso Corporal'],          'beginner'),
('Lizard Pose',                     'Posição do Lagarto',                       array['Quadríceps','Isquiotibiais'],          array['Peso Corporal'],          'beginner'),
('Butterfly Stretch',               'Alongamento Borboleta',                    array['Adutores'],                            array['Peso Corporal'],          'beginner'),
('Standing Quad Stretch',           'Alongamento de Quadríceps em Pé',          array['Quadríceps'],                          array['Peso Corporal'],          'beginner'),
('Standing Hamstring Stretch',      'Alongamento de Isquiotibiais em Pé',       array['Isquiotibiais'],                       array['Peso Corporal'],          'beginner'),
('Seated Twist',                    'Torção Sentado',                           array['Costas','Oblíquos'],                   array['Peso Corporal'],          'beginner'),
('Child Pose',                      'Posição da Criança',                       array['Costas','Lombar'],                     array['Peso Corporal'],          'beginner'),
('Downward Dog',                    'Cão Olhando para Baixo',                   array['Isquiotibiais','Ombros','Panturrilhas'],array['Peso Corporal'],         'beginner'),
('Upward Dog',                      'Cão Olhando para Cima',                    array['Peito','Ombros','Abdômen'],            array['Peso Corporal'],          'beginner'),
('Hip Opener Circle',               'Círculo de Abertura de Quadril',           array['Glúteos','Adutores'],                  array['Peso Corporal'],          'beginner'),

-- ══════════════════════════════════════════════════════════════
-- ► KETTLEBELL — avançados
-- ══════════════════════════════════════════════════════════════
('Kettlebell Lateral Lunge',        'Avanço Lateral com Kettlebell',            array['Quadríceps','Adutores','Glúteos'],     array['Kettlebell'],             'intermediate'),
('Kettlebell Reverse Lunge',        'Avanço Reverso com Kettlebell',            array['Quadríceps','Glúteos'],                array['Kettlebell'],             'beginner'),
('Kettlebell Step-up',              'Subida no Banco com Kettlebell',           array['Quadríceps','Glúteos'],                array['Kettlebell','Banco'],     'intermediate'),
('Double Kettlebell Front Squat',   'Agachamento Frontal Duplo com Kettlebell', array['Quadríceps','Glúteos','Core'],         array['Kettlebell'],             'intermediate'),
('Kettlebell Swing to Press',       'Swing + Press com Kettlebell',             array['Glúteos','Ombros','Isquiotibiais'],    array['Kettlebell'],             'advanced'),
('Alternating Kettlebell Swing',    'Swing Alternado com Kettlebell',           array['Glúteos','Isquiotibiais','Cardio'],    array['Kettlebell'],             'intermediate'),
('Kettlebell Figure 8',             'Figura 8 com Kettlebell',                  array['Core','Glúteos','Cardio'],             array['Kettlebell'],             'intermediate'),
('Kettlebell Halo',                 'Halo com Kettlebell',                      array['Ombros','Core'],                       array['Kettlebell'],             'beginner'),
('Kettlebell Hip Hinge',            'Dobradiça de Quadril com Kettlebell',      array['Glúteos','Isquiotibiais'],             array['Kettlebell'],             'beginner'),
('Kettlebell Sumo High Pull',       'Puxada Alta Sumô com Kettlebell',          array['Glúteos','Ombros','Trapézio'],         array['Kettlebell'],             'intermediate'),
('Kettlebell Arm Bar',              'Arm Bar com Kettlebell',                   array['Ombros','Core'],                       array['Kettlebell'],             'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► MÁQUINAS ESPECÍFICAS
-- ══════════════════════════════════════════════════════════════
('Smith Machine Lunge',             'Avanço no Smith',                          array['Quadríceps','Glúteos'],                array['Smith'],                  'beginner'),
('Smith Machine Romanian Deadlift', 'Stiff no Smith',                           array['Isquiotibiais','Glúteos','Lombar'],    array['Smith'],                  'beginner'),
('Smith Machine Calf Raise',        'Panturrilha no Smith',                     array['Panturrilhas'],                        array['Smith'],                  'beginner'),
('Smith Machine Upright Row',       'Remada Alta no Smith',                     array['Ombros','Trapézio'],                   array['Smith'],                  'beginner'),
('Machine Hip Thrust',              'Elevação Pélvica na Máquina',              array['Glúteos'],                             array['Máquina'],                'beginner'),
('Pec Deck Incline',                'Peck Deck Inclinado',                      array['Peito'],                               array['Máquina'],                'beginner'),
('Machine Row Wide Grip',           'Remada Máquina Pegada Aberta',             array['Costas','Ombros'],                     array['Máquina'],                'beginner'),
('Machine Bicep Curl',              'Rosca Máquina',                            array['Bíceps'],                              array['Máquina'],                'beginner'),
('Machine Tricep Extension',        'Extensão de Tríceps na Máquina',           array['Tríceps'],                             array['Máquina'],                'beginner'),
('Machine Leg Curl',                'Mesa Flexora na Máquina',                  array['Isquiotibiais'],                       array['Máquina'],                'beginner'),
('Machine Leg Extension',           'Extensão de Joelho na Máquina',            array['Quadríceps'],                          array['Máquina'],                'beginner'),
('Machine Seated Calf',             'Panturrilha Sentado na Máquina',           array['Panturrilhas'],                        array['Máquina'],                'beginner'),
('Machine Chest Supported Row',     'Remada Apoiada na Máquina',                array['Costas','Bíceps'],                     array['Máquina'],                'beginner'),
('Cable Hip Flexion',               'Flexão de Quadril no Cabo',                array['Quadríceps','Abdômen'],                array['Cabo'],                   'beginner'),
('Cable Hip Extension',             'Extensão de Quadril no Cabo',              array['Glúteos'],                             array['Cabo'],                   'beginner'),
('Cable Squat',                     'Agachamento no Cabo',                      array['Quadríceps','Glúteos'],                array['Cabo'],                   'beginner'),
('Cable Pull-through Squat',        'Pull-Through + Agachamento no Cabo',       array['Glúteos','Quadríceps','Isquiotibiais'],array['Cabo'],                   'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► ELÁSTICOS / BANDAS
-- ══════════════════════════════════════════════════════════════
('Banded Push-up',                  'Flexão com Elástico',                      array['Peito','Tríceps','Ombros'],            array['Elástico'],               'intermediate'),
('Banded Squat',                    'Agachamento com Elástico',                 array['Quadríceps','Glúteos'],                array['Elástico'],               'beginner'),
('Banded Deadlift',                 'Terra com Elástico',                       array['Glúteos','Isquiotibiais','Costas'],    array['Elástico','Barra'],       'intermediate'),
('Banded Row',                      'Remada com Elástico',                      array['Costas','Bíceps'],                     array['Elástico'],               'beginner'),
('Banded Overhead Press',           'Desenvolvimento com Elástico',             array['Ombros','Tríceps'],                    array['Elástico'],               'beginner'),
('Banded Pull-apart',               'Abertura com Elástico',                    array['Ombros','Trapézio','Costas'],          array['Elástico'],               'beginner'),
('Banded Tricep Extension',         'Extensão de Tríceps com Elástico',         array['Tríceps'],                             array['Elástico'],               'beginner'),
('Banded Bicep Curl',               'Rosca com Elástico',                       array['Bíceps'],                              array['Elástico'],               'beginner'),
('Banded Leg Press',                'Leg Press com Elástico',                   array['Quadríceps','Glúteos'],                array['Elástico'],               'beginner'),
('Banded Hip Thrust',               'Elevação Pélvica com Elástico',            array['Glúteos','Isquiotibiais'],             array['Elástico'],               'beginner'),
('Banded Face Pull',                'Face Pull com Elástico',                   array['Ombros','Trapézio'],                   array['Elástico'],               'beginner'),
('Banded Pallof Press',             'Pallof Press com Elástico',                array['Abdômen','Oblíquos'],                  array['Elástico'],               'intermediate'),
('Banded Good Morning',             'Bom Dia com Elástico',                     array['Lombar','Isquiotibiais'],              array['Elástico'],               'beginner'),
('Banded Hip Circle',               'Círculo de Quadril com Elástico',          array['Glúteos','Abdutores'],                 array['Elástico'],               'beginner'),
('Banded Clamshell',                'Concha com Elástico',                      array['Glúteos','Abdutores'],                 array['Elástico'],               'beginner'),
('Banded Lateral Walk Wide',        'Caminhada Lateral Ampla com Elástico',     array['Glúteos','Abdutores'],                 array['Elástico'],               'beginner'),
('Banded Knee Drive',               'Joelho ao Peito com Elástico',             array['Quadríceps','Abdômen'],                array['Elástico'],               'beginner'),

-- ══════════════════════════════════════════════════════════════
-- ► MEDICINE BALL
-- ══════════════════════════════════════════════════════════════
('Med Ball Overhead Slam',          'Arremesso Overhead de Medicine Ball',      array['Abdômen','Ombros','Cardio'],           array['Medicine Ball'],          'intermediate'),
('Med Ball Chest Pass',             'Passe de Peito com Medicine Ball',         array['Peito','Tríceps','Cardio'],            array['Medicine Ball'],          'intermediate'),
('Med Ball Side Throw',             'Arremesso Lateral de Medicine Ball',       array['Oblíquos','Cardio'],                   array['Medicine Ball'],          'intermediate'),
('Med Ball Rotational Throw',       'Arremesso Rotacional com Medicine Ball',   array['Oblíquos','Abdômen','Cardio'],         array['Medicine Ball'],          'intermediate'),
('Med Ball Squat Press',            'Agachamento + Press com Medicine Ball',    array['Quadríceps','Glúteos','Ombros'],       array['Medicine Ball'],          'intermediate'),
('Med Ball Lunge Press',            'Avanço + Press com Medicine Ball',         array['Quadríceps','Glúteos','Ombros'],       array['Medicine Ball'],          'intermediate'),
('Med Ball Plank',                  'Prancha em Medicine Ball',                 array['Abdômen','Ombros'],                    array['Medicine Ball'],          'intermediate'),
('Med Ball Mountain Climber',       'Escalador em Medicine Ball',               array['Abdômen','Cardio'],                    array['Medicine Ball'],          'intermediate'),
('Med Ball Push-up',                'Flexão em Medicine Ball',                  array['Peito','Tríceps'],                     array['Medicine Ball'],          'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► TRX / SUSPENSÃO
-- ══════════════════════════════════════════════════════════════
('TRX Chest Press',                 'Supino no TRX',                            array['Peito','Tríceps','Ombros'],            array['TRX'],                    'intermediate'),
('TRX Lunge',                       'Avanço no TRX',                            array['Quadríceps','Glúteos'],                array['TRX'],                    'intermediate'),
('TRX Single-leg Squat',            'Agachamento Unilateral no TRX',            array['Quadríceps','Glúteos'],                array['TRX'],                    'intermediate'),
('TRX Atomic Push-up',              'Flexão Atômica no TRX',                    array['Peito','Abdômen','Tríceps'],           array['TRX'],                    'advanced'),
('TRX Plank',                       'Prancha no TRX',                           array['Abdômen'],                             array['TRX'],                    'intermediate'),
('TRX Side Plank',                  'Prancha Lateral no TRX',                   array['Oblíquos'],                            array['TRX'],                    'intermediate'),
('TRX Oblique Crunch',              'Abdominal Oblíquo no TRX',                 array['Oblíquos','Abdômen'],                  array['TRX'],                    'intermediate'),
('TRX Lower Body Circuit',          'Circuito de Membros Inferiores no TRX',    array['Quadríceps','Glúteos','Isquiotibiais'],array['TRX'],                    'intermediate'),
('TRX Y-Pull',                      'Puxada em Y no TRX',                       array['Ombros','Trapézio','Costas'],          array['TRX'],                    'beginner'),
('TRX T-Pull',                      'Puxada em T no TRX',                       array['Costas','Ombros'],                     array['TRX'],                    'beginner'),

-- ══════════════════════════════════════════════════════════════
-- ► PLIOMETRIA / POTÊNCIA
-- ══════════════════════════════════════════════════════════════
('Plyometric Push-up',              'Flexão Pliométrica',                       array['Peito','Tríceps','Cardio'],            array['Peso Corporal'],          'advanced'),
('Plyometric Lunge',                'Avanço Pliométrico',                       array['Quadríceps','Glúteos','Cardio'],       array['Peso Corporal'],          'advanced'),
('Plyometric Squat',                'Agachamento Pliométrico',                  array['Quadríceps','Glúteos','Cardio'],       array['Peso Corporal'],          'advanced'),
('Plyometric Pull-up',              'Barra Fixa Pliométrica',                   array['Costas','Bíceps'],                     array['Barra Fixa'],             'advanced'),
('Drop Push-up',                    'Flexão em Queda',                          array['Peito','Tríceps'],                     array['Caixa'],                  'advanced'),
('Reactive Step-up',                'Subida Reativa',                           array['Quadríceps','Glúteos','Cardio'],       array['Caixa'],                  'intermediate'),
('Bound Jump',                      'Salto com Passada',                        array['Quadríceps','Glúteos','Cardio'],       array['Peso Corporal'],          'intermediate'),
('Single-leg Bound',                'Salto Unilateral com Passada',             array['Quadríceps','Glúteos','Cardio'],       array['Peso Corporal'],          'advanced'),
('Lateral Bound',                   'Salto Lateral',                            array['Glúteos','Quadríceps','Cardio'],       array['Peso Corporal'],          'intermediate'),
('Reactive Calf Jump',              'Salto Reativo de Panturrilha',             array['Panturrilhas','Cardio'],               array['Peso Corporal'],          'intermediate'),

-- ══════════════════════════════════════════════════════════════
-- ► AQUECIMENTO / ATIVAÇÃO
-- ══════════════════════════════════════════════════════════════
('Arm Circle',                      'Círculo de Braços',                        array['Ombros'],                              array['Peso Corporal'],          'beginner'),
('Hip Circle',                      'Círculo de Quadril',                       array['Glúteos','Adutores'],                  array['Peso Corporal'],          'beginner'),
('Leg Swing Forward',               'Balanço de Perna para Frente',             array['Isquiotibiais','Glúteos'],             array['Peso Corporal'],          'beginner'),
('Leg Swing Lateral',               'Balanço de Perna Lateral',                 array['Adutores','Glúteos'],                  array['Peso Corporal'],          'beginner'),
('Ankle Circle',                    'Círculo de Tornozelo',                     array['Panturrilhas'],                        array['Peso Corporal'],          'beginner'),
('Wrist Circle',                    'Círculo de Pulso',                         array['Antebraços'],                          array['Peso Corporal'],          'beginner'),
('Neck Roll',                       'Rotação de Pescoço',                       array['Pescoço'],                             array['Peso Corporal'],          'beginner'),
('Thoracic Extension on Roller',    'Extensão Torácica no Rolo',                array['Costas'],                              array['Rolo de Espuma'],         'beginner'),
('Glute Activation Walk',           'Ativação de Glúteo Caminhando',            array['Glúteos'],                             array['Elástico'],               'beginner'),
('Scapular Wall Slide',             'Deslizamento Escapular na Parede',         array['Ombros','Costas'],                     array['Peso Corporal'],          'beginner'),
('T-spine Rotation',                'Rotação da Coluna Torácica',               array['Costas'],                              array['Peso Corporal'],          'beginner'),
('Spiderman Stretch',               'Alongamento Homem-Aranha',                 array['Quadríceps','Costas','Isquiotibiais'], array['Peso Corporal'],          'beginner'),
('Prone Hip Extension',             'Extensão de Quadril Deitado',              array['Glúteos','Lombar'],                    array['Peso Corporal'],          'beginner'),

-- ══════════════════════════════════════════════════════════════
-- ► PESCOÇO / TRAPÉZIO SUPERIOR
-- ══════════════════════════════════════════════════════════════
('Neck Flexion',                    'Flexão de Pescoço',                        array['Pescoço'],                             array['Peso Corporal'],          'beginner'),
('Neck Extension',                  'Extensão de Pescoço',                      array['Pescoço'],                             array['Peso Corporal'],          'beginner'),
('Neck Lateral Flexion',            'Flexão Lateral de Pescoço',                array['Pescoço'],                             array['Peso Corporal'],          'beginner'),
('Neck Rotation',                   'Rotação de Pescoço',                       array['Pescoço'],                             array['Peso Corporal'],          'beginner'),
('Neck Harness Extension',          'Extensão de Pescoço com Arnês',            array['Pescoço'],                             array['Arnês'],                  'intermediate'),
('Wrestler Bridge',                 'Ponte do Lutador',                         array['Pescoço','Lombar'],                    array['Peso Corporal'],          'advanced'),
('Upper Trap Shrug',                'Encolhimento de Trapézio Superior',        array['Trapézio'],                            array['Halteres'],               'beginner')

) as v(name, name_pt, muscle_groups, equipment, difficulty)
where not exists (
  select 1 from exercises e where e.name = v.name
);
