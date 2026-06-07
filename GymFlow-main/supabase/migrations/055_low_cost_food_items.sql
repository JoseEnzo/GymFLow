-- ============================================================
-- GymFlow — Ingredientes populares (low-cost) brasileiros
-- Foco em opções acessíveis: vísceras, cortes econômicos,
-- peixes nacionais baratos, embutidos, féculas, vegetais regionais.
-- Macros por 100g. Idempotente via WHERE NOT EXISTS (name).
-- ============================================================

insert into food_items (name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, is_global)
select v.name, v.kcal, v.prot, v.carb, v.fat, v.category, true
from (values

-- ══════════════════════════════════════════════════════════════
-- ► VÍSCERAS / MIÚDOS (proteína barata e nutritiva)
-- ══════════════════════════════════════════════════════════════
('Fígado bovino grelhado',        191.0, 29.0,  5.0,  5.3, 'proteina'),
('Fígado de frango refogado',     172.0, 25.0,  1.0,  7.0, 'proteina'),
('Moela de frango cozida',        153.0, 30.0,  0.0,  4.0, 'proteina'),
('Coração de frango grelhado',    185.0, 26.0,  0.7,  8.0, 'proteina'),
('Coração bovino cozido',         165.0, 28.0,  0.1,  5.4, 'proteina'),
('Língua bovina cozida',          284.0, 22.0,  4.0, 21.0, 'proteina'),
('Dobradinha (bucho) cozida',     143.0, 14.0,  0.0,  9.0, 'proteina'),
('Mocotó cozido (carne com pele)',135.0, 17.0,  0.0,  7.0, 'proteina'),
('Rabada cozida',                 263.0, 26.0,  0.0, 17.0, 'proteina'),
('Pé de galinha cozido',          215.0, 20.0,  0.2, 15.0, 'proteina'),

-- ══════════════════════════════════════════════════════════════
-- ► OVOS E PEIXES POPULARES
-- ══════════════════════════════════════════════════════════════
('Ovo de codorna cozido',         158.0, 13.0,  0.4, 11.0, 'proteina'),
('Sardinha em conserva (óleo)',   208.0, 25.0,  0.0, 12.0, 'proteina'),
('Sardinha em molho de tomate',   186.0, 21.0,  3.0, 10.0, 'proteina'),
('Cação grelhado',                130.0, 21.0,  0.0,  4.5, 'proteina'),
('Pescada grelhada',              108.0, 21.0,  0.0,  2.5, 'proteina'),
('Tainha grelhada',               160.0, 22.0,  0.0,  7.0, 'proteina'),
('Corvina grelhada',              105.0, 22.0,  0.0,  1.5, 'proteina'),
('Merluza cozida',                 90.0, 19.0,  0.0,  1.0, 'proteina'),
('Atum em óleo (drenado)',        198.0, 29.0,  0.0,  8.0, 'proteina'),

-- ══════════════════════════════════════════════════════════════
-- ► EMBUTIDOS
-- ══════════════════════════════════════════════════════════════
('Mortadela tradicional',         311.0, 16.0,  3.0, 26.0, 'proteina'),
('Salsicha de frango',            199.0, 14.0,  3.0, 14.0, 'proteina'),
('Linguiça calabresa defumada',   307.0, 18.0,  3.0, 25.0, 'proteina'),
('Costelinha de porco assada',    277.0, 26.0,  0.0, 19.0, 'proteina'),
('Presunto cozido',               110.0, 17.0,  2.0,  4.0, 'proteina'),

-- ══════════════════════════════════════════════════════════════
-- ► CARBOIDRATOS / FARINHAS BÁSICAS
-- ══════════════════════════════════════════════════════════════
('Fubá (farinha de milho)',       365.0,  8.0, 79.0,  3.7, 'carboidrato'),
('Polvilho doce',                 343.0,  0.3, 84.0,  0.0, 'carboidrato'),
('Polvilho azedo',                348.0,  0.3, 85.0,  0.0, 'carboidrato'),
('Farinha de trigo refinada',     364.0, 10.0, 76.0,  1.0, 'carboidrato'),
('Farinha de rosca',              395.0, 13.0, 72.0,  5.0, 'carboidrato'),
('Macarrão instantâneo cozido',   188.0,  4.0, 26.0,  7.5, 'carboidrato'),
('Bolacha água e sal',            440.0, 10.0, 71.0, 13.0, 'carboidrato'),
('Bolacha maria',                 432.0,  7.0, 75.0, 12.0, 'carboidrato'),
('Pão de cachorro-quente',        278.0,  8.0, 51.0,  4.0, 'carboidrato'),
('Inhame cozido',                 118.0,  1.5, 28.0,  0.1, 'carboidrato'),
('Cará cozido',                   105.0,  2.0, 24.0,  0.2, 'carboidrato'),
('Mandioquinha (batata-baroa)',    80.0,  1.4, 18.0,  0.3, 'carboidrato'),

-- ══════════════════════════════════════════════════════════════
-- ► VEGETAIS REGIONAIS / BARATOS
-- ══════════════════════════════════════════════════════════════
('Quiabo cozido',                  33.0,  1.9,  7.0,  0.2, 'vegetal'),
('Jiló cozido',                    23.0,  1.0,  4.5,  0.4, 'vegetal'),
('Maxixe cozido',                  18.0,  0.9,  3.6,  0.2, 'vegetal'),
('Taioba refogada',                52.0,  4.2,  9.0,  0.8, 'vegetal'),

-- ══════════════════════════════════════════════════════════════
-- ► FRUTAS DE BAIXO CUSTO
-- ══════════════════════════════════════════════════════════════
('Mamão formosa',                  45.0,  0.5, 11.0,  0.1, 'fruta'),
('Jaca',                           95.0,  1.5, 24.0,  0.6, 'fruta'),
('Caqui',                          71.0,  0.7, 19.0,  0.2, 'fruta'),
('Tâmara seca',                   282.0,  2.5, 75.0,  0.4, 'fruta'),

-- ══════════════════════════════════════════════════════════════
-- ► GORDURAS / DOCES / BÁSICOS DE DESPENSA
-- ══════════════════════════════════════════════════════════════
('Margarina (vegetal)',           596.0,  0.3,  0.7, 66.0, 'gordura'),
('Banha de porco',                900.0,  0.0,  0.0,100.0, 'gordura'),
('Leite em pó integral',          496.0, 26.0, 38.0, 27.0, 'laticinio'),
('Açúcar refinado',               387.0,  0.0,100.0,  0.0, 'carboidrato'),
('Rapadura',                      377.0,  0.4, 95.0,  0.1, 'carboidrato'),
('Melado de cana',                290.0,  0.4, 75.0,  0.1, 'carboidrato'),
('Mel de abelha',                 304.0,  0.3, 82.0,  0.0, 'carboidrato')

) as v(name, kcal, prot, carb, fat, category)
where not exists (
  select 1 from food_items fi where fi.name = v.name and fi.is_global = true
);
