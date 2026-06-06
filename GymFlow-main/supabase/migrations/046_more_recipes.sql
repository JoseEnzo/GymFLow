-- ============================================================
-- GymFlow — Catálogo expandido de receitas globais (lote 2)
-- Idempotente via WHERE NOT EXISTS (name).
-- ============================================================

insert into recipes (name, description, meal_types, calories, protein_g, carbs_g, fat_g, prep_minutes, servings, difficulty, ingredients, tags, is_global)
select v.name, v.description, v.meal_types::meal_type[], v.calories, v.protein_g, v.carbs_g, v.fat_g,
       v.prep_minutes, v.servings, v.difficulty::exercise_difficulty, v.ingredients, v.tags, true
from (values

-- ══════════════════════════════════════════════════════════════
-- ► CAFÉ DA MANHÃ
-- ══════════════════════════════════════════════════════════════
('Bowl de açaí proteico',              'Açaí com granola, frutas e whey para o café.',           array['cafe_da_manha'],               380, 18.0, 52.0, 12.0, 5,  1, 'beginner',     array['200g açaí','1 scoop whey','Granola','Banana fatiada','Morango'], array['energetico','alto-em-proteina']),
('Tapioca de fruta com coco',          'Opção doce sem glúten, leve e tropical.',                 array['cafe_da_manha','lanche_tarde'], 240, 5.0,  44.0,  5.0, 8,  1, 'beginner',     array['2 col. tapioca','Coco ralado seco','Banana','Mel'], array['sem-gluten','vegano']),
('Ovo pochê com pão de fermentação',   'Proteína mole sobre tostada artesanal.',                  array['cafe_da_manha'],               310, 16.0, 32.0, 12.0, 12, 1, 'intermediate', array['2 ovos','1 fatia pão fermentação natural','Azeite','Sal'], array['artesanal']),
('French toast proteico',              'Rabanada saudável: pão integral embebido em ovo+whey.',   array['cafe_da_manha'],               350, 28.0, 30.0, 10.0, 10, 1, 'beginner',     array['2 fatias pão integral','2 ovos','1 scoop whey','Canela','Mel'], array['alto-em-proteina']),
('Vitamina de abacate com cacau',      'Shake cremoso rico em gorduras boas e antioxidantes.',    array['cafe_da_manha','pre_treino'],   310, 10.0, 22.0, 22.0, 5,  1, 'beginner',     array['1/2 abacate','1 col. cacau em pó','200ml leite','Mel'], array['gordura-boa','vegano']),
('Iogurte grego com mel e amêndoas',   'Proteína de absorção moderada com gordura boa.',           array['cafe_da_manha','lanche_manha'], 290, 17.0, 22.0, 14.0, 3,  1, 'beginner',     array['170g iogurte grego','1 col. mel','20g amêndoas'], array['alto-em-proteina','gordura-boa']),
('Mexido de ovos com salmão',          'Café proteico e rico em ômega-3.',                        array['cafe_da_manha'],               320, 28.0,  4.0, 22.0, 10, 1, 'intermediate', array['3 ovos','50g salmão defumado','Ciboulette','Azeite'], array['omega-3','low-carb']),
('Chia pudding de baunilha',           'Prep noturno: sementes de chia + leite vegetal.',         array['cafe_da_manha','ceia'],         250, 9.0,  26.0, 12.0, 5,  1, 'beginner',     array['3 col. chia','200ml leite de coco','Baunilha','Mel'], array['vegano','sem-gluten','meal-prep']),
('Crepe integral com ricota e morango','Recheio doce e proteico sem adição de açúcar.',            array['cafe_da_manha'],               280, 15.0, 34.0,  8.0, 15, 1, 'intermediate', array['50g farinha integral','1 ovo','100g ricota','Morango','Mel'], array['rico-em-fibras']),
('Granola caseira no forno',           'Aveia, nozes e mel assados, crocante e sem conservante.',  array['cafe_da_manha','lanche_manha'], 310, 8.0,  42.0, 12.0, 25, 2, 'beginner',     array['100g aveia','30g nozes','2 col. mel','1 col. azeite','Canela'], array['sem-acucar','vegano','meal-prep']),
('Pão de queijo proteico',             'Versão de polvilho com ricota, mais proteína e menos cal.',array['cafe_da_manha','lanche_tarde'], 260, 12.0, 30.0, 10.0, 30, 4, 'intermediate', array['100g polvilho','100g ricota','2 ovos','Queijo ralado','Sal'], array['sem-gluten']),
('Overnight oats de maçã e canela',    'Prep rápido pra manhã corrida.',                          array['cafe_da_manha'],               320, 12.0, 52.0,  7.0, 5,  1, 'beginner',     array['50g aveia','200ml leite','1 maçã','Canela','Mel'], array['meal-prep','vegano']),
('Tapioca de whey com banana e pasta', 'Lanche proteico pré ou pós-treino no café.',              array['cafe_da_manha','pre_treino'],   330, 26.0, 38.0,  8.0, 10, 1, 'beginner',     array['2 col. tapioca','1/2 scoop whey','Banana','1 col. pasta amendoim'], array['alto-em-proteina','sem-gluten']),

-- ══════════════════════════════════════════════════════════════
-- ► ALMOÇO
-- ══════════════════════════════════════════════════════════════
('Moqueca de frango baiana',           'Versão fitness da moqueca com leite de coco light.',       array['almoco','jantar'],              430, 32.0, 22.0, 24.0, 40, 1, 'intermediate', array['150g frango','Leite de coco light','Tomate','Pimentão','Coentro','Azeite de dendê'], array['regional','nordestino']),
('Bobó de camarão fit',                'Purê de aipim cremoso com camarão magro.',                 array['almoco'],                       460, 30.0, 42.0, 18.0, 45, 1, 'advanced',     array['150g camarão','200g aipim','Leite de coco light','Tomate','Cebola'], array['frutos-do-mar','regional']),
('Frango ao molho de ervas',           'Peito marinado em ervas frescas e assado ao forno.',       array['almoco','jantar'],              380, 36.0, 12.0, 20.0, 35, 1, 'intermediate', array['150g frango','Alecrim','Tomilho','Alho','Azeite','Limão'], array['assado','low-carb']),
('Picadinho de carne com ovos',        'Clássico brasileiro, proteína dupla.',                     array['almoco'],                       450, 40.0, 20.0, 22.0, 25, 1, 'beginner',     array['150g patinho','2 ovos','Cebola','Tomate','Pimentão','Arroz'], array['classico-fit']),
('Sardinha grelhada com legumes',      'Rico em ômega-3 e cálcio, econômico e nutritivo.',         array['almoco','jantar'],              360, 30.0, 14.0, 20.0, 20, 1, 'beginner',     array['150g sardinha fresca','Brócolis','Cenoura','Limão','Azeite'], array['omega-3','economico']),
('Frango com curry e grão-de-bico',    'Proteína dupla com especiarias anti-inflamatórias.',       array['almoco'],                       470, 38.0, 44.0, 14.0, 35, 1, 'intermediate', array['150g frango','1 lata grão-de-bico','Curry','Cebola','Tomate','Arroz integral'], array['anti-inflamatorio']),
('Filé de merluza ao limão',           'Peixe branco magro assado com crosta de ervas.',           array['almoco','jantar'],              310, 30.0, 8.0,  16.0, 20, 1, 'beginner',     array['150g merluza','Limão','Alho','Salsinha','Azeite'], array['low-cal','low-carb']),
('Carne seca com abóbora',             'Nordestino rico em proteína e betacaroteno.',               array['almoco'],                       430, 36.0, 28.0, 18.0, 50, 1, 'intermediate', array['100g carne seca dessalgada','200g abóbora','Cebola','Manteiga light'], array['regional','nordestino']),
('Frango recheado com espinafre',      'Roulade de frango com recheio verde baixo carbo.',         array['almoco','jantar'],              400, 40.0, 6.0,  22.0, 40, 1, 'advanced',     array['150g peito de frango aberto','Espinafre','Ricota','Alho','Azeite'], array['low-carb','alto-em-proteina']),
('Atum com batata-doce assada',        'Refeição proteica pós-treino rápida.',                     array['almoco','pos_treino'],           380, 36.0, 34.0,  8.0, 25, 1, 'beginner',     array['1 lata atum','200g batata-doce','Azeite','Salsinha'], array['pos-treino','pratico']),
('Sopão de feijão branco com kale',    'Proteína vegetal e fibras em caldeirão nutritivo.',        array['almoco','jantar'],              420, 22.0, 52.0,  8.0, 40, 1, 'beginner',     array['Feijão branco','Kale','Linguiça de frango','Alho','Cebola'], array['rico-em-fibras']),
('Wrap de salmão e cream cheese light','Sanduíche proteico com gorduras boas.',                    array['almoco','lanche_tarde'],         380, 28.0, 30.0, 18.0, 8,  1, 'beginner',     array['1 tortilha integral','80g salmão defumado','50g cream cheese light','Pepino','Rúcula'], array['omega-3','pratico']),
('Arroz de forno com frango e brócolis','Gratinado fit sem creme de leite integral.',              array['almoco','jantar'],              460, 32.0, 50.0, 12.0, 45, 2, 'intermediate', array['100g arroz','120g frango','Brócolis','Caldo de legumes','Queijo light'], array['meal-prep','comfort']),
('Lentilha refogada com cenoura',      'Proteína vegetal completa, riquíssima em ferro.',          array['almoco','jantar'],              370, 22.0, 52.0,  6.0, 30, 1, 'beginner',     array['150g lentilha','Cenoura','Cebola','Alho','Cominho','Azeite'], array['vegano','rico-em-fibras','proteina-vegetal']),
('Nhoque de batata-doce com frango',   'Massa saudável com molho simples de tomate.',              array['almoco'],                       440, 28.0, 54.0, 10.0, 45, 2, 'advanced',     array['200g batata-doce','Farinha integral','120g frango','Molho de tomate'], array['sem-gluten-adaptado']),
('Polvo grelhado com batata-baroa',    'Fruto do mar magro com tubérculo nutritivo.',              array['almoco'],                       400, 34.0, 30.0, 14.0, 50, 1, 'advanced',     array['150g polvo cozido','200g batata-baroa','Azeite','Limão','Salsinha'], array['frutos-do-mar','low-cal']),
('Bowl de arroz integral com edamame', 'Proteína vegetal + arroz integral em bowl colorido.',     array['almoco','jantar'],              400, 20.0, 56.0,  8.0, 20, 1, 'beginner',     array['100g arroz integral','100g edamame','Cenoura ralada','Molho shoyu light','Gergelim'], array['vegano','proteina-vegetal']),

-- ══════════════════════════════════════════════════════════════
-- ► JANTAR
-- ══════════════════════════════════════════════════════════════
('Peito de frango ao limão siciliano',  'Magro, leve e perfumado para o jantar.',                 array['jantar'],                       320, 34.0, 4.0,  18.0, 20, 1, 'beginner',     array['150g frango','Limão siciliano','Alho','Azeite','Orégano'], array['low-carb','low-cal']),
('Hambúrguer fit de patinho',           'Burger caseiro sem gordura vegetal, servido sem pão.',   array['jantar','almoco'],              380, 36.0, 8.0,  22.0, 20, 1, 'beginner',     array['150g patinho moído','Cebola','Alho','Ovo','Tempero'], array['low-carb']),
('Sopa de cenoura e gengibre',          'Cremosa, anti-inflamatória e baixa em calorias.',        array['jantar','ceia'],                200, 5.0,  30.0,  7.0, 30, 1, 'beginner',     array['Cenoura','Gengibre','Cebola','Caldo de legumes','Leite de coco light'], array['vegano','anti-inflamatorio','low-cal']),
('Frango desfiado com ratatouille',     'Proteína com mix de legumes mediterrâneos assados.',     array['jantar'],                       360, 32.0, 20.0, 16.0, 40, 1, 'intermediate', array['120g frango desfiado','Abobrinha','Berinjela','Tomate','Pimentão','Azeite'], array['mediteraneo']),
('Omelete de salmão com alcaparras',    'Low-carb gourmet para a noite.',                         array['jantar'],                       340, 30.0, 4.0,  22.0, 12, 1, 'intermediate', array['3 ovos','60g salmão defumado','Alcaparras','Cream cheese light'], array['omega-3','low-carb']),
('Caldo de osso com legumes',           'Colágeno natural e minerais, reconfortante.',            array['jantar','ceia'],                160, 12.0, 14.0,  5.0, 60, 2, 'intermediate', array['Ossos de frango','Cenoura','Chuchu','Cebola','Louro'], array['anti-inflamatorio','low-cal']),
('Peixe à provençal no forno',          'Tomates, azeitonas e ervas sobre filé branco.',          array['jantar'],                       330, 30.0, 12.0, 18.0, 25, 1, 'beginner',     array['150g filé de peixe','Tomate','Azeitonas','Ervas provençais','Azeite'], array['mediteraneo','assado']),
('Camarão ao alho e óleo',              'Prático, magro e cheio de sabor.',                       array['jantar'],                       290, 28.0, 4.0,  18.0, 15, 1, 'beginner',     array['150g camarão','Alho','Azeite','Limão','Salsinha'], array['frutos-do-mar','low-carb','rapido']),
('Suflê de brócolis e queijo',          'Levinho, vegetariano e cabe no cardápio noturno.',       array['jantar'],                       280, 18.0, 12.0, 18.0, 40, 2, 'advanced',     array['Brócolis','3 ovos','Queijo light','Farinha de trigo integral','Leite desnatado'], array['vegetariano']),
('Arroz de couve-flor com frango',      'Substituto de arroz com muito menos carbo.',             array['jantar'],                       280, 30.0, 12.0, 12.0, 20, 1, 'beginner',     array['200g couve-flor ralada','100g frango','Alho','Cebola','Azeite'], array['low-carb','sem-gluten']),
('Salmão no papelote com aspargos',     'Técnica fácil que preserva sucos e nutrientes.',         array['jantar'],                       390, 34.0, 8.0,  24.0, 25, 1, 'beginner',     array['150g salmão','Aspargos','Limão','Alho','Azeite'], array['omega-3','low-carb','assado']),
('Frittata de legumes mediterrânea',    'Omelete de forno fatiável, fria ou quente.',             array['jantar','cafe_da_manha'],       300, 20.0, 12.0, 20.0, 30, 2, 'intermediate', array['5 ovos','Abobrinha','Pimentão','Tomate','Azeitonas','Queijo feta light'], array['vegetariano','meal-prep']),

-- ══════════════════════════════════════════════════════════════
-- ► LANCHES
-- ══════════════════════════════════════════════════════════════
('Hummus caseiro com palitinhos',       'Grão-de-bico batido com tahine, rico em fibras.',        array['lanche_tarde','lanche_manha'], 210, 8.0,  24.0, 10.0, 10, 2, 'beginner',     array['1 lata grão-de-bico','Tahine','Limão','Alho','Azeite','Cenoura/pepino em palito'], array['vegano','proteina-vegetal']),
('Biscoito de aveia e banana caseiro',  'Sem açúcar e glúten, 3 ingredientes.',                   array['lanche_manha','lanche_tarde'], 140, 4.0,  24.0,  4.0, 20, 4, 'beginner',     array['1 banana','50g aveia','1 col. pasta de amendoim'], array['sem-acucar','vegano','pratico']),
('Torrada integral com abacate e ovo', 'Avocado toast proteico, tendência fitness.',              array['lanche_tarde','cafe_da_manha'], 290, 14.0, 24.0, 16.0, 8,  1, 'beginner',     array['2 fatias pão integral','1/2 abacate','1 ovo cozido','Limão','Sal rosa'], array['gordura-boa']),
('Gelatina proteica caseira',           'Sobremesa low-cal com colágeno e proteína.',             array['lanche_tarde','ceia'],          80,  12.0,  6.0,  1.0, 5,  2, 'beginner',     array['1 envelope gelatina diet','1 scoop whey','Água'], array['low-cal','alto-em-proteina']),
('Chips de kale assado',                'Folhas crocantes temperadas, zero culpa.',               array['lanche_tarde'],                 60,  4.0,  6.0,  3.0, 15, 1, 'beginner',     array['Folhas de kale','Azeite','Sal','Páprica'], array['vegano','low-cal','sem-gluten']),
('Rolinho de peru com cenoura',         'Snack proteico com mínima caloria.',                     array['lanche_manha','lanche_tarde'], 120, 14.0, 4.0,   4.0, 5,  1, 'beginner',     array['4 fatias peito de peru','Cenoura julienne','Cream cheese light','Mostarda'], array['low-cal','low-carb','pratico']),
('Edamame temperado',                   'Proteína vegetal completa no lanche.',                   array['lanche_tarde','lanche_manha'], 170, 14.0, 12.0,  7.0, 5,  1, 'beginner',     array['150g edamame','Sal grosso','Limão'], array['vegano','proteina-vegetal','low-cal']),
('Shake de caseína com cacau',          'Proteína de absorção lenta, ideal pré-sono.',            array['ceia','lanche_tarde'],          220, 26.0, 8.0,   6.0, 3,  1, 'beginner',     array['1 scoop caseína','1 col. cacau em pó','200ml água ou leite'], array['proteina-lenta','low-carb']),
('Ovos de codorna com sal de ervas',    'Pequenos e nutritivos, ótimos pra box de treino.',       array['lanche_manha','lanche_tarde'], 130, 12.0, 1.0,   9.0, 12, 1, 'beginner',     array['10 ovos de codorna','Sal de ervas'], array['low-carb','pratico']),
('Wrap de atum com alface',             'Substitui o pão: folha de alface como invólucro.',       array['lanche_tarde','almoco'],        180, 20.0, 6.0,   8.0, 5,  1, 'beginner',     array['1 lata atum','Folhas alface americana','Pepino','Limão'], array['low-carb','pratico','sem-gluten']),
('Bolinha de arroz com atum',           'Onigiri fit: arroz integral + proteína compacta.',       array['lanche_manha','pre_treino'],   220, 16.0, 28.0,  5.0, 15, 2, 'intermediate', array['100g arroz integral cozido','1/2 lata atum','Shoyu light','Nori'], array['pratico','pos-treino']),
('Queijo cottage com geleia de frutas', 'Doce natural + proteína, simples e rápido.',             array['lanche_tarde','ceia'],          160, 14.0, 16.0,  4.0, 3,  1, 'beginner',     array['100g cottage','1 col. geleia sem açúcar'], array['alto-em-proteina','rapido']),
('Banana com chocolate 70%',            'Porção controlada de antioxidantes + potássio.',         array['lanche_tarde'],                 200, 3.0,  30.0,  9.0, 2,  1, 'beginner',     array['1 banana','2 quadradinhos chocolate 70%'], array['vegano','antioxidante']),

-- ══════════════════════════════════════════════════════════════
-- ► PRÉ / PÓS-TREINO
-- ══════════════════════════════════════════════════════════════
('Arroz com ovo e frango pós-treino',   'Refeição completa de recuperação muscular.',             array['pos_treino'],                   480, 42.0, 46.0, 10.0, 15, 1, 'beginner',     array['100g arroz','150g frango','2 ovos','Azeite'], array['pos-treino','classico-fit']),
('Tortilha de aveia com pasta',         'Carbo de absorção moderada + gordura boa pré-treino.',   array['pre_treino'],                   280, 8.0,  38.0, 10.0, 8,  1, 'beginner',     array['1 tortilha integral','1 col. pasta de amendoim','1 banana'], array['pre-treino','energetico']),
('Smoothie pós-treino de morango',      'Proteína + carboidrato para recuperação rápida.',        array['pos_treino'],                   290, 26.0, 34.0,  5.0, 3,  1, 'beginner',     array['1 scoop whey','100g morango','200ml leite','1/2 banana'], array['pos-treino','alto-em-proteina']),
('Bolo de proteína no microondas',      'Mug cake de 2 min, pronto antes do treino.',            array['pre_treino','lanche_tarde'],    260, 22.0, 24.0,  8.0, 4,  1, 'beginner',     array['1 scoop whey','1 ovo','2 col. aveia','1 col. mel','Canela'], array['rapido','alto-em-proteina']),
('Mexido de clara com batata',          'Reposição glicogênio + proteína em minutos.',            array['pos_treino'],                   330, 28.0, 32.0,  6.0, 12, 1, 'beginner',     array['4 claras','1 batata-doce pequena','1 col. azeite'], array['pos-treino']),
('Creme de amendoim com banana grelhada','Lanche pré-treino com carbo + gordura boa.',            array['pre_treino'],                   310, 8.0,  40.0, 14.0, 5,  1, 'beginner',     array['1 banana','1 col. pasta de amendoim','Canela'], array['pre-treino','energetico','vegano']),
('Whey com leite e aveia (mass shake)', 'Shake hipercalórico caseiro para bulking.',              array['pos_treino'],                   480, 36.0, 52.0, 12.0, 3,  1, 'beginner',     array['1 scoop whey','300ml leite integral','50g aveia','1 banana'], array['bulking','alto-em-proteina','pos-treino']),

-- ══════════════════════════════════════════════════════════════
-- ► CEIA
-- ══════════════════════════════════════════════════════════════
('Mousse de chocolate proteico',        'Sobremesa de caseína, satisfaz o doce sem culpa.',       array['ceia'],                         200, 22.0, 12.0,  6.0, 10, 1, 'beginner',     array['1 scoop caseína chocolate','100g iogurte grego','1 col. cacau'], array['proteina-lenta','low-carb']),
('Chá verde com castanha-do-pará',      'Antioxidante + selênio anti-inflamatório noturno.',      array['ceia'],                         100, 2.0,  4.0,   8.0, 5,  1, 'beginner',     array['Chá verde','2 castanhas-do-pará'], array['antioxidante','low-cal']),
('Iogurte proteico com compota',        'Proteína lenta com frutose de absorção moderada.',       array['ceia'],                         190, 18.0, 18.0,  4.0, 5,  1, 'beginner',     array['170g iogurte proteico','3 col. compota de frutas sem açúcar'], array['proteina-lenta']),
('Tucumã com queijo coalho',            'Regional amazônico: sabor único com proteína.',          array['lanche_tarde','ceia'],          240, 10.0, 22.0, 14.0, 5,  1, 'beginner',     array['50g tucumã','1 fatia queijo coalho'], array['regional','amazonia']),
('Chá de hibisco com mel e limão',      'Anti-inflamatório, diurético, zero calorias.',           array['ceia'],                         30,  0.0,  8.0,   0.0, 5,  1, 'beginner',     array['Chá de hibisco','1 col. mel','Limão'], array['anti-inflamatorio','low-cal','vegano']),
('Tapioca de coco com ricota',          'Doce saudável de ceia sem farinha de trigo.',            array['ceia','lanche_tarde'],          200, 10.0, 26.0,  6.0, 8,  1, 'beginner',     array['2 col. tapioca','80g ricota','2 col. coco ralado seco','Mel'], array['sem-gluten']),

-- ══════════════════════════════════════════════════════════════
-- ► SOBREMESAS / DOCES FIT
-- ══════════════════════════════════════════════════════════════
('Brownie proteico de grão-de-bico',    'Textura fudgy, sem farinha, proteína vegetal.',          array['lanche_tarde'],                 220, 10.0, 28.0,  9.0, 30, 4, 'intermediate', array['1 lata grão-de-bico','3 col. cacau','2 ovos','4 col. mel','1 col. óleo coco'], array['sem-gluten','proteina-vegetal']),
('Sorvete de banana 2 ingredientes',    'Sobremesa vegana gelada, sem açúcar adicionado.',        array['lanche_tarde','ceia'],          120, 2.0,  28.0,  1.0, 5,  1, 'beginner',     array['2 bananas congeladas','Canela'], array['vegano','sem-acucar','sem-gluten']),
('Muffin de aveia e blueberry',         'Forno 20 min, sem manteiga, sem farinha refinada.',      array['cafe_da_manha','lanche_tarde'], 200, 7.0,  34.0,  5.0, 25, 3, 'beginner',     array['60g aveia','1 ovo','1 banana','50g blueberry','Mel'], array['sem-acucar','rico-em-fibras']),
('Brigadeiro de whey proteico',         'Doce de festas com proteína, 5g de whey por unid.',      array['lanche_tarde'],                 90,  7.0,  8.0,   3.0, 20, 6, 'beginner',     array['1 scoop whey chocolate','3 col. cacau em pó','Leite condensado light'], array['alto-em-proteina']),
('Cheesecake fit de liquidificador',    'Sem forno, proteico, pode ser cortado em fatias.',       array['lanche_tarde','ceia'],          240, 14.0, 24.0, 10.0, 15, 6, 'intermediate', array['200g cream cheese light','170g iogurte grego','2 col. mel','Gelatina sem sabor','Base de tapioca'], array['sem-gluten','alto-em-proteina']),
('Picolé proteico de frutas tropicais', 'Polpa de frutas + whey congelado, sem açúcar.',         array['lanche_tarde'],                 110, 10.0, 14.0,  2.0, 10, 4, 'beginner',     array['Polpa manga/abacaxi','1 scoop whey','Água de coco'], array['sem-acucar','alto-em-proteina']),

-- ══════════════════════════════════════════════════════════════
-- ► RECEITAS REGIONAIS BRASILEIRAS
-- ══════════════════════════════════════════════════════════════
('Baião de dois fit',                   'Feijão de corda + arroz integral + queijo coalho.',      array['almoco'],                       470, 24.0, 62.0, 12.0, 40, 1, 'beginner',     array['Feijão de corda','100g arroz integral','Queijo coalho','Cebola','Coentro'], array['nordestino','regional']),
('Vatapá de frango light',              'Sem azeite de dendê em excesso, cremoso e proteico.',    array['almoco'],                       440, 30.0, 38.0, 18.0, 50, 1, 'advanced',     array['150g frango','Pão dormido','Leite de coco light','Amendoim','Camarão seco'], array['nordestino','regional']),
('Frango caipira ao molho pardo',       'Frango com molho escuro sem gordura excessiva.',         array['almoco','jantar'],              420, 36.0, 16.0, 22.0, 60, 1, 'advanced',     array['150g frango','Sangue (molho pardo)','Cebola','Alho','Pimentão'], array['regional','mineiro']),
('Tutu de feijão com couve',            'Mineiro clássico: feijão cremoso + couve refogada.',     array['almoco'],                       400, 18.0, 56.0, 10.0, 30, 1, 'beginner',     array['Feijão preto','Farinha de mandioca','Couve','Alho','Azeite'], array['mineiro','regional','vegano']),
('Pirão de peixe',                      'Caldo grosso nordestino com farinha de mandioca.',       array['almoco','jantar'],              310, 26.0, 28.0,  9.0, 30, 1, 'intermediate', array['150g peixe','Farinha de mandioca','Coentro','Tomate','Cebola'], array['nordestino','regional','frutos-do-mar']),
('Arroz com pequi',                     'Sabor do Cerrado, preparado com pouco óleo.',            array['almoco'],                       430, 8.0,  72.0, 14.0, 30, 1, 'beginner',     array['100g arroz','4 pequis','Frango magro','Alho','Cebola'], array['cerrado','regional']),
('Caldinho de feijão proteico',         'Sopa densa, lanche pré-treino nordestino.',              array['lanche_tarde','pre_treino'],   250, 14.0, 34.0,  6.0, 20, 1, 'beginner',     array['Feijão preto','Linguiça de frango light','Cebola','Alho','Salsinha'], array['nordestino','pre-treino']),
('Frango tropeiro paulista',            'Arroz, feijão, ovos e couve — prato único nutritivo.',   array['almoco'],                       520, 36.0, 54.0, 16.0, 25, 1, 'intermediate', array['100g arroz','Feijão','2 ovos','Couve','120g frango','Alho'], array['caipira','regional']),

-- ══════════════════════════════════════════════════════════════
-- ► VEGANO / PLANT-BASED
-- ══════════════════════════════════════════════════════════════
('Tofu grelhado ao shoyu e gergelim',   'Proteína vegetal com crocância, substituto ao frango.',  array['almoco','jantar'],              280, 22.0, 12.0, 16.0, 15, 1, 'beginner',     array['200g tofu firme','Shoyu light','Gergelim','Gengibre','Óleo de gergelim'], array['vegano','proteina-vegetal','sem-gluten']),
('Bowl de grão-de-bico assado',         'Grão torrado com especiarias, proteína de bolso.',       array['almoco','lanche_tarde'],        380, 18.0, 48.0, 12.0, 35, 1, 'beginner',     array['1 lata grão-de-bico','Páprica','Cominho','Azeite','Arroz integral'], array['vegano','proteina-vegetal']),
('Hambúrguer de lentilha',              'Blend vegetariano firme, assado em vez de frito.',       array['jantar','almoco'],              310, 18.0, 38.0,  8.0, 35, 2, 'intermediate', array['150g lentilha cozida','Aveia','Cebola','Alho','Páprica defumada'], array['vegano','proteina-vegetal']),
('Yakisoba fit vegano',                 'Macarrão de arroz com legumes e proteína de soja.',      array['almoco','jantar'],              400, 16.0, 58.0,  8.0, 25, 1, 'intermediate', array['100g macarrão arroz','Brócolis','Cenoura','Cogumelo','Proteína de soja'], array['vegano','sem-gluten']),
('Panqueca de banana vegana',           'Sem ovo, sem leite: chia + leite vegetal na massa.',     array['cafe_da_manha'],               260, 8.0,  42.0,  8.0, 15, 1, 'beginner',     array['1 banana','50g aveia','100ml leite vegetal','1 col. chia'], array['vegano','sem-gluten']),
('Espaguete de abobrinha com pesto',    'Zoodles com molho verde de manjericão e castanha.',      array['jantar','almoco'],              300, 10.0, 18.0, 22.0, 20, 1, 'intermediate', array['2 abobrinhas grandes','Manjericão','Castanha de caju','Alho','Azeite'], array['vegano','low-carb','sem-gluten']),

-- ══════════════════════════════════════════════════════════════
-- ► RECEITAS RÁPIDAS (≤ 10 min)
-- ══════════════════════════════════════════════════════════════
('Atum com cenoura rallada na torrada', 'Lanche proteico montado em 5 minutos.',                  array['lanche_tarde','almoco'],        220, 18.0, 22.0,  6.0, 5,  1, 'beginner',     array['1 lata atum','Cenoura ralada','2 fatias pão integral','Limão'], array['pratico','rapido']),
('Queijo branco com tomate e manjericão','Bruschetta fit sem pão, colorida e refrescante.',       array['lanche_tarde'],                 140, 9.0,  4.0,   10.0, 3,  1, 'beginner',     array['100g queijo branco','Tomate cereja','Manjericão','Azeite'], array['pratico','vegetariano','low-carb']),
('Abacate com atum temperado',          'Alta proteína + gordura boa em bowl natural.',           array['lanche_tarde','almoco'],        320, 22.0, 8.0,   22.0, 5,  1, 'beginner',     array['1/2 abacate','1 lata atum','Limão','Pimenta','Coentro'], array['low-carb','gordura-boa','rapido']),
('Smoothie de espinafre e abacaxi',     'Verde energético, vitaminas e minerais.',                array['cafe_da_manha','lanche_manha'], 160, 4.0,  32.0,  3.0, 5,  1, 'beginner',     array['Espinafre','200g abacaxi','200ml água de coco','Limão'], array['vegano','detox','rapido']),
('Iogurte com proteína em pó e cacau',  'Mousse instantânea de 3 ingredientes.',                  array['lanche_tarde','ceia'],          230, 24.0, 14.0,  7.0, 3,  1, 'beginner',     array['170g iogurte grego','1 scoop whey chocolate','1 col. cacau'], array['rapido','alto-em-proteina'])

) as v(name, description, meal_types, calories, protein_g, carbs_g, fat_g, prep_minutes, servings, difficulty, ingredients, tags)
where not exists (
  select 1 from recipes r where r.name = v.name and r.is_global = true
);
