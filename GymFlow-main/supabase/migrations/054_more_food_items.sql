-- ============================================================
-- GymFlow — Ingredientes adicionais + suplementos
-- Macros por 100g. Suplementos em pó cabem bem no modelo;
-- cápsulas/dragees ficaram de fora (servem por unidade, não g).
-- Idempotente via WHERE NOT EXISTS (name).
-- ============================================================

insert into food_items (name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, is_global)
select v.name, v.kcal, v.prot, v.carb, v.fat, v.category, true
from (values

-- ══════════════════════════════════════════════════════════════
-- ► PROTEÍNAS (cortes e formas adicionais)
-- ══════════════════════════════════════════════════════════════
('Acém moído (cozido)',           215.0, 26.0,  0.0, 12.0, 'proteina'),
('Coxão mole grelhado',           188.0, 30.0,  0.0,  7.0, 'proteina'),
('Maminha grelhada',              225.0, 28.0,  0.0, 12.0, 'proteina'),
('Lagarto cozido',                170.0, 30.0,  0.0,  5.0, 'proteina'),
('Frango (asa sem pele)',         172.0, 30.0,  0.0,  5.5, 'proteina'),
('Frango (coxinha sem pele)',     185.0, 28.0,  0.0,  7.5, 'proteina'),
('Peito de peru defumado',        104.0, 17.0,  3.0,  3.0, 'proteina'),
('Carne seca dessalgada',         226.0, 38.0,  0.0,  8.0, 'proteina'),
('Linguiça de frango grelhada',   175.0, 18.0,  2.0, 10.0, 'proteina'),
('Bacalhau dessalgado cozido',    135.0, 29.0,  0.0,  1.5, 'proteina'),
('Camarão cozido',                 99.0, 24.0,  0.2,  0.3, 'proteina'),
('Polvo cozido',                  164.0, 30.0,  4.4,  2.1, 'proteina'),
('Atum fresco grelhado',          184.0, 30.0,  0.0,  6.0, 'proteina'),
('Sardinha fresca grelhada',      208.0, 25.0,  0.0, 12.0, 'proteina'),
('Tofu firme',                     76.0,  8.0,  1.9,  4.8, 'proteina'),

-- ══════════════════════════════════════════════════════════════
-- ► LATICÍNIOS
-- ══════════════════════════════════════════════════════════════
('Iogurte natural desnatado',      40.0,  4.0,  6.0,  0.1, 'laticinio'),
('Iogurte de proteína (skyr)',     63.0, 11.0,  3.6,  0.2, 'laticinio'),
('Mussarela light',               240.0, 24.0,  3.0, 14.0, 'laticinio'),
('Queijo coalho',                 296.0, 26.0,  2.0, 21.0, 'laticinio'),
('Parmesão ralado',               420.0, 38.0,  3.0, 29.0, 'laticinio'),
('Kefir natural',                  61.0,  3.3,  4.5,  3.5, 'laticinio'),

-- ══════════════════════════════════════════════════════════════
-- ► CARBOIDRATOS
-- ══════════════════════════════════════════════════════════════
('Quinoa cozida',                 120.0,  4.4, 21.0,  1.9, 'carboidrato'),
('Couscous marroquino cozido',    112.0,  3.8, 23.0,  0.2, 'carboidrato'),
('Polenta cozida',                 70.0,  1.6, 15.0,  0.3, 'carboidrato'),
('Cuscuz nordestino (flocão)',    112.0,  2.4, 24.0,  0.8, 'carboidrato'),
('Pão de forma integral',         247.0, 13.0, 41.0,  3.4, 'carboidrato'),
('Pão de queijo (assado)',        330.0,  4.7, 39.0, 16.0, 'carboidrato'),
('Arroz parboilizado cozido',     127.0,  2.7, 27.0,  0.4, 'carboidrato'),
('Farinha de mandioca',           351.0,  1.5, 86.0,  0.3, 'carboidrato'),
('Farinha de aveia',              389.0, 17.0, 66.0,  6.9, 'carboidrato'),
('Granola tradicional',           471.0, 10.0, 64.0, 19.0, 'carboidrato'),
('Feijão branco cozido',          139.0,  9.7, 25.0,  0.4, 'carboidrato'),
('Feijão fradinho cozido',        116.0,  8.0, 21.0,  0.5, 'carboidrato'),
('Ervilha cozida',                 84.0,  5.4, 15.0,  0.4, 'carboidrato'),
('Milho verde cozido',             96.0,  3.4, 21.0,  1.5, 'carboidrato'),
('Edamame (sem vagem)',           122.0, 11.0,  9.9,  5.2, 'carboidrato'),

-- ══════════════════════════════════════════════════════════════
-- ► FRUTAS
-- ══════════════════════════════════════════════════════════════
('Pera',                           57.0,  0.4, 15.0,  0.1, 'fruta'),
('Uva (rubi/itália)',              69.0,  0.7, 18.0,  0.2, 'fruta'),
('Kiwi',                           61.0,  1.1, 15.0,  0.5, 'fruta'),
('Abacaxi',                        50.0,  0.5, 13.0,  0.1, 'fruta'),
('Açaí (polpa pura sem açúcar)',   58.0,  1.0,  6.2,  3.9, 'fruta'),
('Coco fresco',                   354.0,  3.3, 15.0, 33.0, 'fruta'),
('Maracujá (polpa)',               68.0,  2.0, 13.0,  0.7, 'fruta'),
('Tangerina',                      53.0,  0.8, 13.0,  0.3, 'fruta'),
('Goiaba',                         52.0,  1.0, 12.0,  0.6, 'fruta'),
('Frutas vermelhas (mix)',         42.0,  1.0, 10.0,  0.3, 'fruta'),

-- ══════════════════════════════════════════════════════════════
-- ► VEGETAIS
-- ══════════════════════════════════════════════════════════════
('Alface',                         15.0,  1.4,  2.9,  0.2, 'vegetal'),
('Rúcula',                         25.0,  2.6,  3.7,  0.7, 'vegetal'),
('Pepino',                         16.0,  0.7,  3.6,  0.1, 'vegetal'),
('Beterraba cozida',               44.0,  1.7, 10.0,  0.2, 'vegetal'),
('Couve-flor cozida',              23.0,  1.8,  4.1,  0.5, 'vegetal'),
('Repolho cozido',                 23.0,  1.3,  5.5,  0.1, 'vegetal'),
('Berinjela cozida',               35.0,  0.8,  8.6,  0.2, 'vegetal'),
('Pimentão (vermelho cru)',        31.0,  1.0,  6.0,  0.3, 'vegetal'),
('Abóbora cozida',                 26.0,  1.0,  6.5,  0.1, 'vegetal'),
('Chuchu cozido',                  19.0,  0.8,  4.5,  0.1, 'vegetal'),

-- ══════════════════════════════════════════════════════════════
-- ► GORDURAS / SEMENTES
-- ══════════════════════════════════════════════════════════════
('Manteiga sem sal',              717.0,  0.9,  0.1, 81.0, 'gordura'),
('Óleo de coco',                  892.0,  0.0,  0.0,100.0, 'gordura'),
('Nozes',                         654.0, 15.0, 14.0, 65.0, 'gordura'),
('Sementes de chia',              486.0, 17.0, 42.0, 31.0, 'gordura'),
('Sementes de linhaça',           534.0, 18.0, 29.0, 42.0, 'gordura'),
('Sementes de girassol',          584.0, 21.0, 20.0, 51.0, 'gordura'),
('Sementes de abóbora',           559.0, 30.0, 11.0, 49.0, 'gordura'),
('Pasta de amendoim crocante',    594.0, 24.0, 22.0, 51.0, 'gordura'),
('Tahine (pasta de gergelim)',    595.0, 17.0, 21.0, 54.0, 'gordura'),

-- ══════════════════════════════════════════════════════════════
-- ► SUPLEMENTOS EM PÓ (categoria 'suplemento')
-- ══════════════════════════════════════════════════════════════
('Whey protein isolado',          370.0, 90.0,  2.0,  1.0, 'suplemento'),
('Whey protein hidrolisado',      378.0, 88.0,  3.0,  2.0, 'suplemento'),
('Caseína micelar',               372.0, 85.0,  4.0,  2.0, 'suplemento'),
('Proteína vegana (mix)',         365.0, 75.0,  8.0,  6.0, 'suplemento'),
('Albumina em pó',                385.0, 80.0, 10.0,  0.0, 'suplemento'),
('Creatina monohidratada',          0.0,  0.0,  0.0,  0.0, 'suplemento'),
('BCAA em pó',                    280.0, 70.0,  0.0,  0.0, 'suplemento'),
('Glutamina em pó',                 0.0,  0.0,  0.0,  0.0, 'suplemento'),
('Beta-alanina em pó',              0.0,  0.0,  0.0,  0.0, 'suplemento'),
('Hipercalórico (mass gainer)',   380.0, 25.0, 65.0,  3.5, 'suplemento'),
('Maltodextrina',                 380.0,  0.0, 95.0,  0.0, 'suplemento'),
('Dextrose',                      380.0,  0.0, 95.0,  0.0, 'suplemento'),
('Palatinose',                    380.0,  0.0, 95.0,  0.0, 'suplemento'),
('Colágeno hidrolisado',          360.0, 90.0,  0.0,  0.0, 'suplemento'),
('Pré-treino (1 dose ≈ 15g)',     200.0,  5.0, 35.0,  0.5, 'suplemento'),
('Termogênico em pó',              50.0,  2.0,  8.0,  0.5, 'suplemento'),
('Maca peruana em pó',            325.0, 14.0, 71.0,  2.0, 'suplemento'),
('Spirulina em pó',               290.0, 57.0, 24.0,  8.0, 'suplemento')

) as v(name, kcal, prot, carb, fat, category)
where not exists (
  select 1 from food_items fi where fi.name = v.name and fi.is_global = true
);
