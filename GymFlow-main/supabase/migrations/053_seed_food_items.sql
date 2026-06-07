-- ============================================================
-- GymFlow — Seed de ingredientes essenciais (food_items)
-- Macros por 100g (cru ou cozido conforme uso típico no Brasil).
-- Idempotente via WHERE NOT EXISTS (name).
-- ============================================================

insert into food_items (name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, is_global)
select v.name, v.kcal, v.prot, v.carb, v.fat, v.category, true
from (values

-- ── PROTEÍNAS ──────────────────────────────────────────────
('Frango (peito grelhado)',       165.0, 31.0,  0.0,  3.6, 'proteina'),
('Frango (sobrecoxa sem pele)',   170.0, 26.0,  0.0,  7.0, 'proteina'),
('Patinho (cozido)',              190.0, 32.0,  0.0,  6.0, 'proteina'),
('Patinho moído (cru)',           200.0, 21.0,  0.0, 12.0, 'proteina'),
('Alcatra grelhada',              215.0, 30.0,  0.0, 10.0, 'proteina'),
('Picanha grelhada',              290.0, 26.0,  0.0, 20.0, 'proteina'),
('Tilápia grelhada',              130.0, 26.0,  0.0,  2.7, 'proteina'),
('Salmão grelhado',               208.0, 22.0,  0.0, 13.0, 'proteina'),
('Atum em água (drenado)',        116.0, 26.0,  0.0,  1.0, 'proteina'),
('Sardinha em óleo (drenada)',    208.0, 25.0,  0.0, 12.0, 'proteina'),
('Ovo inteiro',                   143.0, 12.6,  0.7,  9.5, 'proteina'),
('Clara de ovo',                   52.0, 11.0,  0.7,  0.2, 'proteina'),

-- ── LATICÍNIOS ────────────────────────────────────────────
('Iogurte natural integral',       61.0,  3.5,  4.7,  3.3, 'laticinio'),
('Iogurte grego natural',          97.0,  9.0,  4.0,  5.0, 'laticinio'),
('Queijo cottage',                 98.0, 11.0,  3.4,  4.3, 'laticinio'),
('Queijo minas frescal',          240.0, 17.0,  3.2, 18.0, 'laticinio'),
('Ricota fresca',                 174.0, 11.0,  3.0, 13.0, 'laticinio'),
('Leite desnatado',                35.0,  3.4,  5.0,  0.1, 'laticinio'),

-- ── CARBOIDRATOS ──────────────────────────────────────────
('Arroz branco cozido',           130.0,  2.7, 28.0,  0.3, 'carboidrato'),
('Arroz integral cozido',         124.0,  2.6, 26.0,  1.0, 'carboidrato'),
('Feijão preto cozido',           132.0,  8.9, 24.0,  0.5, 'carboidrato'),
('Feijão carioca cozido',         132.0,  8.7, 23.0,  0.5, 'carboidrato'),
('Lentilha cozida',               116.0,  9.0, 20.0,  0.4, 'carboidrato'),
('Grão-de-bico cozido',           164.0,  8.9, 27.0,  2.6, 'carboidrato'),
('Batata-doce cozida',             86.0,  1.6, 20.0,  0.1, 'carboidrato'),
('Batata inglesa cozida',          77.0,  2.0, 17.0,  0.1, 'carboidrato'),
('Mandioca cozida',               125.0,  0.8, 30.0,  0.3, 'carboidrato'),
('Macarrão cozido (massa comum)', 158.0,  5.8, 31.0,  0.9, 'carboidrato'),
('Aveia em flocos',               389.0, 16.9, 66.0,  6.9, 'carboidrato'),
('Pão francês',                   300.0,  8.0, 58.0,  3.1, 'carboidrato'),
('Pão integral',                  253.0,  9.0, 43.0,  4.0, 'carboidrato'),
('Tapioca (goma hidratada)',      240.0,  0.2, 60.0,  0.0, 'carboidrato'),

-- ── FRUTAS ────────────────────────────────────────────────
('Banana (prata)',                 98.0,  1.3, 26.0,  0.1, 'fruta'),
('Maçã',                           52.0,  0.3, 14.0,  0.2, 'fruta'),
('Mamão papaia',                   43.0,  0.5, 11.0,  0.3, 'fruta'),
('Laranja',                        47.0,  0.9, 12.0,  0.1, 'fruta'),
('Morango',                        32.0,  0.7,  7.7,  0.3, 'fruta'),
('Manga',                          60.0,  0.8, 15.0,  0.4, 'fruta'),
('Abacate',                       160.0,  2.0,  9.0, 15.0, 'fruta'),
('Melancia',                       30.0,  0.6,  8.0,  0.2, 'fruta'),

-- ── VEGETAIS ──────────────────────────────────────────────
('Brócolis cozido',                35.0,  2.4,  7.0,  0.4, 'vegetal'),
('Couve refogada',                 44.0,  3.0,  6.0,  0.6, 'vegetal'),
('Cenoura crua',                   41.0,  0.9, 10.0,  0.2, 'vegetal'),
('Tomate',                         18.0,  0.9,  3.9,  0.2, 'vegetal'),
('Abobrinha cozida',               17.0,  1.2,  3.1,  0.3, 'vegetal'),
('Espinafre refogado',             23.0,  3.0,  3.6,  0.4, 'vegetal'),

-- ── GORDURAS / OLEAGINOSAS ────────────────────────────────
('Azeite de oliva extra virgem',  884.0,  0.0,  0.0,100.0, 'gordura'),
('Castanha-do-pará',              656.0, 14.3, 12.0, 66.0, 'gordura'),
('Castanha-de-caju',              553.0, 18.0, 30.0, 44.0, 'gordura'),
('Pasta de amendoim integral',    588.0, 25.0, 20.0, 50.0, 'gordura'),
('Amêndoas',                      579.0, 21.0, 22.0, 50.0, 'gordura'),

-- ── SUPLEMENTO ────────────────────────────────────────────
('Whey protein (concentrado)',    380.0, 75.0, 10.0,  5.0, 'suplemento')

) as v(name, kcal, prot, carb, fat, category)
where not exists (
  select 1 from food_items fi where fi.name = v.name and fi.is_global = true
);
