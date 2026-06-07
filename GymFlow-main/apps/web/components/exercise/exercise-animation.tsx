'use client'

// Boneco branco animado (SVG + CSS) que demonstra o PADRÃO de movimento de um
// exercício. Não é um vídeo realista — é uma animação esquemática, desenhada por
// código, mapeada a partir dos grupos musculares do exercício.
//
// A cinemática usa grupos <g> aninhados com transform-box: view-box, de forma que
// cada articulação (ombro, cotovelo, quadril, joelho) gira em torno do seu pivô
// no sistema de coordenadas do viewBox, e os segmentos filhos acompanham o pai.

export type MovementPattern =
  | 'squat' | 'curl' | 'overhead' | 'press' | 'pull' | 'crunch' | 'run' | 'jumpingjack'

const PATTERN_LABEL: Record<MovementPattern, string> = {
  squat: 'Agachamento / pernas',
  curl: 'Flexão de cotovelo (rosca)',
  overhead: 'Elevação / desenvolvimento',
  press: 'Empurrar (supino / tríceps)',
  pull: 'Puxada (costas)',
  crunch: 'Abdominal / core',
  run: 'Cardio',
  jumpingjack: 'Movimento geral',
}

// Mapeia grupos musculares (pt-BR, ver MUSCLE_GROUPS no @gymflow/database) → padrão.
export function patternForMuscles(muscles: string[] | null | undefined): MovementPattern {
  const set = new Set((muscles ?? []).map((m) => m.toLowerCase()))
  const has = (...keys: string[]) => keys.some((k) => set.has(k))

  if (has('quadríceps', 'glúteos', 'isquiotibiais', 'panturrilhas')) return 'squat'
  if (has('bíceps', 'antebraços')) return 'curl'
  if (has('ombros', 'trapézio')) return 'overhead'
  if (has('peito', 'tríceps')) return 'press'
  if (has('costas', 'lombar')) return 'pull'
  if (has('abdômen', 'oblíquos')) return 'crunch'
  if (has('cardio')) return 'run'
  return 'jumpingjack'
}

const CSS = `
.bnc { width: 100%; height: 100%; display: block; }
.bnc line, .bnc circle { stroke: #fff; stroke-width: 7; stroke-linecap: round; fill: none; }
.bnc circle.head { fill: #fff; stroke: none; }
.bnc circle.hand, .bnc circle.foot { fill: #fff; stroke: none; }
.bnc g { transform-box: view-box; }

.bnc .arm-r, .bnc .arm-l { transform-origin: 100px 66px; }
.bnc .fore-r { transform-origin: 118px 112px; }
.bnc .fore-l { transform-origin: 82px 112px; }
.bnc .leg-r, .bnc .leg-l { transform-origin: 100px 140px; }
.bnc .shin-r { transform-origin: 118px 190px; }
.bnc .shin-l { transform-origin: 82px 190px; }
.bnc .upper  { transform-origin: 100px 140px; }

@media (prefers-reduced-motion: reduce) { .bnc * { animation: none !important; } }

/* ── Agachamento ───────────────────────────── */
@keyframes bncSquatBody { 0%,100% { transform: translateY(0); } 50% { transform: translateY(26px); } }
@keyframes bncSquatLegR { 0%,100% { transform: rotate(0); } 50% { transform: rotate(9deg); } }
@keyframes bncSquatLegL { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-9deg); } }
@keyframes bncSquatShinR { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-12deg); } }
@keyframes bncSquatShinL { 0%,100% { transform: rotate(0); } 50% { transform: rotate(12deg); } }
.bnc[data-p="squat"] .fig    { animation: bncSquatBody 1.6s ease-in-out infinite; }
.bnc[data-p="squat"] .leg-r  { animation: bncSquatLegR 1.6s ease-in-out infinite; }
.bnc[data-p="squat"] .leg-l  { animation: bncSquatLegL 1.6s ease-in-out infinite; }
.bnc[data-p="squat"] .shin-r { animation: bncSquatShinR 1.6s ease-in-out infinite; }
.bnc[data-p="squat"] .shin-l { animation: bncSquatShinL 1.6s ease-in-out infinite; }

/* ── Rosca (curl) ──────────────────────────── */
@keyframes bncCurlR { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-140deg); } }
@keyframes bncCurlL { 0%,100% { transform: rotate(0); } 50% { transform: rotate(140deg); } }
.bnc[data-p="curl"] .fore-r { animation: bncCurlR 1.4s ease-in-out infinite; }
.bnc[data-p="curl"] .fore-l { animation: bncCurlL 1.4s ease-in-out infinite; }

/* ── Desenvolvimento / elevação ────────────── */
@keyframes bncOverArmR { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-150deg); } }
@keyframes bncOverArmL { 0%,100% { transform: rotate(0); } 50% { transform: rotate(150deg); } }
.bnc[data-p="overhead"] .arm-r { animation: bncOverArmR 1.7s ease-in-out infinite; }
.bnc[data-p="overhead"] .arm-l { animation: bncOverArmL 1.7s ease-in-out infinite; }

/* ── Empurrar (supino/tríceps) ─────────────── */
@keyframes bncPressArmR { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-72deg); } }
@keyframes bncPressArmL { 0%,100% { transform: rotate(0); } 50% { transform: rotate(72deg); } }
@keyframes bncPressForeR { 0%,100% { transform: rotate(0); } 50% { transform: rotate(40deg); } }
@keyframes bncPressForeL { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-40deg); } }
.bnc[data-p="press"] .arm-r  { animation: bncPressArmR 1.5s ease-in-out infinite; }
.bnc[data-p="press"] .arm-l  { animation: bncPressArmL 1.5s ease-in-out infinite; }
.bnc[data-p="press"] .fore-r { animation: bncPressForeR 1.5s ease-in-out infinite; }
.bnc[data-p="press"] .fore-l { animation: bncPressForeL 1.5s ease-in-out infinite; }

/* ── Puxada (costas) ───────────────────────── */
@keyframes bncPullArmR  { 0%,100% { transform: rotate(-150deg); } 50% { transform: rotate(-110deg); } }
@keyframes bncPullArmL  { 0%,100% { transform: rotate(150deg); } 50% { transform: rotate(110deg); } }
@keyframes bncPullForeR { 0%,100% { transform: rotate(-10deg); } 50% { transform: rotate(-75deg); } }
@keyframes bncPullForeL { 0%,100% { transform: rotate(10deg); } 50% { transform: rotate(75deg); } }
.bnc[data-p="pull"] .arm-r  { animation: bncPullArmR 1.7s ease-in-out infinite; }
.bnc[data-p="pull"] .arm-l  { animation: bncPullArmL 1.7s ease-in-out infinite; }
.bnc[data-p="pull"] .fore-r { animation: bncPullForeR 1.7s ease-in-out infinite; }
.bnc[data-p="pull"] .fore-l { animation: bncPullForeL 1.7s ease-in-out infinite; }

/* ── Abdominal / core ──────────────────────── */
@keyframes bncCrunch { 0%,100% { transform: rotate(0); } 50% { transform: rotate(26deg); } }
.bnc[data-p="crunch"] .upper { animation: bncCrunch 1.8s ease-in-out infinite; }

/* ── Corrida (cardio) ──────────────────────── */
@keyframes bncRunBob  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes bncRunLegR { 0% { transform: rotate(26deg); } 50% { transform: rotate(-26deg); } 100% { transform: rotate(26deg); } }
@keyframes bncRunLegL { 0% { transform: rotate(-26deg); } 50% { transform: rotate(26deg); } 100% { transform: rotate(-26deg); } }
@keyframes bncRunArmR { 0% { transform: rotate(-28deg); } 50% { transform: rotate(28deg); } 100% { transform: rotate(-28deg); } }
@keyframes bncRunArmL { 0% { transform: rotate(28deg); } 50% { transform: rotate(-28deg); } 100% { transform: rotate(28deg); } }
.bnc[data-p="run"] .fig   { animation: bncRunBob 0.7s ease-in-out infinite; }
.bnc[data-p="run"] .leg-r { animation: bncRunLegR 0.7s linear infinite; }
.bnc[data-p="run"] .leg-l { animation: bncRunLegL 0.7s linear infinite; }
.bnc[data-p="run"] .arm-r { animation: bncRunArmR 0.7s linear infinite; }
.bnc[data-p="run"] .arm-l { animation: bncRunArmL 0.7s linear infinite; }

/* ── Movimento geral (polichinelo) ─────────── */
@keyframes bncJjArmR { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-155deg); } }
@keyframes bncJjArmL { 0%,100% { transform: rotate(0); } 50% { transform: rotate(155deg); } }
@keyframes bncJjLegR { 0%,100% { transform: rotate(0); } 50% { transform: rotate(20deg); } }
@keyframes bncJjLegL { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-20deg); } }
.bnc[data-p="jumpingjack"] .arm-r { animation: bncJjArmR 1s ease-in-out infinite; }
.bnc[data-p="jumpingjack"] .arm-l { animation: bncJjArmL 1s ease-in-out infinite; }
.bnc[data-p="jumpingjack"] .leg-r { animation: bncJjLegR 1s ease-in-out infinite; }
.bnc[data-p="jumpingjack"] .leg-l { animation: bncJjLegL 1s ease-in-out infinite; }
`

export function ExerciseAnimation({
  muscleGroups,
  pattern,
  className,
}: {
  muscleGroups?: string[] | null
  pattern?: MovementPattern
  className?: string
}) {
  const p = pattern ?? patternForMuscles(muscleGroups)

  return (
    <div className={className}>
      {/* CSS é constante literal definida acima — sem user input. Mantemos
          inline pra escopo: o seletor `.bnc[data-p="..."]` só hidrata quando
          este componente monta. React 18+ permite o style raw sem dangerously. */}
      <style>{CSS}</style>
      <svg className="bnc" data-p={p} viewBox="0 0 200 250" role="img"
        aria-label={`Demonstração do movimento: ${PATTERN_LABEL[p]}`}>
        <g className="fig">
          {/* Tronco superior (cabeça + coluna + braços) — pivô no quadril p/ abdominal */}
          <g className="upper">
            <line className="spine" x1="100" y1="56" x2="100" y2="140" />
            <circle className="head" cx="100" cy="40" r="15" />

            {/* Braço direito */}
            <g className="arm-r">
              <line x1="100" y1="66" x2="118" y2="112" />
              <g className="fore-r">
                <line x1="118" y1="112" x2="120" y2="150" />
                <circle className="hand" cx="120" cy="150" r="4.5" />
              </g>
            </g>

            {/* Braço esquerdo */}
            <g className="arm-l">
              <line x1="100" y1="66" x2="82" y2="112" />
              <g className="fore-l">
                <line x1="82" y1="112" x2="80" y2="150" />
                <circle className="hand" cx="80" cy="150" r="4.5" />
              </g>
            </g>
          </g>

          {/* Perna direita */}
          <g className="leg-r">
            <line x1="100" y1="140" x2="118" y2="190" />
            <g className="shin-r">
              <line x1="118" y1="190" x2="118" y2="236" />
              <circle className="foot" cx="118" cy="236" r="4.5" />
            </g>
          </g>

          {/* Perna esquerda */}
          <g className="leg-l">
            <line x1="100" y1="140" x2="82" y2="190" />
            <g className="shin-l">
              <line x1="82" y1="190" x2="82" y2="236" />
              <circle className="foot" cx="82" cy="236" r="4.5" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}

export function patternLabel(p: MovementPattern) {
  return PATTERN_LABEL[p]
}
