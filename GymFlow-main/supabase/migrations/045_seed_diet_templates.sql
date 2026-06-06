-- ============================================================
-- GymFlow — Dietas prontas (templates globais)
-- O personal pode usar uma dieta pronta como base ao criar o
-- plano alimentar de um aluno (paralelo a workout_sheet_templates).
-- Idempotente: templates por nome, itens por (template, receita, refeição).
-- ============================================================

-- ── Templates ──────────────────────────────────────────────
insert into diet_templates (name, goal, description, daily_calories, level, tags)
select v.name, v.goal, v.description, v.daily_calories, v.level, v.tags
from (values
  ('Cutting 1800 kcal',        'Emagrecimento', 'Déficit calórico moderado com alta proteína para preservar massa magra.', 1800, 'Intermediário', array['emagrecimento','alto-em-proteina']),
  ('Hipertrofia 3000 kcal',    'Hipertrofia',   'Superávit calórico com 6 refeições para ganho de massa muscular.',        3000, 'Avançado',      array['bulking','ganho-de-massa']),
  ('Low Carb',                 'Emagrecimento', 'Baixo carboidrato e gorduras boas para definição e saciedade.',           1600, 'Intermediário', array['low-carb','emagrecimento']),
  ('Manutenção Equilibrada',   'Manutenção',    'Macros balanceados para manter peso e performance no dia a dia.',         2200, 'Iniciante',     array['manutencao','equilibrado']),
  ('Vegetariano Fit',          'Manutenção',    'Plano sem carnes, com proteína vegetal e bom aporte de fibras.',          2000, 'Intermediário', array['vegetariano','proteina-vegetal']),
  ('Definição Avançada',       'Emagrecimento', 'Déficit agressivo para fase final de definição, alta proteína.',          1500, 'Avançado',      array['definicao','cutting']),
  ('Bulking Limpo',            'Hipertrofia',   'Ganho de massa com alimentos limpos e timing pré/pós-treino.',            3200, 'Intermediário', array['bulking','clean']),
  ('Prático 4 Refeições',      'Manutenção',    'Rotina enxuta de 4 refeições para quem tem pouco tempo.',                 2000, 'Iniciante',     array['pratico','rotina-corrida'])
) as v(name, goal, description, daily_calories, level, tags)
where not exists (select 1 from diet_templates t where t.name = v.name);

-- ── Helper: insere itens de um template referenciando receitas por nome ──
-- Cada bloco é idempotente via NOT EXISTS.

-- 1) Cutting 1800 kcal
insert into diet_template_items (template_id, recipe_id, meal_type, order_index, servings)
select t.id, r.id, x.meal_type::meal_type, x.ord, x.serv
from diet_templates t
cross join (values
  ('cafe_da_manha','Omelete de claras com espinafre',0,1.0),
  ('lanche_manha', 'Maçã com pasta de amendoim',0,1.0),
  ('almoco',       'Frango grelhado com arroz e brócolis',0,1.0),
  ('lanche_tarde', 'Iogurte proteico com frutas vermelhas',0,1.0),
  ('jantar',       'Tilápia grelhada com purê de abóbora',0,1.0),
  ('ceia',         'Queijo cottage com canela',0,1.0)
) as x(meal_type, recipe_name, ord, serv)
join recipes r on r.name = x.recipe_name and r.is_global = true
where t.name = 'Cutting 1800 kcal'
and not exists (select 1 from diet_template_items i where i.template_id = t.id and i.recipe_id = r.id and i.meal_type = x.meal_type::meal_type);

-- 2) Hipertrofia 3000 kcal
insert into diet_template_items (template_id, recipe_id, meal_type, order_index, servings)
select t.id, r.id, x.meal_type::meal_type, x.ord, x.serv
from diet_templates t
cross join (values
  ('cafe_da_manha','Ovos mexidos com aveia',0,1.0),
  ('cafe_da_manha','Vitamina de banana e amendoim',1,1.0),
  ('lanche_manha', 'Sanduíche natural de frango',0,1.0),
  ('almoco',       'Patinho moído com batata-doce',0,1.0),
  ('pre_treino',   'Overnight oats proteico',0,1.0),
  ('pos_treino',   'Shake de whey com banana',0,1.0),
  ('jantar',       'Macarrão integral à bolonhesa magra',0,1.0),
  ('ceia',         'Caseína com pasta de amendoim',0,1.0)
) as x(meal_type, recipe_name, ord, serv)
join recipes r on r.name = x.recipe_name and r.is_global = true
where t.name = 'Hipertrofia 3000 kcal'
and not exists (select 1 from diet_template_items i where i.template_id = t.id and i.recipe_id = r.id and i.meal_type = x.meal_type::meal_type);

-- 3) Low Carb
insert into diet_template_items (template_id, recipe_id, meal_type, order_index, servings)
select t.id, r.id, x.meal_type::meal_type, x.ord, x.serv
from diet_templates t
cross join (values
  ('cafe_da_manha','Omelete de claras com espinafre',0,1.0),
  ('lanche_manha', 'Mix de castanhas',0,1.0),
  ('almoco',       'Salmão ao forno com legumes',0,1.0),
  ('lanche_tarde', 'Queijo cottage com tomate',0,1.0),
  ('jantar',       'Omelete recheado de frango e queijo',0,1.0),
  ('ceia',         'Caseína com pasta de amendoim',0,1.0)
) as x(meal_type, recipe_name, ord, serv)
join recipes r on r.name = x.recipe_name and r.is_global = true
where t.name = 'Low Carb'
and not exists (select 1 from diet_template_items i where i.template_id = t.id and i.recipe_id = r.id and i.meal_type = x.meal_type::meal_type);

-- 4) Manutenção Equilibrada
insert into diet_template_items (template_id, recipe_id, meal_type, order_index, servings)
select t.id, r.id, x.meal_type::meal_type, x.ord, x.serv
from diet_templates t
cross join (values
  ('cafe_da_manha','Pão integral com ovo e abacate',0,1.0),
  ('lanche_manha', 'Iogurte natural com granola e mel',0,1.0),
  ('almoco',       'Bife de patinho com salada e arroz',0,1.0),
  ('lanche_tarde', 'Sanduíche natural de frango',0,1.0),
  ('jantar',       'Sopa de legumes com frango',0,1.0),
  ('ceia',         'Iogurte natural com chia',0,1.0)
) as x(meal_type, recipe_name, ord, serv)
join recipes r on r.name = x.recipe_name and r.is_global = true
where t.name = 'Manutenção Equilibrada'
and not exists (select 1 from diet_template_items i where i.template_id = t.id and i.recipe_id = r.id and i.meal_type = x.meal_type::meal_type);

-- 5) Vegetariano Fit
insert into diet_template_items (template_id, recipe_id, meal_type, order_index, servings)
select t.id, r.id, x.meal_type::meal_type, x.ord, x.serv
from diet_templates t
cross join (values
  ('cafe_da_manha','Mingau de aveia com frutas',0,1.0),
  ('cafe_da_manha','Smoothie verde detox',1,1.0),
  ('lanche_manha', 'Mix de castanhas',0,1.0),
  ('almoco',       'Salada de quinoa com legumes',0,1.0),
  ('lanche_tarde', 'Pipoca de panela sem óleo',0,1.0),
  ('jantar',       'Berinjela à parmegiana fit',0,1.0),
  ('ceia',         'Iogurte natural com chia',0,1.0)
) as x(meal_type, recipe_name, ord, serv)
join recipes r on r.name = x.recipe_name and r.is_global = true
where t.name = 'Vegetariano Fit'
and not exists (select 1 from diet_template_items i where i.template_id = t.id and i.recipe_id = r.id and i.meal_type = x.meal_type::meal_type);

-- 6) Definição Avançada
insert into diet_template_items (template_id, recipe_id, meal_type, order_index, servings)
select t.id, r.id, x.meal_type::meal_type, x.ord, x.serv
from diet_templates t
cross join (values
  ('cafe_da_manha','Omelete de claras com espinafre',0,1.0),
  ('lanche_manha', 'Ovos cozidos com sal',0,1.0),
  ('almoco',       'Tilápia grelhada com purê de abóbora',0,1.0),
  ('lanche_tarde', 'Queijo cottage com tomate',0,1.0),
  ('pos_treino',   'Shake de whey com banana',0,1.0),
  ('jantar',       'Salada completa com atum',0,1.0),
  ('ceia',         'Queijo cottage com canela',0,1.0)
) as x(meal_type, recipe_name, ord, serv)
join recipes r on r.name = x.recipe_name and r.is_global = true
where t.name = 'Definição Avançada'
and not exists (select 1 from diet_template_items i where i.template_id = t.id and i.recipe_id = r.id and i.meal_type = x.meal_type::meal_type);

-- 7) Bulking Limpo
insert into diet_template_items (template_id, recipe_id, meal_type, order_index, servings)
select t.id, r.id, x.meal_type::meal_type, x.ord, x.serv
from diet_templates t
cross join (values
  ('cafe_da_manha','Ovos mexidos com aveia',0,1.0),
  ('lanche_manha', 'Vitamina de banana e amendoim',0,1.0),
  ('almoco',       'Escondidinho de frango com mandioca',0,1.0),
  ('pre_treino',   'Café preto com pão de batata-doce',0,1.0),
  ('pos_treino',   'Batata-doce com frango pós-treino',0,1.0),
  ('jantar',       'Carne de panela com legumes',0,1.0),
  ('ceia',         'Caseína com pasta de amendoim',0,1.0)
) as x(meal_type, recipe_name, ord, serv)
join recipes r on r.name = x.recipe_name and r.is_global = true
where t.name = 'Bulking Limpo'
and not exists (select 1 from diet_template_items i where i.template_id = t.id and i.recipe_id = r.id and i.meal_type = x.meal_type::meal_type);

-- 8) Prático 4 Refeições
insert into diet_template_items (template_id, recipe_id, meal_type, order_index, servings)
select t.id, r.id, x.meal_type::meal_type, x.ord, x.serv
from diet_templates t
cross join (values
  ('cafe_da_manha','Crepioca recheada com queijo',0,1.0),
  ('almoco',       'Frango xadrez com legumes',0,1.0),
  ('lanche_tarde', 'Wrap integral de frango',0,1.0),
  ('jantar',       'Filé de frango com legumes na air fryer',0,1.0)
) as x(meal_type, recipe_name, ord, serv)
join recipes r on r.name = x.recipe_name and r.is_global = true
where t.name = 'Prático 4 Refeições'
and not exists (select 1 from diet_template_items i where i.template_id = t.id and i.recipe_id = r.id and i.meal_type = x.meal_type::meal_type);
