-- Tabela para garantir idempotência dos eventos Stripe
create table if not exists stripe_processed_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

-- Apenas o service_role pode inserir/ler (webhook usa admin client)
alter table stripe_processed_events enable row level security;

create policy "Service role only"
  on stripe_processed_events
  using (false);
