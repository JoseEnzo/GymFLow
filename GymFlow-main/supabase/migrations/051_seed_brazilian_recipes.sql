-- ============================================================
-- GymFlow — Receitas brasileiras regionais (lote 4)
-- Foco em pratos típicos não cobertos pelos seeds 044/046/047.
-- Todas com serving_grams populado pra habilitar toggle de gramas.
-- Idempotente via WHERE NOT EXISTS (name).
-- ============================================================

insert into recipes (name, description, meal_types, calories, protein_g, carbs_g, fat_g, prep_minutes, servings, serving_grams, difficulty, ingredients, tags, is_global)
select v.name, v.description, v.meal_types::meal_type[], v.calories, v.protein_g, v.carbs_g, v.fat_g,
       v.prep_minutes, v.servings, v.serving_grams, v.difficulty::exercise_difficulty, v.ingredients, v.tags, true
from (values

-- ══════════════════════════════════════════════════════════════
-- ► CAFÉ DA MANHÃ / LANCHE
-- ══════════════════════════════════════════════════════════════
('Pão na chapa com ovo',                'Café da manhã de padaria, com pão integral e ovo mexido.', array['cafe_da_manha'],                 320, 16.0, 38.0, 12.0, 10, 1, 180, 'beginner',     array['1 pão francês integral','2 ovos','1 col. requeijão light','Sal'], array['classico','pratico','brasileiro']),
('Beiju recheado de carne seca',        'Tapioca dobrada com carne seca desfiada e cheiro-verde.',  array['cafe_da_manha','lanche_tarde'],  360, 28.0, 36.0, 10.0, 20, 1, 200, 'beginner',     array['2 col. tapioca','80g carne seca dessalgada','Cebola','Coentro'], array['nordestino','regional','sem-gluten']),

-- ══════════════════════════════════════════════════════════════
-- ► ALMOÇO — REGIONAIS
-- ══════════════════════════════════════════════════════════════
('Galinhada goiana fit',                'Arroz amarelo com frango caipira, açafrão e cheiro-verde.', array['almoco'],                       510, 38.0, 58.0, 14.0, 40, 1, 380, 'intermediate', array['100g arroz','150g frango caipira','Açafrão','Cebola','Pimentão','Cheiro-verde'], array['goiano','regional','classico']),
('Arroz carreteiro gaúcho fit',         'Arroz solto com charque magra e pouca gordura.',           array['almoco'],                       480, 34.0, 56.0, 12.0, 35, 1, 360, 'intermediate', array['100g arroz','120g charque dessalgada','Cebola','Alho','Cheiro-verde'], array['gaucho','regional']),
('Carne de sol com baião de dois',      'Carne de sol grelhada + feijão-de-corda + queijo coalho.', array['almoco'],                       540, 38.0, 52.0, 18.0, 40, 1, 400, 'intermediate', array['150g carne de sol','Feijão de corda','100g arroz integral','Queijo coalho','Cebola'], array['nordestino','regional','classico']),
('Picadinho carioca fit',               'Carne em cubos com tomate, servida com arroz e ovo.',      array['almoco'],                       500, 36.0, 48.0, 16.0, 30, 1, 380, 'intermediate', array['150g patinho em cubos','100g arroz','1 ovo','Tomate','Cebola','Salsinha'], array['carioca','regional','classico']),
('Frango com quiabo mineiro',           'Frango caipira refogado com quiabo e angu de fubá.',       array['almoco'],                       490, 38.0, 44.0, 16.0, 45, 1, 400, 'intermediate', array['150g frango caipira','200g quiabo','80g fubá','Cebola','Alho','Tomate'], array['mineiro','regional']),
('Acarajé baiano de forno',             'Bolinho de feijão-fradinho assado com vatapá leve.',       array['almoco','lanche_tarde'],         380, 22.0, 42.0, 14.0, 50, 1, 220, 'advanced',     array['Feijão-fradinho','Camarão seco','Cebola','Pimenta','Vatapá light'], array['baiano','regional','assado']),
('Maniçoba paraense fit',               'Folhas de mandioca cozidas com cortes magros de porco.',   array['almoco'],                       460, 32.0, 30.0, 22.0, 90, 1, 380, 'advanced',     array['Folhas de mandioca','120g lombo','Feijão preto','Cebola','Alho'], array['paraense','regional','tradicional']),
('Tacacá paraense leve',                'Caldo de tucupi com goma de tapioca, jambu e camarão.',    array['almoco','jantar'],               280, 18.0, 32.0,  6.0, 30, 1, 350, 'intermediate', array['Tucupi','Goma de tapioca','Jambu','Camarão seco'], array['paraense','regional','low-cal']),
('Caldeirada de peixe baiana',          'Ensopado de peixe com leite de coco light e dendê comedido.', array['almoco','jantar'],            420, 32.0, 28.0, 18.0, 40, 1, 380, 'intermediate', array['150g pescada','Leite de coco light','Tomate','Pimentão','Coentro','Dendê'], array['baiano','regional','frutos-do-mar']),
('Pirarucu grelhado amazônico',         'Peixe nobre da Amazônia com farinha d''água e banana.',    array['almoco','jantar'],               420, 38.0, 36.0, 12.0, 25, 1, 380, 'intermediate', array['150g pirarucu','Farinha d''água','Banana-da-terra','Limão','Cebola'], array['amazonico','regional']),
('Caruru baiano fit',                   'Quiabo refogado com camarão e castanha-de-caju moída.',    array['almoco','jantar'],               360, 24.0, 22.0, 18.0, 30, 1, 320, 'intermediate', array['250g quiabo','100g camarão','Castanha-de-caju','Dendê','Cebola'], array['baiano','regional']),
('Bobó leve de frango',                 'Versão com frango no lugar de camarão, creme de mandioca.', array['almoco','jantar'],              440, 32.0, 38.0, 16.0, 45, 1, 400, 'intermediate', array['150g frango','250g mandioca cozida','Leite de coco light','Coentro','Cebola'], array['baiano','regional']),
('Bife à rolê de patinho',              'Bife enrolado com cenoura, bacon magro e palmito.',        array['almoco','jantar'],               450, 36.0, 28.0, 18.0, 50, 1, 320, 'intermediate', array['150g patinho','Cenoura','Bacon magro','Palmito','Molho de tomate'], array['classico','brasileiro']),
('Vaca atolada fit',                    'Costela bovina magra cozida com mandioca, baixa gordura.', array['almoco'],                        510, 38.0, 42.0, 20.0, 90, 1, 400, 'advanced',     array['150g costela magra','250g mandioca','Cebola','Alho','Cheiro-verde'], array['mineiro','regional','meal-prep']),

-- ══════════════════════════════════════════════════════════════
-- ► LANCHE / PETISCO
-- ══════════════════════════════════════════════════════════════
('Bolinho de bacalhau assado',          'Versão de forno do clássico português brasileirado.',     array['lanche_tarde'],                  180, 14.0, 18.0,  6.0, 30, 4, 60,  'intermediate', array['Bacalhau dessalgado','Batata cozida','Salsinha','Ovo'], array['assado','petisco']),
('Pamonha salgada de frango',           'Pamonha cremosa de milho recheada com frango desfiado.',   array['lanche_tarde','almoco'],         320, 18.0, 42.0, 10.0, 50, 1, 250, 'advanced',     array['Milho verde','80g frango desfiado','Queijo minas','Leite de coco light'], array['regional','goiano']),
('Cuscuz paulista de sardinha',         'Cuscuz colorido com sardinha, ovo e ervilha.',            array['almoco','lanche_tarde'],         410, 28.0, 38.0, 14.0, 40, 1, 320, 'intermediate', array['Farinha de milho','1 lata sardinha','2 ovos','Ervilha','Pimentão','Tomate'], array['paulista','regional','pratico']),
('Caldo de mocotó tradicional',         'Caldo gelatinoso de mocotó com legumes e cheiro-verde.',  array['jantar','ceia'],                 280, 22.0, 18.0, 12.0, 90, 1, 320, 'advanced',     array['Mocotó','Cebola','Cenoura','Cheiro-verde','Pimenta'], array['regional','classico','colageno']),

-- ══════════════════════════════════════════════════════════════
-- ► DOCES FIT / SOBREMESAS
-- ══════════════════════════════════════════════════════════════
('Quindim fit de microondas',           'Versão sem açúcar com adoçante e gema reduzida.',         array['ceia','lanche_tarde'],           160,  6.0, 14.0,  9.0,  8, 1, 80,  'beginner',     array['2 gemas','30g coco ralado','Adoçante culinário','Essência de baunilha'], array['doce','sem-acucar','baiano']),
('Cocada cremosa de forno',             'Coco ralado com leite condensado light, sem açúcar.',     array['ceia','lanche_tarde'],           180,  4.0, 18.0,  9.0, 20, 4, 50,  'beginner',     array['100g coco ralado','Leite condensado light','1 gema'], array['doce','sem-acucar','nordestino']),
('Brigadeiro proteico de banana',       'Massa de banana e cacau, sem açúcar, com whey.',          array['ceia','pos_treino'],             120,  8.0, 18.0,  3.0,  5, 4, 40,  'beginner',     array['1 banana','1 scoop whey chocolate','1 col. cacau em pó','Coco ralado'], array['doce','sem-acucar','pos-treino']),
('Mousse de maracujá fit',              'Mousse leve com iogurte grego e gelatina, sem açúcar.',   array['ceia','lanche_tarde'],           140,  9.0, 14.0,  4.0, 15, 4, 100, 'beginner',     array['Polpa de maracujá','Iogurte grego','Gelatina sem sabor','Adoçante'], array['doce','sem-acucar']),
('Bolo de fubá com erva-doce',          'Bolo caseiro de fubá com adoçante e leite desnatado.',    array['lanche_tarde','cafe_da_manha'],  210,  6.0, 30.0,  7.0, 50, 8, 80,  'intermediate', array['100g fubá','60g farinha integral','Leite desnatado','Erva-doce','Adoçante','3 ovos'], array['doce','classico','caseiro']),

-- ══════════════════════════════════════════════════════════════
-- ► BEBIDA REGIONAL
-- ══════════════════════════════════════════════════════════════
('Suco de cajá-manga natural',          'Suco tropical do nordeste, sem açúcar adicionado.',       array['cafe_da_manha','lanche_manha'],   80,  1.0, 18.0,  0.5,  5, 1, 250, 'beginner',     array['Polpa de cajá-manga','Água','Gelo','Hortelã'], array['bebida','nordestino','sem-acucar'])

) as v(name, description, meal_types, calories, protein_g, carbs_g, fat_g, prep_minutes, servings, serving_grams, difficulty, ingredients, tags)
where not exists (
  select 1 from recipes r where r.name = v.name and r.is_global = true
);
