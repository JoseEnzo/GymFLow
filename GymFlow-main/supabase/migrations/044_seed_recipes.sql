-- ============================================================
-- GymFlow — Catálogo massivo de receitas globais
-- Idempotente via WHERE NOT EXISTS (name)
-- Macros são por porção (servings = 1, salvo indicado).
-- ============================================================

insert into recipes (name, description, meal_types, calories, protein_g, carbs_g, fat_g, prep_minutes, servings, difficulty, ingredients, tags, is_global)
select v.name, v.description, v.meal_types::meal_type[], v.calories, v.protein_g, v.carbs_g, v.fat_g,
       v.prep_minutes, v.servings, v.difficulty::exercise_difficulty, v.ingredients, v.tags, true
from (values

-- ══════════════════════════════════════════════════════════════
-- ► CAFÉ DA MANHÃ
-- ══════════════════════════════════════════════════════════════
('Ovos mexidos com aveia',            'Clássico proteico para começar o dia com energia.',     array['cafe_da_manha','pre_treino'], 320, 24.0, 28.0, 12.0,  8, 1, 'beginner', array['3 ovos','30g de aveia','1 fio de azeite','Sal e pimenta'], array['alto-em-proteina']),
('Panqueca de banana e aveia',        'Massa simples sem farinha, fofinha e nutritiva.',       array['cafe_da_manha'],              290, 14.0, 42.0,  7.0, 12, 1, 'beginner', array['1 banana','2 ovos','40g de aveia','Canela'], array['sem-acucar']),
('Tapioca com frango desfiado',       'Recheio magro e saciante, leve e sem glúten.',          array['cafe_da_manha','lanche_tarde'], 310, 26.0, 34.0,  6.0, 15, 1, 'beginner', array['2 col. tapioca','80g frango desfiado','Tempero a gosto'], array['sem-gluten','alto-em-proteina']),
('Iogurte natural com granola e mel', 'Combinação de probióticos, fibras e energia rápida.',   array['cafe_da_manha','lanche_manha'], 260, 12.0, 38.0,  6.0,  3, 1, 'beginner', array['170g iogurte natural','30g granola','1 col. mel'], array['probiotico']),
('Crepioca recheada com queijo',      'Mistura de tapioca e ovo, prática e proteica.',         array['cafe_da_manha'],              280, 18.0, 24.0, 12.0, 10, 1, 'beginner', array['2 col. tapioca','2 ovos','1 fatia queijo minas'], array['sem-gluten']),
('Vitamina de banana e amendoim',     'Shake cremoso e calórico, ótimo pré-treino.',           array['cafe_da_manha','pre_treino'], 380, 16.0, 48.0, 14.0,  5, 1, 'beginner', array['1 banana','200ml leite','1 col. pasta de amendoim','Gelo'], array['energetico']),
('Pão integral com ovo e abacate',    'Gorduras boas e proteína para saciedade prolongada.',   array['cafe_da_manha'],              340, 16.0, 30.0, 18.0,  8, 1, 'beginner', array['2 fatias pão integral','2 ovos','1/2 abacate'], array['gordura-boa']),
('Mingau de aveia com frutas',        'Conforto morno, rico em fibras solúveis.',              array['cafe_da_manha'],              300, 11.0, 50.0,  6.0, 10, 1, 'beginner', array['50g aveia','200ml leite','1/2 banana','Frutas vermelhas'], array['rico-em-fibras']),
('Omelete de claras com espinafre',   'Baixa em gordura, ideal para definição.',               array['cafe_da_manha'],              180, 22.0,  4.0,  8.0, 10, 1, 'beginner', array['4 claras','1 ovo inteiro','Punhado de espinafre'], array['low-carb','alto-em-proteina']),
('Smoothie verde detox',              'Leve, hidratante e cheio de micronutrientes.',          array['cafe_da_manha','lanche_manha'], 160,  5.0, 30.0,  3.0,  5, 1, 'beginner', array['1 maçã','Couve','Gengibre','200ml água de coco'], array['detox','vegano']),
('Cuscuz nordestino com ovo',         'Carboidrato de baixo índice, prático no microondas.',   array['cafe_da_manha'],              310, 14.0, 44.0,  8.0, 12, 1, 'beginner', array['80g flocão de milho','2 ovos','Sal'], array['sem-gluten']),

-- ══════════════════════════════════════════════════════════════
-- ► ALMOÇO
-- ══════════════════════════════════════════════════════════════
('Frango grelhado com arroz e brócolis', 'Prato fitness clássico: proteína magra e fibras.',   array['almoco','jantar'],            450, 40.0, 45.0, 10.0, 25, 1, 'beginner', array['150g peito de frango','100g arroz integral','Brócolis','Azeite'], array['classico-fit','alto-em-proteina']),
('Patinho moído com batata-doce',     'Carne magra e carbo complexo para ganho de massa.',     array['almoco','jantar'],            480, 38.0, 50.0, 12.0, 30, 1, 'beginner', array['150g patinho moído','200g batata-doce','Tempero'], array['bulking']),
('Salmão ao forno com legumes',       'Ômega-3 e proteína nobre, baixo carbo.',                array['almoco','jantar'],            420, 34.0, 12.0, 26.0, 25, 1, 'intermediate', array['150g salmão','Abobrinha','Cenoura','Azeite','Limão'], array['omega-3','low-carb']),
('Strogonoff fit de frango',          'Versão leve com iogurte no lugar do creme de leite.',   array['almoco','jantar'],            430, 36.0, 30.0, 16.0, 30, 1, 'intermediate', array['150g frango','Iogurte natural','Champignon','Mostarda','Arroz'], array['alto-em-proteina']),
('Escondidinho de frango com mandioca','Comfort food proteico e reconfortante.',               array['almoco','jantar'],            470, 34.0, 48.0, 14.0, 40, 1, 'intermediate', array['150g frango desfiado','250g mandioca','Requeijão light'], array['comfort']),
('Tilápia grelhada com purê de abóbora','Peixe branco leve com carbo de baixa caloria.',       array['almoco','jantar'],            360, 32.0, 28.0,  9.0, 25, 1, 'beginner', array['150g tilápia','200g abóbora','Azeite','Salsinha'], array['low-cal']),
('Bife de patinho com salada e arroz','Refeição completa e econômica do dia a dia.',           array['almoco'],                     460, 38.0, 42.0, 14.0, 20, 1, 'beginner', array['150g patinho','100g arroz','Salada verde','Tomate'], array['classico-fit']),
('Macarrão integral à bolonhesa magra','Carbo + proteína para dias de treino intenso.',        array['almoco'],                     520, 32.0, 62.0, 14.0, 30, 1, 'intermediate', array['100g macarrão integral','120g patinho moído','Molho de tomate'], array['bulking']),
('Quibe assado de carne magra',       'Trigo + proteína, assado em vez de frito.',             array['almoco','jantar'],            400, 30.0, 38.0, 13.0, 35, 1, 'intermediate', array['Trigo para quibe','150g patinho moído','Hortelã','Cebola'], array['assado']),
('Frango xadrez com legumes',         'Salteado colorido, rápido e equilibrado.',              array['almoco','jantar'],            410, 35.0, 36.0, 12.0, 20, 1, 'intermediate', array['150g frango em cubos','Pimentões','Cebola','Shoyu','Arroz'], array['rapido']),
('Feijoada light de feijão preto',    'Versão magra com cortes magros e muita salada.',        array['almoco'],                     500, 34.0, 52.0, 16.0, 50, 1, 'advanced', array['Feijão preto','Lombo magro','Couve','Laranja','Arroz'], array['tradicional']),
('Carne de panela com legumes',       'Cozido lento e suculento, ótimo para meal prep.',       array['almoco','jantar'],            450, 36.0, 30.0, 18.0, 60, 1, 'intermediate', array['150g acém','Batata','Cenoura','Tomate'], array['meal-prep']),
('Salada completa com atum',          'Refeição fria, prática e rica em proteína.',            array['almoco','jantar'],            330, 30.0, 18.0, 14.0, 10, 1, 'beginner', array['1 lata atum','Folhas verdes','Grão-de-bico','Azeite'], array['low-carb','pratico']),
('Risoto fit de frango e ervilha',    'Cremoso usando caldo magro, sem manteiga.',             array['almoco'],                     440, 30.0, 54.0, 10.0, 35, 1, 'advanced', array['100g arroz arbóreo','120g frango','Ervilha','Caldo de legumes'], array['cremoso']),

-- ══════════════════════════════════════════════════════════════
-- ► JANTAR
-- ══════════════════════════════════════════════════════════════
('Omelete recheado de frango e queijo','Jantar rápido low-carb e saciante.',                   array['jantar'],                     350, 32.0, 6.0,  22.0, 15, 1, 'beginner', array['3 ovos','80g frango desfiado','Queijo','Tomate'], array['low-carb']),
('Sopa de legumes com frango',        'Reconfortante e leve para a noite.',                    array['jantar','ceia'],              280, 26.0, 22.0,  9.0, 35, 1, 'beginner', array['120g frango','Abobrinha','Cenoura','Chuchu','Caldo'], array['low-cal']),
('Wrap integral de frango',           'Prático para a noite, equilibrado em macros.',          array['jantar','lanche_tarde'],      380, 28.0, 36.0, 14.0, 12, 1, 'beginner', array['1 tortilha integral','100g frango','Alface','Cenoura','Iogurte'], array['pratico']),
('Abobrinha recheada com carne moída','Casca de abobrinha como prato, baixo carbo.',           array['jantar'],                     340, 30.0, 14.0, 18.0, 35, 1, 'intermediate', array['1 abobrinha','120g patinho moído','Molho de tomate','Queijo'], array['low-carb']),
('Salada de quinoa com legumes',      'Proteína vegetal completa, leve e fria.',               array['jantar','almoco'],            360, 14.0, 48.0, 12.0, 20, 1, 'beginner', array['80g quinoa','Pepino','Tomate','Grão-de-bico','Limão'], array['vegano','proteina-vegetal']),
('Berinjela à parmegiana fit',        'Assada com pouco queijo, sem fritura.',                 array['jantar'],                     320, 18.0, 24.0, 16.0, 40, 1, 'intermediate', array['1 berinjela','Molho de tomate','Queijo light','Orégano'], array['vegetariano']),
('Caldo verde light',                 'Cremoso de batata e couve, baixo em gordura.',          array['jantar','ceia'],              250,  9.0, 38.0,  6.0, 30, 1, 'beginner', array['Batata','Couve','Frango magro','Caldo'], array['comfort']),
('Filé de frango com legumes na air fryer','Crocante por fora, sem óleo, prático.',            array['jantar'],                     360, 34.0, 18.0, 16.0, 20, 1, 'beginner', array['150g frango','Brócolis','Cenoura','Tempero'], array['air-fryer']),
('Omelete de forno com vegetais',     'Frittata fatiável, ótima para a semana.',               array['jantar','cafe_da_manha'],     300, 22.0, 10.0, 19.0, 25, 2, 'beginner', array['5 ovos','Espinafre','Tomate','Cebola','Queijo'], array['meal-prep']),

-- ══════════════════════════════════════════════════════════════
-- ► LANCHES
-- ══════════════════════════════════════════════════════════════
('Sanduíche natural de frango',       'Lanche balanceado para levar na bolsa.',                array['lanche_tarde','lanche_manha'], 290, 22.0, 30.0, 9.0, 12, 1, 'beginner', array['2 fatias pão integral','80g frango','Cenoura','Iogurte'], array['pratico']),
('Mix de castanhas',                  'Punhado de gorduras boas e magnésio.',                  array['lanche_manha','lanche_tarde'], 200,  6.0,  8.0, 17.0,  1, 1, 'beginner', array['30g castanhas e nozes'], array['gordura-boa','vegano']),
('Iogurte proteico com frutas vermelhas','Saciedade rápida com baixo açúcar.',                 array['lanche_tarde','ceia'],        180, 18.0, 16.0,  4.0,  3, 1, 'beginner', array['170g iogurte proteico','Frutas vermelhas'], array['alto-em-proteina']),
('Ovos cozidos com sal',              'Snack proteico clássico e barato.',                     array['lanche_manha','lanche_tarde'], 150, 13.0,  1.0, 10.0, 10, 1, 'beginner', array['2 ovos','Sal'], array['low-carb']),
('Rabanada proteica de whey',         'Versão fit do doce, alta em proteína.',                 array['lanche_tarde'],               260, 24.0, 22.0,  8.0, 12, 1, 'intermediate', array['1 fatia pão integral','1 scoop whey','1 ovo','Canela'], array['alto-em-proteina']),
('Maçã com pasta de amendoim',        'Doce natural + gordura boa, super prático.',            array['lanche_manha','pre_treino'],  220,  6.0, 28.0, 11.0,  3, 1, 'beginner', array['1 maçã','1 col. pasta de amendoim'], array['pratico','vegano']),
('Barrinha de cereal caseira',        'Sem açúcar refinado, perfeita para a mochila.',         array['lanche_manha','pre_treino'],  190,  5.0, 30.0,  6.0, 25, 1, 'intermediate', array['Aveia','Mel','Banana','Castanhas'], array['sem-acucar']),
('Tapioca com queijo e orégano',      'Lanche quente rápido e sem glúten.',                    array['lanche_tarde'],               230, 11.0, 28.0,  8.0,  8, 1, 'beginner', array['2 col. tapioca','1 fatia queijo','Orégano'], array['sem-gluten']),
('Pipoca de panela sem óleo',         'Estouro a seco, snack de fibra com poucas calorias.',   array['lanche_tarde','ceia'],        110,  3.0, 22.0,  2.0, 10, 1, 'beginner', array['Milho de pipoca','Sal'], array['vegano','low-cal']),
('Queijo cottage com tomate',         'Proteína leve e refrescante para a tarde.',             array['lanche_tarde','ceia'],        130, 14.0,  6.0,  5.0,  5, 1, 'beginner', array['100g cottage','Tomate','Orégano'], array['alto-em-proteina','low-carb']),

-- ══════════════════════════════════════════════════════════════
-- ► PRÉ / PÓS-TREINO
-- ══════════════════════════════════════════════════════════════
('Shake de whey com banana',          'Janela anabólica: proteína rápida + carbo.',            array['pos_treino'],                 280, 28.0, 32.0,  4.0,  3, 1, 'beginner', array['1 scoop whey','1 banana','200ml água'], array['pos-treino','alto-em-proteina']),
('Batata-doce com frango pós-treino', 'Reposição de glicogênio + proteína de qualidade.',      array['pos_treino','almoco'],        420, 38.0, 46.0,  8.0, 25, 1, 'beginner', array['150g frango','200g batata-doce'], array['pos-treino']),
('Café preto com pão de batata-doce', 'Energia rápida e cafeína antes do treino.',             array['pre_treino'],                 210,  6.0, 40.0,  3.0, 10, 1, 'beginner', array['1 café','100g batata-doce','Canela'], array['pre-treino','energetico']),
('Rapadura com água de coco',         'Carbo de absorção rápida para treino em jejum.',        array['pre_treino'],                 180,  1.0, 44.0,  0.5,  2, 1, 'beginner', array['1 rapadura pequena','200ml água de coco'], array['pre-treino','vegano']),
('Overnight oats proteico',           'Aveia hidratada com whey, pronto de véspera.',          array['pre_treino','cafe_da_manha'], 330, 26.0, 40.0,  7.0,  5, 1, 'beginner', array['50g aveia','1 scoop whey','200ml leite','Chia'], array['meal-prep','alto-em-proteina']),
('Gel caseiro de mel e sal',          'Energia rápida para treinos longos de endurance.',      array['pre_treino'],                 120,  0.0, 30.0,  0.0,  3, 1, 'beginner', array['2 col. mel','Pitada de sal','Água'], array['endurance','vegano']),
('Panqueca proteica pós-treino',      'Whey na massa para recuperação muscular.',              array['pos_treino'],                 300, 30.0, 28.0,  7.0, 12, 1, 'intermediate', array['1 scoop whey','2 ovos','30g aveia'], array['pos-treino','alto-em-proteina']),

-- ══════════════════════════════════════════════════════════════
-- ► CEIA
-- ══════════════════════════════════════════════════════════════
('Leite morno com canela',            'Relaxante e leve antes de dormir.',                     array['ceia'],                       120,  7.0, 12.0,  4.0,  5, 1, 'beginner', array['200ml leite','Canela'], array['low-cal']),
('Caseína com pasta de amendoim',     'Proteína de absorção lenta para a noite.',              array['ceia'],                       240, 28.0,  8.0, 10.0,  3, 1, 'beginner', array['1 scoop caseína','1 col. pasta de amendoim','Água'], array['proteina-lenta']),
('Chá de camomila com torrada',       'Snack noturno mínimo, ajuda no sono.',                  array['ceia'],                       100,  3.0, 18.0,  2.0,  5, 1, 'beginner', array['Chá de camomila','1 torrada integral'], array['low-cal']),
('Iogurte natural com chia',          'Probióticos + ômega vegetal para a ceia.',              array['ceia'],                       160, 12.0, 14.0,  6.0,  3, 1, 'beginner', array['170g iogurte natural','1 col. chia'], array['probiotico']),
('Queijo cottage com canela',         'Proteína lenta levemente adocicada, sem culpa.',        array['ceia'],                       140, 15.0,  6.0,  5.0,  3, 1, 'beginner', array['120g cottage','Canela','Adoçante'], array['alto-em-proteina','low-carb'])

) as v(name, description, meal_types, calories, protein_g, carbs_g, fat_g, prep_minutes, servings, difficulty, ingredients, tags)
where not exists (
  select 1 from recipes r where r.name = v.name and r.is_global = true
);
