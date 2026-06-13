-- ============================================================
-- GymFlow — Cortes de carne + variações de ingredientes comuns
-- Foco: cortes bovinos/suínos/frango que faltavam, formas de preparo
-- (assada/purê/frita) dos carboidratos mais usados em dieta, e
-- staples de despensa. Macros por 100g.
-- Idempotente via WHERE NOT EXISTS (name) — não duplica 053/054/055.
-- ============================================================

insert into food_items (name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, is_global)
select v.name, v.kcal, v.prot, v.carb, v.fat, v.category, true
from (values

-- ══════════════════════════════════════════════════════════════
-- ► CORTES BOVINOS
-- ══════════════════════════════════════════════════════════════
('Contrafilé grelhado',              217.0, 29.0,  0.0, 11.0, 'proteina'),
('Filé mignon grelhado',             201.0, 30.0,  0.0,  9.0, 'proteina'),
('Fraldinha grelhada',               234.0, 27.0,  0.0, 14.0, 'proteina'),
('Coxão duro cozido',                191.0, 31.0,  0.0,  7.5, 'proteina'),
('Músculo bovino cozido',            180.0, 29.0,  0.0,  7.0, 'proteina'),
('Cupim assado',                     330.0, 23.0,  0.0, 27.0, 'proteina'),
('Costela bovina assada',            315.0, 24.0,  0.0, 24.0, 'proteina'),
('Paleta bovina cozida',             215.0, 28.0,  0.0, 11.0, 'proteina'),
('Carne moída (patinho) refogada',   212.0, 27.0,  0.0, 11.0, 'proteina'),
('Hambúrguer caseiro (patinho)',     215.0, 25.0,  1.0, 12.0, 'proteina'),
('Bife de chã de fora grelhado',     205.0, 30.0,  0.0,  9.5, 'proteina'),

-- ══════════════════════════════════════════════════════════════
-- ► CORTES SUÍNOS
-- ══════════════════════════════════════════════════════════════
('Lombo suíno assado',               210.0, 30.0,  0.0, 10.0, 'proteina'),
('Bisteca suína grelhada',           240.0, 27.0,  0.0, 14.0, 'proteina'),
('Pernil suíno assado',              262.0, 27.0,  0.0, 17.0, 'proteina'),
('Filé mignon suíno grelhado',       185.0, 30.0,  0.0,  7.0, 'proteina'),
('Bacon frito',                      541.0, 37.0,  1.4, 42.0, 'proteina'),

-- ══════════════════════════════════════════════════════════════
-- ► FRANGO (variações de corte e preparo)
-- ══════════════════════════════════════════════════════════════
('Peito de frango cru',              120.0, 23.0,  0.0,  2.5, 'proteina'),
('Peito de frango desfiado',         165.0, 31.0,  0.0,  3.6, 'proteina'),
('Coxa de frango com pele assada',   215.0, 24.0,  0.0, 13.0, 'proteina'),
('Sobrecoxa com pele assada',        220.0, 25.0,  0.0, 13.0, 'proteina'),
('Frango a passarinho (assado)',     223.0, 26.0,  0.0, 13.0, 'proteina'),

-- ══════════════════════════════════════════════════════════════
-- ► OVOS (formas de preparo)
-- ══════════════════════════════════════════════════════════════
('Ovo cozido',                       143.0, 13.0,  1.0,  9.5, 'proteina'),
('Ovo mexido (com óleo)',            180.0, 12.0,  1.5, 14.0, 'proteina'),
('Ovo frito',                        196.0, 13.0,  0.8, 15.0, 'proteina'),
('Omelete simples',                  154.0, 11.0,  1.0, 12.0, 'proteina'),

-- ══════════════════════════════════════════════════════════════
-- ► PEIXES POPULARES (preparos extras)
-- ══════════════════════════════════════════════════════════════
('Tilápia assada',                   128.0, 26.0,  0.0,  2.6, 'proteina'),
('Salmão assado',                    206.0, 22.0,  0.0, 13.0, 'proteina'),
('Pintado grelhado',                 110.0, 20.0,  0.0,  3.0, 'proteina'),

-- ══════════════════════════════════════════════════════════════
-- ► BATATAS E TUBÉRCULOS (variações de preparo)
-- ══════════════════════════════════════════════════════════════
('Batata-doce assada',                90.0,  2.0, 21.0,  0.1, 'carboidrato'),
('Batata-doce roxa cozida',           86.0,  1.6, 20.0,  0.1, 'carboidrato'),
('Purê de batata-doce',              110.0,  1.8, 22.0,  2.0, 'carboidrato'),
('Batata inglesa assada',             93.0,  2.5, 21.0,  0.1, 'carboidrato'),
('Purê de batata',                    88.0,  2.0, 15.0,  2.5, 'carboidrato'),
('Batata frita',                     312.0,  3.4, 41.0, 15.0, 'carboidrato'),
('Mandioca frita',                   290.0,  1.4, 41.0, 13.0, 'carboidrato'),
('Nhoque de batata cozido',          160.0,  4.0, 32.0,  1.5, 'carboidrato'),

-- ══════════════════════════════════════════════════════════════
-- ► GRÃOS, MASSAS E PÃES (variações comuns)
-- ══════════════════════════════════════════════════════════════
('Macarrão integral cozido',         124.0,  5.3, 25.0,  1.1, 'carboidrato'),
('Arroz sete grãos cozido',          130.0,  3.5, 26.0,  1.2, 'carboidrato'),
('Pão sírio (pita)',                 275.0,  9.0, 55.0,  1.7, 'carboidrato'),
('Pão de forma branco',              269.0,  8.0, 49.0,  3.6, 'carboidrato'),
('Tortilha de trigo (wrap)',         310.0,  8.0, 50.0,  8.0, 'carboidrato'),
('Bisnaguinha',                      300.0,  8.0, 53.0,  6.0, 'carboidrato'),
('Crepioca (ovo + goma)',            150.0,  8.0, 18.0,  5.0, 'carboidrato'),

-- ══════════════════════════════════════════════════════════════
-- ► LATICÍNIOS (variações de leite/queijo)
-- ══════════════════════════════════════════════════════════════
('Leite integral',                    61.0,  3.2,  4.6,  3.3, 'laticinio'),
('Leite semidesnatado',               45.0,  3.3,  4.8,  1.5, 'laticinio'),
('Requeijão cremoso tradicional',    257.0,  9.0,  4.0, 23.0, 'laticinio'),
('Requeijão cremoso light',          180.0, 10.0,  4.0, 13.0, 'laticinio'),
('Cream cheese light',               200.0,  7.0,  6.0, 16.0, 'laticinio'),
('Queijo prato',                     360.0, 26.0,  1.9, 28.0, 'laticinio'),
('Muçarela',                         300.0, 22.0,  2.2, 22.0, 'laticinio'),

-- ══════════════════════════════════════════════════════════════
-- ► VEGETAIS (mais usados em dieta)
-- ══════════════════════════════════════════════════════════════
('Vagem cozida',                      35.0,  1.8,  7.9,  0.1, 'vegetal'),
('Palmito em conserva',               28.0,  2.5,  4.5,  0.5, 'vegetal'),
('Champignon (cogumelo paris)',       22.0,  3.1,  3.3,  0.3, 'vegetal'),
('Aspargos cozidos',                  22.0,  2.4,  4.1,  0.2, 'vegetal'),
('Couve manteiga crua',               27.0,  2.9,  5.0,  0.4, 'vegetal'),
('Tomate cereja',                     18.0,  0.9,  3.9,  0.2, 'vegetal'),

-- ══════════════════════════════════════════════════════════════
-- ► FRUTAS (variações comuns)
-- ══════════════════════════════════════════════════════════════
('Banana nanica',                     92.0,  1.4, 23.0,  0.1, 'fruta'),
('Banana da terra cozida',           128.0,  1.3, 32.0,  0.4, 'fruta'),
('Melão',                             34.0,  0.8,  8.0,  0.2, 'fruta'),
('Ameixa fresca',                     46.0,  0.7, 11.0,  0.3, 'fruta'),
('Figo',                              74.0,  0.8, 19.0,  0.3, 'fruta'),

-- ══════════════════════════════════════════════════════════════
-- ► GORDURAS / OLEAGINOSAS
-- ══════════════════════════════════════════════════════════════
('Manteiga ghee',                    900.0,  0.0,  0.0,100.0, 'gordura'),
('Amendoim torrado',                 567.0, 26.0, 16.0, 49.0, 'gordura'),
('Avelã',                            628.0, 15.0, 17.0, 61.0, 'gordura')

) as v(name, kcal, prot, carb, fat, category)
where not exists (
  select 1 from food_items fi where fi.name = v.name and fi.is_global = true
);
