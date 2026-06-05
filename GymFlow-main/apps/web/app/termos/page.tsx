'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Dumbbell, FileText, Shield, AlertCircle, CheckCircle,
  Menu, X, Scale, CreditCard, Ban, Mail,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { BrandLogo } from '@/components/layout/brand-logo'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

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
          <BrandLogo size="lg" />

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-primary text-sm px-5 py-2.5 rounded-xl">
              Começar grátis
            </Link>
          </div>

          <button
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
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

function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="md" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MeuTrein. Todos os direitos reservados.
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

export default function TermosPage() {
  return (
    <div className="relative min-h-screen bg-background bg-mesh">
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
                <Scale className="w-3.5 h-3.5" />
                Termos de Uso
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl lg:text-5xl font-display font-extrabold">
              Termos claros,
              <span className="block gradient-text">sem letras miúdas</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Leia com atenção os termos que regem o uso da plataforma MeuTrein.
            </motion.p>
            <motion.p variants={fadeUp} className="text-xs text-muted-foreground/60">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </motion.p>
          </motion.div>

          {/* Aviso */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 mb-10"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Ao criar uma conta ou usar a plataforma MeuTrein, você concorda com estes Termos de Uso.
              Caso não concorde, não utilize o serviço.
            </p>
          </motion.div>

          {/* Seções */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <Section icon={FileText} color="#6366F1" title="1. Aceitação dos Termos">
              <p>
                Estes Termos de Uso regulam o acesso e uso da plataforma MeuTrein, disponível em{' '}
                <span className="text-foreground font-medium">gymflow.app</span> e seus subdomínios.
              </p>
              <p>
                O uso da plataforma é destinado a academias, personal trainers e seus alunos.
                A criação de conta implica aceitação integral destes termos e da nossa{' '}
                <Link href="/privacidade" className="text-brand-400 hover:underline">Política de Privacidade</Link>.
              </p>
            </Section>

            <Section icon={Shield} color="#06B6D4" title="2. Uso permitido">
              <p>Você pode usar o MeuTrein para:</p>
              <ul className="space-y-2 mt-2">
                <Li>Gerenciar treinos, fichas e evolução de alunos</Li>
                <Li>Convidar e administrar personais e membros da academia</Li>
                <Li>Acompanhar métricas de desempenho e evolução física</Li>
                <Li>Assinar planos e gerenciar pagamentos de forma segura</Li>
              </ul>
            </Section>

            <Section icon={Ban} color="#EF4444" title="3. Uso proibido">
              <p>É expressamente proibido:</p>
              <ul className="space-y-2 mt-2">
                <Li>Usar a plataforma para fins ilegais ou fraudulentos</Li>
                <Li>Compartilhar credenciais de acesso com terceiros não autorizados</Li>
                <Li>Tentar acessar dados de outras academias ou usuários</Li>
                <Li>Realizar engenharia reversa, scraping ou ataques à infraestrutura</Li>
                <Li>Criar contas falsas ou representar outra pessoa ou entidade</Li>
              </ul>
              <p className="mt-3">
                O descumprimento pode resultar na suspensão imediata da conta sem reembolso.
              </p>
            </Section>

            <Section icon={CreditCard} color="#10B981" title="4. Planos e pagamentos">
              <p>
                O MeuTrein oferece planos pagos com cobrança recorrente mensal, processados via Stripe.
                Os valores e funcionalidades de cada plano estão disponíveis na página de preços.
              </p>
              <ul className="space-y-2 mt-2">
                <Li>O acesso ao plano contratado é liberado imediatamente após confirmação do pagamento</Li>
                <Li>Cancelamentos devem ser realizados antes da data de renovação para evitar cobranças</Li>
                <Li>Não há reembolso proporcional por dias não utilizados após a renovação</Li>
                <Li>Em caso de falha no pagamento, o acesso pode ser suspenso até regularização</Li>
              </ul>
            </Section>

            <Section icon={Shield} color="#8B5CF6" title="5. Dados e privacidade">
              <p>
                O MeuTrein trata seus dados com responsabilidade e em conformidade com a LGPD
                (Lei Geral de Proteção de Dados — Lei nº 13.709/2018).
              </p>
              <p>
                Consulte nossa{' '}
                <Link href="/privacidade" className="text-brand-400 hover:underline">
                  Política de Privacidade
                </Link>{' '}
                para entender quais dados coletamos, como usamos e quais são seus direitos como titular.
              </p>
            </Section>

            <Section icon={AlertCircle} color="#F59E0B" title="6. Disponibilidade do serviço">
              <p>
                O MeuTrein empreende esforços razoáveis para manter a plataforma disponível e funcional,
                mas não garante disponibilidade ininterrupta. Manutenções programadas serão comunicadas
                com antecedência quando possível.
              </p>
              <p>
                Não nos responsabilizamos por danos causados por indisponibilidade temporária,
                falhas de infraestrutura de terceiros ou força maior.
              </p>
            </Section>

            <Section icon={Scale} color="#06B6D4" title="7. Propriedade intelectual">
              <p>
                Todo o conteúdo da plataforma — incluindo código-fonte, design, marca e textos —
                é propriedade exclusiva do MeuTrein ou de seus licenciantes.
              </p>
              <p>
                Os dados inseridos por você (treinos, fichas, cadastros) permanecem de sua propriedade.
                Você nos concede licença limitada para armazená-los e exibi-los conforme necessário
                para a operação do serviço.
              </p>
            </Section>

            <Section icon={FileText} color="#10B981" title="8. Alterações nos termos">
              <p>
                Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas
                por e-mail ou por aviso na plataforma com pelo menos 15 dias de antecedência.
              </p>
              <p>
                O uso continuado após a vigência das mudanças implica aceitação dos novos termos.
              </p>
            </Section>

            <Section icon={Mail} color="#8B5CF6" title="9. Contato">
              <p>
                Dúvidas sobre estes Termos de Uso? Entre em contato:
              </p>
              <p className="mt-2">
                <a
                  href="mailto:contato@gymflow.app"
                  className="text-brand-400 hover:underline font-medium"
                >
                  contato@gymflow.app
                </a>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-4">
                Lei aplicável: legislação brasileira. Foro: comarca de São Paulo — SP.
              </p>
            </Section>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
