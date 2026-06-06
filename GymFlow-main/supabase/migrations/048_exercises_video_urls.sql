-- ============================================================
-- GymFlow — Seed de video_url para exercícios globais
-- Usa YouTube Shorts e vídeos curtos (< 3 min) em PT-BR.
-- Idempotente: só atualiza onde video_url ainda é NULL.
-- ============================================================

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=vIGvt-vgrvY'
  WHERE name_pt = 'Supino Reto com Barra'      AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=CaTbpJH49i4'
  WHERE name_pt = 'Agachamento Livre'           AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/ASO89bLkLqU'
  WHERE name_pt = 'Levantamento Terra'          AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/AVRHeOiO2yo'
  WHERE name_pt = 'Puxada no Pulley'            AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/DNGwvrde5o4'
  WHERE name_pt = 'Remada Curvada com Barra'    AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/n7xpF3U5QK8'
  WHERE name_pt = 'Desenvolvimento com Barra'   AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=V6UEDzY51gY'
  WHERE name_pt = 'Rosca Direta com Barra'      AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=9HXJDNRP9C0'
  WHERE name_pt = 'Tríceps no Pulley'           AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=fD-yU3c3Fv8'
  WHERE name_pt = 'Leg Press 45°'              AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=UkDVBs9GEWo'
  WHERE name_pt = 'Flexão de Braço'             AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=o0T3AU3GAdA'
  WHERE name_pt = 'Barra Fixa'                  AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=jannLx4RxKo'
  WHERE name_pt = 'Elevação Lateral com Halteres' AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=KN5vN3JskqI'
  WHERE name_pt = 'Stiff / Terra Romeno'        AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=exLCpU7mT3g'
  WHERE name_pt = 'Extensão de Joelho'          AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=rpGgncDk9lQ'
  WHERE name_pt = 'Flexão de Joelho (mesa flexora)' AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=A3YYT8wvxHs'
  WHERE name_pt = 'Prancha Isométrica'          AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=HE7JTnLmMxg'
  WHERE name_pt = 'Agachamento Goblet'          AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=NQWR21qgOSo'
  WHERE name_pt = 'Desenvolvimento Arnold'      AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/NW-CmtlU1wc'
  WHERE name_pt = 'Remada Unilateral com Haltere' AND is_global = true AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=vpm5jOZO8oc'
  WHERE name_pt = 'Crucifixo com Halteres'      AND is_global = true AND video_url IS NULL;
