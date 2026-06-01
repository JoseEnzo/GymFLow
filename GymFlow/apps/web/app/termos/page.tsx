import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — GymFlow',
  description: 'Condições de uso da plataforma GymFlow para academias, personais e alunos.',
}

const LAST_UPDATED = '01 de junho de 2025'
const TERMS_VERSION = '1.0'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          ← Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-12">
          Versão {TERMS_VERSION} · Atualizada em {LAST_UPDATED}
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Partes e aceitação</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso ("Termos") regulam o acesso e o uso da plataforma GymFlow,
              operada por GymFlow Tecnologia Ltda. ("GymFlow"), por academias, personal trainers e
              alunos ("Usuários"). Ao criar uma conta ou utilizar o serviço, você declara ter lido,
              compreendido e aceito integralmente estes Termos. Se não concordar, não utilize a plataforma.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Descrição do serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O GymFlow é uma plataforma SaaS multi-tenant que permite a academias gerenciar alunos,
              personal trainers criarem fichas de treino e acompanharem o progresso de alunos, e alunos
              registrarem sessões de treino, evolução física e histórico de atividades. O acesso é
              condicionado ao pagamento de uma assinatura válida (para academias) ou a um convite ativo
              de uma academia participante.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Contas e responsabilidades</h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                <strong className="text-foreground">3.1</strong> Você é responsável por manter a
                confidencialidade de suas credenciais de acesso e por todas as atividades realizadas
                em sua conta. Notifique-nos imediatamente em caso de acesso não autorizado.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">3.2</strong> É proibido: compartilhar contas entre
                múltiplos usuários, realizar engenharia reversa do serviço, utilizar a plataforma para
                fins ilegais, ou tentar acessar dados de outras academias ou usuários.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">3.3</strong> O GymFlow reserva-se o direito de
                suspender contas que violem estes Termos, com ou sem aviso prévio, dependendo da gravidade
                da infração.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Planos, pagamentos e cancelamento</h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                <strong className="text-foreground">4.1 Planos:</strong> O GymFlow oferece planos de
                assinatura mensais. Os valores e recursos de cada plano estão descritos na página de
                preços, sujeitos a alteração com aviso prévio de 30 dias.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">4.2 Cobrança:</strong> As assinaturas são cobradas
                antecipadamente, no início de cada ciclo mensal, via cartão de crédito processado pelo
                Stripe. Falhas de pagamento resultarão em notificação por e-mail; após 7 dias sem
                regularização, o acesso poderá ser suspenso.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">4.3 Cancelamento:</strong> Você pode cancelar sua
                assinatura a qualquer momento nas configurações da conta. O acesso permanece ativo até
                o fim do período já pago. Não há reembolso proporcional de períodos não utilizados,
                exceto nos casos previstos no Código de Defesa do Consumidor (Lei nº 8.078/1990).
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">4.4 Direito de arrependimento:</strong> Usuários
                que contrataram o serviço pela internet têm direito ao cancelamento sem ônus em até
                7 dias corridos da contratação, nos termos do Art. 49 do CDC.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Dados pessoais e LGPD</h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                <strong className="text-foreground">5.1 Responsabilidade pelos dados dos alunos:</strong>{' '}
                As academias são as <strong className="text-foreground">controladoras</strong> dos dados
                pessoais de seus alunos inseridos na plataforma, nos termos da LGPD. O GymFlow atua como
                <strong className="text-foreground"> operador</strong>, processando esses dados exclusivamente
                conforme instruído pela academia e para os fins descritos nestes Termos.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">5.2 Obrigações da academia:</strong> A academia é
                responsável por: (a) obter o consentimento dos alunos para o tratamento de seus dados,
                incluindo dados sensíveis de saúde; (b) informar os alunos sobre o uso da plataforma;
                (c) atender às solicitações de exercício de direitos dos titulares (acesso, correção,
                exclusão e portabilidade), utilizando os recursos disponíveis na plataforma.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">5.3 Dados sensíveis:</strong> O registro de dados de
                composição corporal (bioimpedância, medidas) somente deve ser realizado com o consentimento
                explícito do aluno, conforme exigido pelo Art. 11 da LGPD. A funcionalidade exige confirmação
                do personal trainer de que esse consentimento foi obtido.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">5.4 Tratamento de dados do GymFlow:</strong> O tratamento
                dos seus dados pessoais de cadastro é descrito em nossa{' '}
                <Link href="/privacidade" className="text-teal-500 hover:text-teal-400 underline">
                  Política de Privacidade
                </Link>.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Disponibilidade e suporte</h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                <strong className="text-foreground">6.1</strong> O GymFlow se esforça para manter a
                plataforma disponível 24/7, mas não garante disponibilidade ininterrupta. Manutenções
                programadas serão comunicadas com antecedência.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">6.2</strong> O suporte é prestado via e-mail e
                canais indicados na plataforma, em dias úteis, no horário comercial de Brasília.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Limitação de responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O GymFlow não se responsabiliza por: (a) danos decorrentes de uso indevido da plataforma
              pelo usuário ou terceiros; (b) perda de dados causada por falha de infraestrutura de
              terceiros (Supabase, Vercel, AWS); (c) recomendações de treino — o GymFlow é uma ferramenta
              de gestão, não substitui a avaliação profissional de educadores físicos; (d) danos indiretos,
              lucros cessantes ou danos morais decorrentes de indisponibilidade do serviço, exceto nos
              casos previstos em lei. A responsabilidade total do GymFlow por qualquer evento fica limitada
              ao valor pago nos últimos 3 meses de assinatura.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Propriedade intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todos os direitos sobre o software, design, marca e conteúdo da plataforma pertencem ao
              GymFlow. Os dados inseridos pelos usuários permanecem de propriedade dos usuários (ou das
              academias, no caso de dados de alunos). O GymFlow não reivindica propriedade sobre o
              conteúdo gerado pelos usuários.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Alterações nos termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              O GymFlow pode modificar estes Termos com aviso prévio de 30 dias por e-mail. O uso
              continuado da plataforma após a data de vigência da nova versão constitui aceite dos
              termos atualizados. Em caso de discordância, o usuário deve cancelar sua conta antes
              da data de vigência.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Foro e lei aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos são regidos pela legislação brasileira, em especial a Lei nº 13.709/2018
              (LGPD), a Lei nº 8.078/1990 (CDC) e a Lei nº 12.965/2014 (Marco Civil da Internet).
              Fica eleito o foro da comarca de [cidade/estado da sede do GymFlow] para dirimir
              quaisquer controvérsias, com renúncia expressa a qualquer outro, por mais privilegiado
              que seja.
            </p>
          </section>

          {/* Contato */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contato</h2>
            <div className="p-4 rounded-lg border border-border bg-card text-sm text-muted-foreground space-y-1">
              <p><strong className="text-foreground">GymFlow Tecnologia Ltda.</strong></p>
              <p>contato@gymflow.app</p>
              <p>
                Para questões sobre dados pessoais, consulte nossa{' '}
                <Link href="/privacidade#contato" className="text-teal-500 hover:text-teal-400 underline">
                  Política de Privacidade
                </Link>.
              </p>
            </div>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GymFlow Tecnologia Ltda. — CNPJ 00.000.000/0001-00
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Início
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
