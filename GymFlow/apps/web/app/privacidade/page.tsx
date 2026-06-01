'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Dumbbell, Shield, Eye, Cookie, BarChart2, Lock, Mail,
  FileText, AlertCircle, CheckCircle, Menu, X, ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

// ──────────────────────────────────────────────
// Nav (reutilizada da landing)
// ──────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-2xl'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="absolute inset-0 rounded-lg bg-brand-500 blur-md opacity-60" />
              <div className="relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 p-1.5">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Gym<span className="text-brand-400">Flow</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-primary text-sm px-5 py-2.5 rounded-xl">
              Começar grátis
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </motion.header>
  )
}

// ──────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-7 h-7">
              <div className="absolute inset-0 rounded-lg bg-brand-500 blur-sm opacity-50" />
              <div className="relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 p-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="font-display font-bold">Gym<span className="text-brand-400">Flow</span></span>
          </Link>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GymFlow. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-foreground transition-colors">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ──────────────────────────────────────────────
// Section card
// ──────────────────────────────────────────────
function Section({
  icon: Icon,
  color,
  title,
  children,
}: {
  icon: React.ElementType
  color: string
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.div variants={fadeUp} className="glass rounded-2xl p-7 border border-border/40">
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h2 className="text-lg font-display font-bold">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </motion.div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  )
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────
export default function PrivacidadePage() {
  return (
    <div className="relative min-h-screen bg-background bg-mesh">
      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[45]"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 75% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <Nav />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="text-center mb-12 space-y-4"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Política de Privacidade
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl lg:text-5xl font-display font-extrabold">
              Sua privacidade é
              <span className="block gradient-text">nossa prioridade</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Transparência total sobre quais dados coletamos, como usamos e como você pode exercer seus direitos.
            </motion.p>
            <motion.p variants={fadeUp} className="text-xs text-muted-foreground/60">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </motion.p>
          </motion.div>

          {/* Aviso LGPD */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta política está em conformidade com a <strong className="text-foreground">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong> e com o <strong className="text-foreground">Regulamento Geral de Proteção de Dados (GDPR)</strong> da União Europeia.
            </p>
          </motion.div>

          {/* Sections */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >

            {/* Quem somos */}
            <Section icon={FileText} color="#6366F1" title="1. Quem Somos">
              <p>
                O <strong className="text-foreground">GymFlow</strong> é uma plataforma SaaS brasileira para gestão de academias. O controlador dos dados é a empresa responsável pelo GymFlow, com sede no Brasil.
              </p>
              <p>
                Ao usar nossa plataforma, você concorda com os termos desta política. Em caso de dúvidas, entre em contato pelo e-mail <strong className="text-foreground">privacidade@gymflow.app</strong>.
              </p>
            </Section>

            {/* Dados coletados */}
            <Section icon={Eye} color="#06B6D4" title="2. Dados que Coletamos">
              <p>Coletamos apenas os dados necessários para operar e melhorar a plataforma:</p>
              <ul className="space-y-2 mt-3">
                <Li><strong className="text-foreground">Dados de cadastro:</strong> nome, e-mail e senha (armazenada com hash seguro via Supabase Auth).</Li>
                <Li><strong className="text-foreground">Dados de academia:</strong> nome, CNPJ, endereço e horários de funcionamento.</Li>
                <Li><strong className="text-foreground">Dados de uso:</strong> fichas de treino, registros de séries, pesos e histórico de evolução.</Li>
                <Li><strong className="text-foreground">Dados de navegação:</strong> páginas visitadas, tempo de sessão e eventos de interação (via Google Analytics).</Li>
                <Li><strong className="text-foreground">Dados técnicos:</strong> endereço IP (anonimizado), tipo de navegador, sistema operacional e resolução de tela.</Li>
              </ul>
            </Section>

            {/* Google Analytics */}
            <Section icon={BarChart2} color="#10B981" title="3. Google Analytics">
              <p>
                Utilizamos o <strong className="text-foreground">Google Analytics 4 (GA4)</strong> para entender como os usuários interagem com o GymFlow e assim melhorar a experiência.
              </p>

              <div className="mt-4 rounded-xl bg-surface-100/60 border border-border/40 p-4 space-y-3">
                <p className="font-semibold text-foreground text-sm">O que o Google Analytics coleta:</p>
                <ul className="space-y-2">
                  <Li>Páginas visitadas e duração da visita</Li>
                  <Li>Origem do tráfego (busca orgânica, redes sociais, links diretos)</Li>
                  <Li>Tipo de dispositivo, navegador e sistema operacional</Li>
                  <Li>Localização geográfica aproximada (país e cidade, nunca endereço exato)</Li>
                  <Li>Eventos de clique em botões e interações na interface</Li>
                </ul>
              </div>

              <div className="mt-4 rounded-xl bg-surface-100/60 border border-border/40 p-4 space-y-3">
                <p className="font-semibold text-foreground text-sm">Configurações de privacidade aplicadas:</p>
                <ul className="space-y-2">
                  <Li>Anonimização de IP ativada — o último octeto do IP é removido antes do armazenamento.</Li>
                  <Li>Dados de anúncios personalizados desativados.</Li>
                  <Li>Compartilhamento de dados com o Google limitado ao mínimo necessário.</Li>
                  <Li>Retenção de dados configurada para <strong className="text-foreground">14 meses</strong> no GA4.</Li>
                </ul>
              </div>

              <p className="mt-3">
                Os dados coletados pelo Google Analytics são processados pelo Google LLC, nos termos da{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors"
                >
                  Política de Privacidade do Google
                </a>.
              </p>
            </Section>

            {/* Cookies */}
            <Section icon={Cookie} color="#F59E0B" title="4. Cookies">
              <p>Usamos os seguintes tipos de cookies:</p>

              <div className="mt-3 space-y-3">
                {[
                  {
                    name: 'Essenciais',
                    color: '#10B981',
                    desc: 'Necessários para autenticação e funcionamento da plataforma. Não podem ser desativados.',
                    examples: 'Sessão de login, token de autenticação Supabase.',
                  },
                  {
                    name: 'Analíticos (Google Analytics)',
                    color: '#F59E0B',
                    desc: 'Coletam dados anônimos de navegação para melhorar o produto.',
                    examples: '_ga, _ga_XXXXXXXX, _gid — expiram em até 2 anos.',
                  },
                  {
                    name: 'Preferências',
                    color: '#8B5CF6',
                    desc: 'Armazenam configurações locais como tema e idioma.',
                    examples: 'theme, locale.',
                  },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="rounded-xl p-4 border"
                    style={{ background: `${c.color}08`, borderColor: `${c.color}20` }}
                  >
                    <p className="font-semibold text-foreground text-sm mb-1" style={{ color: c.color }}>{c.name}</p>
                    <p className="text-xs leading-relaxed">{c.desc}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 font-mono">{c.examples}</p>
                  </div>
                ))}
              </div>

              <p className="mt-3">
                Você pode desativar cookies analíticos nas configurações do seu navegador ou usando a extensão oficial:{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors"
                >
                  Google Analytics Opt-out Add-on
                </a>.
              </p>
            </Section>

            {/* Finalidade */}
            <Section icon={CheckCircle} color="#06B6D4" title="5. Para Que Usamos os Dados">
              <ul className="space-y-2">
                <Li>Fornecer e operar os serviços da plataforma GymFlow.</Li>
                <Li>Enviar notificações transacionais (confirmação de e-mail, convites).</Li>
                <Li>Processar pagamentos via Stripe com segurança.</Li>
                <Li>Analisar o uso do produto para melhorar funcionalidades.</Li>
                <Li>Detectar e prevenir fraudes e abusos.</Li>
                <Li>Cumprir obrigações legais aplicáveis.</Li>
              </ul>
              <p className="mt-3">
                <strong className="text-foreground">Não vendemos, alugamos ou compartilhamos seus dados pessoais</strong> com terceiros para fins de marketing.
              </p>
            </Section>

            {/* Segurança */}
            <Section icon={Lock} color="#8B5CF6" title="6. Segurança dos Dados">
              <ul className="space-y-2">
                <Li>Todos os dados são transmitidos com <strong className="text-foreground">TLS 1.3</strong>.</Li>
                <Li>Banco de dados hospedado no <strong className="text-foreground">Supabase</strong> com Row Level Security (RLS) — cada academia acessa apenas seus próprios dados.</Li>
                <Li>Senhas armazenadas com hash seguro usando <strong className="text-foreground">bcrypt</strong>.</Li>
                <Li>Chaves de API nunca expostas no cliente — apenas em variáveis de ambiente server-side.</Li>
                <Li>Backups automáticos diários com retenção de 30 dias.</Li>
              </ul>
            </Section>

            {/* Direitos do usuário */}
            <Section icon={Shield} color="#10B981" title="7. Seus Direitos (LGPD)">
              <p>Como titular de dados, você tem direito a:</p>
              <ul className="space-y-2 mt-3">
                <Li><strong className="text-foreground">Acesso:</strong> solicitar uma cópia de todos os dados que temos sobre você.</Li>
                <Li><strong className="text-foreground">Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados.</Li>
                <Li><strong className="text-foreground">Exclusão:</strong> solicitar a exclusão dos seus dados pessoais.</Li>
                <Li><strong className="text-foreground">Portabilidade:</strong> receber seus dados em formato estruturado (JSON/CSV).</Li>
                <Li><strong className="text-foreground">Revogação:</strong> retirar o consentimento a qualquer momento.</Li>
                <Li><strong className="text-foreground">Oposição:</strong> opor-se ao tratamento de dados em determinadas situações.</Li>
              </ul>
              <p className="mt-3">
                Para exercer qualquer desses direitos, envie um e-mail para <strong className="text-foreground">privacidade@gymflow.app</strong>. Respondemos em até <strong className="text-foreground">15 dias úteis</strong>.
              </p>
            </Section>

            {/* Contato */}
            <Section icon={Mail} color="#EF4444" title="8. Contato">
              <p>Para dúvidas, solicitações ou reclamações sobre esta política:</p>
              <div className="mt-4 rounded-xl bg-surface-100/60 border border-border/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-brand-400" />
                  <span><strong className="text-foreground">E-mail:</strong> privacidade@gymflow.app</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-brand-400" />
                  <span><strong className="text-foreground">DPO:</strong> Encarregado de Proteção de Dados — disponível pelo e-mail acima</span>
                </div>
              </div>
              <p className="mt-3">
                Se não estiver satisfeito com nossa resposta, você pode contatar a{' '}
                <strong className="text-foreground">Autoridade Nacional de Proteção de Dados (ANPD)</strong>{' '}
                em{' '}
                <a
                  href="https://www.gov.br/anpd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors"
                >
                  gov.br/anpd
                </a>.
              </p>
            </Section>

            {/* Alterações */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-6">
              <h2 className="font-display font-bold text-base mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-brand-400" />
                9. Alterações nesta Política
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Podemos atualizar esta política periodicamente. Quando fizermos alterações significativas, notificaremos por e-mail ou por aviso em destaque na plataforma com pelo menos <strong className="text-foreground">15 dias de antecedência</strong>. O uso contínuo após a notificação implica aceitação das mudanças.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp} className="text-center pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Voltar ao início
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
