-- ============================================================================
-- Esquema inicial (Fase 1-2) para la plataforma "link en bio" de agentes
-- inmobiliarios. Ejecutar este archivo completo en el SQL Editor de Supabase
-- (o vía `supabase db push` si usas el CLI de Supabase).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- organizations: modela cada distribuidor/revendedor como su propia marca
-- blanca. En la Fase 1 solo existirá una organización ("propia"), pero la
-- estructura ya queda lista para la Fase 3 (multi-cliente).
-- ----------------------------------------------------------------------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'own' check (type in ('own', 'distributor')),
  brand_logo_url text,
  brand_color text default '#111827',
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- agents: el perfil público de cada agente inmobiliario (la página "link en bio")
-- ----------------------------------------------------------------------------
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  slug text unique not null,
  full_name text not null default '',
  title text default 'Asesor Inmobiliario',
  bio text default '',
  photo_url text,
  cover_url text,
  phone text,
  email text,
  whatsapp text,
  brand_color text default '#e11d48',
  plan text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_organization_id_idx on agents (organization_id);

-- ----------------------------------------------------------------------------
-- social_links: redes sociales del agente, mostradas como iconos en el perfil
-- ----------------------------------------------------------------------------
create table if not exists social_links (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  platform text not null check (
    platform in ('facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'whatsapp', 'x', 'website')
  ),
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists social_links_agent_id_idx on social_links (agent_id);

-- ----------------------------------------------------------------------------
-- properties: propiedades publicadas en el perfil del agente
-- ----------------------------------------------------------------------------
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  title text not null,
  address text,
  price numeric,
  currency text not null default 'USD',
  status text not null default 'for_sale' check (status in ('featured', 'for_sale', 'sold')),
  photo_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_agent_id_idx on properties (agent_id);

-- ----------------------------------------------------------------------------
-- leads: contactos capturados desde el perfil público (mini CRM)
-- ----------------------------------------------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  name text not null,
  email text,
  phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  source text not null default 'profile',
  created_at timestamptz not null default now()
);

create index if not exists leads_agent_id_idx on leads (agent_id);

-- ----------------------------------------------------------------------------
-- analytics_events: vistas, clics y escaneos de QR para las métricas
-- ----------------------------------------------------------------------------
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  type text not null check (type in ('view', 'click', 'qr_scan')),
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_agent_id_idx on analytics_events (agent_id);

-- ----------------------------------------------------------------------------
-- subscriptions: plan y estado de cobro (Fase 3 / Stripe)
-- ----------------------------------------------------------------------------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  agent_id uuid references agents(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

alter table organizations enable row level security;
alter table agents enable row level security;
alter table social_links enable row level security;
alter table properties enable row level security;
alter table leads enable row level security;
alter table analytics_events enable row level security;
alter table subscriptions enable row level security;

-- agents: el perfil público se puede leer sin login; solo el dueño lo edita
create policy "agents_public_select" on agents
  for select using (true);

create policy "agents_owner_insert" on agents
  for insert with check (auth.uid() = user_id);

create policy "agents_owner_update" on agents
  for update using (auth.uid() = user_id);

create policy "agents_owner_delete" on agents
  for delete using (auth.uid() = user_id);

-- social_links: públicos para lectura, editables solo por el dueño del agente
create policy "social_links_public_select" on social_links
  for select using (true);

create policy "social_links_owner_write" on social_links
  for all using (
    exists (select 1 from agents a where a.id = social_links.agent_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from agents a where a.id = social_links.agent_id and a.user_id = auth.uid())
  );

-- properties: públicas para lectura, editables solo por el dueño del agente
create policy "properties_public_select" on properties
  for select using (true);

create policy "properties_owner_write" on properties
  for all using (
    exists (select 1 from agents a where a.id = properties.agent_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from agents a where a.id = properties.agent_id and a.user_id = auth.uid())
  );

-- leads: cualquier visitante puede crear uno (formulario de contacto),
-- pero solo el agente dueño puede leerlos/actualizarlos
create policy "leads_public_insert" on leads
  for insert with check (true);

create policy "leads_owner_select" on leads
  for select using (
    exists (select 1 from agents a where a.id = leads.agent_id and a.user_id = auth.uid())
  );

create policy "leads_owner_update" on leads
  for update using (
    exists (select 1 from agents a where a.id = leads.agent_id and a.user_id = auth.uid())
  );

create policy "leads_owner_delete" on leads
  for delete using (
    exists (select 1 from agents a where a.id = leads.agent_id and a.user_id = auth.uid())
  );

-- analytics_events: cualquiera puede registrar un evento; solo el dueño lo lee
create policy "analytics_public_insert" on analytics_events
  for insert with check (true);

create policy "analytics_owner_select" on analytics_events
  for select using (
    exists (select 1 from agents a where a.id = analytics_events.agent_id and a.user_id = auth.uid())
  );

-- organizations / subscriptions: por ahora, solo el dueño de la organización
create policy "organizations_owner_all" on organizations
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

create policy "subscriptions_owner_select" on subscriptions
  for select using (
    exists (select 1 from agents a where a.id = subscriptions.agent_id and a.user_id = auth.uid())
    or exists (select 1 from organizations o where o.id = subscriptions.organization_id and o.owner_user_id = auth.uid())
  );

-- ============================================================================
-- Trigger: crear automáticamente un registro en `agents` cuando alguien se
-- registra (usa el user_id como base, con un slug temporal a partir del email)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.agents (user_id, slug, full_name, email)
  values (
    new.id,
    'agente-' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
