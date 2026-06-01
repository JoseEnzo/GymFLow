import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — GymFlow',
  description: 'Como o GymFlow coleta, usa e protege seus dados pessoais, incluindo dados sensíveis de saúde, conforme a LGPD.',
}

const LAST_UPDATED = '01 de junho de 2025'
const TERMS_VERSION = '1.0'

export default function PrivacidadePage() {
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

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-12">
          Versão {TERMS_VERSION} · Atualizada em {LAST_UPDATED}
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Quem somos</h2>
            <p className="text-muted-foreground leading-relaxed">
              O <strong className="text-foreground">GymFlow</strong> é uma plataforma SaaS para gestão de academias,
              desenvolvida e operada por GymFlow Tecnologia Ltda. ("GymFlow", "nós"). Para fins da Lei Geral de
              Proteção de Dados (Lei nº 13.709/2018 — LGPD), somos <strong className="text-foreground">controladores</strong>{' '}
              dos dados de cadastro de usuários e <strong className="text-foreground">operadores</strong> dos dados de
              alunos inseridos pelas academias (estas são as controladoras desses dados).
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Dados que coletamos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-1">2.1 Dados de cadastro</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Nome completo, e-mail, senha (armazenada com hash bcrypt pelo Supabase Auth),
                  CPF/CNPJ (opcional, para identificação da conta), tipo de perfil
                  (proprietário, personal trainer ou aluno) e data de criação da conta.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">2.2 Dados de uso</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Fichas de treino, exercícios realizados, séries e cargas registradas,
                  histórico de sessões de treino e endereço IP (para segurança e auditoria).
                </p>
              </div>
              <div id="dados-saude">
                <h3 className="font-medium text-foreground mb-1">
                  2.3 Dados sensíveis de saúde{' '}
                  <span className="text-xs font-normal text-amber-400 ml-1">LGPD Art. 11</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  O GymFlow permite que academias registrem, com <strong className="text-foreground">consentimento
                  explícito do aluno</strong>, dados de composição corporal: peso, percentual de gordura, massa
                  muscular, índice de massa corporal (IMC), idade metabólica e medidas corporais segmentadas
                  (pescoço, ombro, peito, cintura, abdômen, quadril, braços, antebraços, coxas e panturrilhas).
                  Esses dados são tratados como <strong className="text-foreground">dados sensíveis</strong> nos
                  termos do Art. 11 da LGPD e exigem base legal de consentimento específico.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">2.4 Dados de pagamento</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Dados de cartão de crédito <strong className="text-foreground">não são armazenados</strong> pelo
                  GymFlow. O processamento é realizado diretamente pelo Stripe, que é certificado PCI DSS nível 1.
                  Armazenamos apenas o identificador de cliente Stripe e o status da assinatura.
                </p>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Base legal e finalidade</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-foreground">Dado</th>
                    <th className="text-left py-2 pr-4 font-medium text-foreground">Base legal (LGPD)</th>
                    <th className="text-left py-2 font-medium text-foreground">Finalidade</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Cadastro e autenticação</td>
                    <td className="py-2 pr-4">Execução de contrato (Art. 7º, V)</td>
                    <td className="py-2">Criar e manter a conta</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Dados de treino</td>
                    <td className="py-2 pr-4">Execução de contrato (Art. 7º, V)</td>
                    <td className="py-2">Funcionalidade central da plataforma</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Dados de saúde</td>
                    <td className="py-2 pr-4">Consentimento específico (Art. 11, I)</td>
                    <td className="py-2">Avaliação de composição corporal e progresso físico</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Endereço IP e logs</td>
                    <td className="py-2 pr-4">Legítimo interesse (Art. 7º, IX)</td>
                    <td className="py-2">Segurança, prevenção a fraudes, conformidade LGPD</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Dados de pagamento</td>
                    <td className="py-2 pr-4">Execução de contrato (Art. 7º, V)</td>
                    <td className="py-2">Gestão de assinatura e cobrança</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Compartilhamento com terceiros</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Seus dados são compartilhados apenas com suboperadores necessários para a prestação do serviço,
              todos sujeitos a obrigações contratuais de confidencialidade:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Supabase</strong> — banco de dados e autenticação (servidores na AWS us-east-1)</li>
              <li><strong className="text-foreground">Stripe</strong> — processamento de pagamentos (certificado PCI DSS nível 1)</li>
              <li><strong className="text-foreground">Resend</strong> — envio de e-mails transacionais</li>
              <li><strong className="text-foreground">Sentry</strong> — monitoramento de erros (dados de sessão podem ser capturados em stack traces)</li>
              <li><strong className="text-foreground">Google Maps Platform</strong> — busca de endereço no cadastro de academia</li>
              <li><strong className="text-foreground">Cloudflare Turnstile</strong> — proteção contra bots nas páginas de acesso</li>
              <li><strong className="text-foreground">Upstash Redis</strong> — controle de taxa de requisições (rate limiting)</li>
              <li><strong className="text-foreground">Vercel</strong> — hospedagem e CDN</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Não vendemos, alugamos nem cedemos seus dados a terceiros para fins de marketing.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Retenção de dados</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Dados da conta:</strong> mantidos enquanto a conta estiver ativa. Deletados em até 30 dias após a exclusão da conta.</li>
              <li><strong className="text-foreground">Dados de saúde:</strong> mantidos pelo prazo da assinatura da academia. Podem ser exportados ou excluídos a qualquer momento pelo aluno.</li>
              <li><strong className="text-foreground">Logs de auditoria:</strong> retidos por 2 anos para fins de segurança e conformidade legal, conforme recomendação da ANPD.</li>
              <li><strong className="text-foreground">Dados de pagamento:</strong> retidos pelo Stripe conforme exigência fiscal e regulatória aplicável.</li>
            </ul>
          </section>

          {/* 6 */}
          <section id="seus-direitos">
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Seus direitos (LGPD Art. 18)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Você tem os seguintes direitos em relação aos seus dados pessoais:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Confirmação e acesso:</strong> saber quais dados temos sobre você.</li>
              <li><strong className="text-foreground">Portabilidade:</strong> exportar todos os seus dados em formato JSON — disponível em Configurações → Exportar meus dados.</li>
              <li><strong className="text-foreground">Correção:</strong> atualizar dados incompletos ou desatualizados no seu perfil.</li>
              <li><strong className="text-foreground">Eliminação:</strong> excluir sua conta e todos os dados associados — disponível em Configurações → Excluir conta.</li>
              <li><strong className="text-foreground">Revogação de consentimento:</strong> revogar o consentimento para dados sensíveis de saúde a qualquer momento, sem prejuízo dos tratamentos já realizados.</li>
              <li><strong className="text-foreground">Oposição:</strong> opor-se a tratamentos baseados em legítimo interesse.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Para exercer qualquer direito, acesse as configurações da conta ou entre em contato com nosso
              encarregado (DPO) pelo e-mail abaixo. Respondemos em até 15 dias úteis.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia em trânsito (TLS 1.3),
              isolamento de dados por academia via Row Level Security (RLS), autenticação com hash seguro,
              rate limiting para prevenir ataques de força bruta, Content Security Policy (CSP) e HSTS para
              proteção no navegador, e logs de auditoria para rastreabilidade. Em caso de incidente de segurança
              que possa afetar seus dados, notificaremos a ANPD e os titulares afetados dentro do prazo legal.
            </p>
          </section>

          {/* 8 */}
          <section id="cookies">
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies e rastreamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies estritamente necessários para manter sua sessão autenticada (gerenciados pelo
              Supabase Auth). Não utilizamos cookies de rastreamento publicitário ou pixels de terceiros.
              O Sentry pode coletar identificadores de sessão para correlacionar erros. Você pode desativar
              cookies no navegador, mas isso impedirá o uso da plataforma.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Alterações nesta política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta política periodicamente. Alterações relevantes serão comunicadas por
              e-mail com pelo menos 30 dias de antecedência. O uso continuado após a data de vigência
              constitui aceite da versão atualizada.
            </p>
          </section>

          {/* 10 */}
          <section id="contato">
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Contato e Encarregado (DPO)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre esta política, exercício de direitos ou comunicação de incidentes:
            </p>
            <div className="mt-3 p-4 rounded-lg border border-border bg-card text-sm text-muted-foreground space-y-1">
              <p><strong className="text-foreground">GymFlow Tecnologia Ltda.</strong></p>
              <p>Encarregado de Proteção de Dados (DPO): privacidade@gymflow.app</p>
              <p>Autoridade supervisora: Autoridade Nacional de Proteção de Dados (ANPD) — <span className="text-teal-500">gov.br/anpd</span></p>
            </div>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GymFlow Tecnologia Ltda. — CNPJ 00.000.000/0001-00
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
              Termos de Uso
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
