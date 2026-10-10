-- =====================================================================
-- Punto Copete — sistema de fidelización por puntos
-- Migración 0001: tablas, libro contable inmutable, funciones y seguridad
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------

-- Código aleatorio sin caracteres ambiguos (sin 0/O, 1/I/L). Solo
-- mayúsculas y números para que el lector USB lo escriba igual con
-- cualquier distribución de teclado.
create or replace function public.random_code(len int)
returns text language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := gen_random_bytes(len);
  result text := '';
begin
  for i in 0 .. len - 1 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return result;
end $$;

create or replace function public.random_token()
returns text language sql volatile as $$
  select translate(encode(gen_random_bytes(32), 'base64'), '+/=', '-_');
$$;

-- Normaliza un RUT: sin puntos ni espacios, con guion y K mayúscula.
-- '12.345.678-k' -> '12345678-K'
create or replace function public.normalize_rut(p_rut text)
returns text language sql immutable as $$
  select case
    when length(c) < 2 then c
    else substr(c, 1, length(c) - 1) || '-' || right(c, 1)
  end
  from (select upper(regexp_replace(coalesce(p_rut, ''), '[^0-9kK]', '', 'g')) as c) s;
$$;

-- Valida el dígito verificador (módulo 11). Recibe el RUT normalizado.
create or replace function public.rut_is_valid(p_rut text)
returns boolean language plpgsql immutable as $$
declare
  body text;
  dv text;
  total int := 0;
  factor int := 2;
  expected text;
  r int;
begin
  if p_rut is null or p_rut !~ '^[0-9]{6,8}-[0-9K]$' then
    return false;
  end if;
  body := split_part(p_rut, '-', 1);
  dv := split_part(p_rut, '-', 2);
  for i in reverse length(body) .. 1 loop
    total := total + substr(body, i, 1)::int * factor;
    factor := case when factor = 7 then 2 else factor + 1 end;
  end loop;
  r := 11 - (total % 11);
  expected := case r when 11 then '0' when 10 then 'K' else r::text end;
  return dv = expected;
end $$;

-- ---------------------------------------------------------------------
-- Configuración del programa (una sola fila)
-- ---------------------------------------------------------------------
create table public.settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Punto Copete',
  logo_url text,
  brand_primary text not null default '#7c2d12',
  brand_secondary text not null default '#f59e0b',
  points_per_1000_clp numeric(6,2) not null default 1 check (points_per_1000_clp > 0),
  points_expiration_months int check (points_expiration_months is null or points_expiration_months > 0),
  welcome_bonus_points int not null default 0 check (welcome_bonus_points >= 0),
  birthday_bonus_points int not null default 0 check (birthday_bonus_points >= 0),
  updated_at timestamptz not null default now()
);

insert into public.settings (id, points_per_1000_clp, points_expiration_months,
                             welcome_bonus_points, birthday_bonus_points)
values (1, 1, 12, 50, 100);

-- ---------------------------------------------------------------------
-- Personal (cajeros y administradores), vinculado a Supabase Auth
-- ---------------------------------------------------------------------
create table public.staff_users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null check (role in ('cashier', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  member_code text not null unique default public.random_code(10),
  rut text not null unique check (public.rut_is_valid(rut)),
  name text not null check (length(trim(name)) > 1),
  phone text,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  birth_date date,
  portal_token text not null unique default public.random_token(),
  marketing_opt_in boolean not null default false,
  terms_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index customers_phone_idx on public.customers (phone);

-- Siempre guardar el RUT normalizado y el correo en minúsculas.
create or replace function public.customers_normalize()
returns trigger language plpgsql as $$
begin
  new.rut := public.normalize_rut(new.rut);
  new.email := lower(trim(new.email));
  new.name := trim(new.name);
  new.phone := nullif(regexp_replace(coalesce(new.phone, ''), '[^0-9+]', '', 'g'), '');
  return new;
end $$;

create trigger customers_normalize
before insert or update on public.customers
for each row execute function public.customers_normalize();

-- ---------------------------------------------------------------------
-- Premios y promociones
-- ---------------------------------------------------------------------
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  points_cost int not null check (points_cost > 0),
  category text not null default 'comida'
    check (category in ('comida', 'bebidas sin alcohol', 'otros')),
  stock int check (stock is null or stock >= 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  highlight boolean not null default false,
  type text not null default 'otro'
    check (type in ('descuento', 'puntos dobles', 'combo', 'otro')),
  multiplier numeric(4,2) check (multiplier is null or multiplier >= 1),
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (type <> 'puntos dobles' or multiplier is not null)
);

-- ---------------------------------------------------------------------
-- LIBRO CONTABLE INMUTABLE
-- ---------------------------------------------------------------------
create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  type text not null check (type in ('earn', 'redeem', 'adjustment', 'bonus', 'expiration')),
  points int not null check (points <> 0),
  purchase_amount_clp int check (purchase_amount_clp is null or purchase_amount_clp > 0),
  receipt_number text,
  reward_id uuid references public.rewards (id) on delete restrict,
  staff_user_id uuid references public.staff_users (id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  -- Reglas de signo y datos obligatorios según el tipo
  check (type not in ('earn', 'bonus') or points > 0),
  check (type not in ('redeem', 'expiration') or points < 0),
  check (type <> 'earn' or (purchase_amount_clp is not null and staff_user_id is not null)),
  check (type <> 'redeem' or (reward_id is not null and staff_user_id is not null)),
  check (type <> 'adjustment' or (staff_user_id is not null and length(trim(coalesce(note, ''))) >= 5))
);

create index point_transactions_customer_idx
  on public.point_transactions (customer_id, created_at desc);

-- Prohibir UPDATE, DELETE y TRUNCATE (incluso con la clave service_role).
create or replace function public.ledger_is_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'El libro de puntos es inmutable: no se puede modificar ni borrar. Usa un movimiento de ajuste.'
    using errcode = 'P0001';
end $$;

create trigger ledger_no_update
before update or delete on public.point_transactions
for each row execute function public.ledger_is_immutable();

create trigger ledger_no_truncate
before truncate on public.point_transactions
for each statement execute function public.ledger_is_immutable();

-- Antes de insertar: los ajustes solo los hace un admin y el saldo
-- nunca queda negativo. Bloquea la fila del cliente para evitar dos
-- canjes simultáneos.
create or replace function public.ledger_before_insert()
returns trigger language plpgsql as $$
declare
  current_balance int;
begin
  perform 1 from public.customers where id = new.customer_id for update;

  if new.type = 'adjustment' and not exists (
    select 1 from public.staff_users
    where id = new.staff_user_id and role = 'admin' and active
  ) then
    raise exception 'Solo un administrador puede hacer ajustes de puntos.' using errcode = 'P0001';
  end if;

  if new.points < 0 then
    select coalesce(sum(points), 0) into current_balance
    from public.point_transactions where customer_id = new.customer_id;
    if current_balance + new.points < 0 then
      raise exception 'Puntos insuficientes: el saldo es % y se intentan descontar %.',
        current_balance, -new.points using errcode = 'P0001';
    end if;
  end if;

  new.created_at := now();
  return new;
end $$;

create trigger ledger_before_insert
before insert on public.point_transactions
for each row execute function public.ledger_before_insert();

-- Saldo calculado SIEMPRE desde el libro.
create view public.customer_balances
with (security_invoker = true) as
select
  c.id as customer_id,
  coalesce(sum(t.points), 0)::int as balance,
  coalesce(sum(t.points) filter (where t.points > 0), 0)::int as total_earned,
  coalesce(-sum(t.points) filter (where t.type = 'redeem'), 0)::int as total_redeemed,
  max(t.created_at) filter (where t.type = 'earn') as last_purchase_at,
  max(t.created_at) as last_activity_at
from public.customers c
left join public.point_transactions t on t.customer_id = c.id
group by c.id;

-- ---------------------------------------------------------------------
-- Notificaciones, wallet, códigos de verificación y límites de uso
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  channel text not null check (channel in ('wallet', 'email')),
  audience jsonb not null default '{"type": "all"}',
  sent_at timestamptz not null default now(),
  sent_by uuid references public.staff_users (id),
  recipients_count int not null default 0
);

create table public.wallet_passes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  platform text not null check (platform in ('apple', 'google')),
  serial_number text not null unique default public.random_token(),
  authentication_token text not null default public.random_token(),
  google_object_id text unique,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (customer_id, platform)
);

create table public.wallet_devices (
  id uuid primary key default gen_random_uuid(),
  pass_id uuid not null references public.wallet_passes (id) on delete cascade,
  device_library_id text not null,
  push_token text not null,
  created_at timestamptz not null default now(),
  unique (pass_id, device_library_id)
);

create table public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null default now() + interval '10 minutes',
  attempts int not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);

-- ---------------------------------------------------------------------
-- Funciones de negocio (las llama el servidor con la clave service_role)
-- ---------------------------------------------------------------------

-- Límite de uso: devuelve true si se permite la acción.
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql as $$
declare
  current_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                        then now() else r.window_start end,
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                then 1 else r.hits + 1 end
  returning hits into current_hits;
  return current_hits <= p_max;
end $$;

-- Inscribir cliente y dar el bono de bienvenida.
create or replace function public.register_customer(
  p_rut text, p_name text, p_phone text, p_email text,
  p_birth_date date, p_marketing_opt_in boolean
) returns public.customers language plpgsql as $$
declare
  normalized text := public.normalize_rut(p_rut);
  cfg public.settings;
  c public.customers;
begin
  if not public.rut_is_valid(normalized) then
    raise exception 'El RUT no es válido.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.customers where rut = normalized) then
    raise exception 'Este RUT ya está inscrito.' using errcode = 'P0001';
  end if;

  insert into public.customers (rut, name, phone, email, birth_date, marketing_opt_in)
  values (normalized, p_name, p_phone, p_email, p_birth_date, coalesce(p_marketing_opt_in, false))
  returning * into c;

  select * into cfg from public.settings where id = 1;
  if cfg.welcome_bonus_points > 0 then
    insert into public.point_transactions (customer_id, type, points, note)
    values (c.id, 'bonus', cfg.welcome_bonus_points, 'Bono de bienvenida');
  end if;

  return c;
end $$;

-- Multiplicador de puntos vigente (la promoción "puntos dobles" más alta activa ahora).
create or replace function public.current_points_multiplier()
returns numeric language sql stable as $$
  select coalesce(max(multiplier), 1)
  from public.promotions
  where active and type = 'puntos dobles'
    and starts_at <= now() and (ends_at is null or ends_at > now());
$$;

-- Calcula los puntos de una compra sin registrarla (para mostrar antes de confirmar).
create or replace function public.preview_earn(p_amount_clp int)
returns int language sql stable as $$
  select floor(p_amount_clp / 1000.0 * s.points_per_1000_clp * public.current_points_multiplier())::int
  from public.settings s where s.id = 1;
$$;

-- Sumar puntos por una compra.
create or replace function public.earn_points(
  p_customer_id uuid, p_amount_clp int, p_receipt_number text, p_staff_user_id uuid
) returns table (points int, balance int, multiplier numeric) language plpgsql as $$
declare
  pts int;
  mult numeric := public.current_points_multiplier();
begin
  if p_amount_clp is null or p_amount_clp <= 0 then
    raise exception 'El monto debe ser mayor a cero.' using errcode = 'P0001';
  end if;
  pts := public.preview_earn(p_amount_clp);
  if pts <= 0 then
    raise exception 'El monto es muy bajo para sumar puntos.' using errcode = 'P0001';
  end if;

  insert into public.point_transactions
    (customer_id, type, points, purchase_amount_clp, receipt_number, staff_user_id, note)
  values
    (p_customer_id, 'earn', pts, p_amount_clp, nullif(trim(p_receipt_number), ''), p_staff_user_id,
     case when mult > 1 then 'Promoción x' || trim_scale(mult)::text end);

  return query
    select pts, b.balance, mult from public.customer_balances b where b.customer_id = p_customer_id;
end $$;

-- Canjear un premio: valida que esté activo, descuenta stock y registra el movimiento negativo.
create or replace function public.redeem_reward(
  p_customer_id uuid, p_reward_id uuid, p_staff_user_id uuid
) returns table (points int, balance int) language plpgsql as $$
declare
  r public.rewards;
begin
  select * into r from public.rewards where id = p_reward_id for update;
  if not found or not r.active then
    raise exception 'Este premio no está disponible.' using errcode = 'P0001';
  end if;
  if r.stock is not null and r.stock <= 0 then
    raise exception 'Este premio no tiene stock.' using errcode = 'P0001';
  end if;

  insert into public.point_transactions (customer_id, type, points, reward_id, staff_user_id, note)
  values (p_customer_id, 'redeem', -r.points_cost, r.id, p_staff_user_id, 'Canje: ' || r.name);

  if r.stock is not null then
    update public.rewards set stock = stock - 1 where id = r.id;
  end if;

  return query
    select -r.points_cost, b.balance from public.customer_balances b where b.customer_id = p_customer_id;
end $$;

-- Ajuste manual (solo admin; el trigger del libro lo verifica).
create or replace function public.adjust_points(
  p_customer_id uuid, p_points int, p_note text, p_staff_user_id uuid
) returns int language plpgsql as $$
declare
  new_balance int;
begin
  if p_points is null or p_points = 0 then
    raise exception 'El ajuste no puede ser cero.' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_note, ''))) < 5 then
    raise exception 'Escribe el motivo del ajuste (mínimo 5 letras).' using errcode = 'P0001';
  end if;
  insert into public.point_transactions (customer_id, type, points, staff_user_id, note)
  values (p_customer_id, 'adjustment', p_points, p_staff_user_id, trim(p_note));
  select balance into new_balance from public.customer_balances where customer_id = p_customer_id;
  return new_balance;
end $$;

-- Vencimiento: si un cliente lleva N meses sin compras, su saldo vence.
-- Se programará para correr cada noche (Fase 5).
create or replace function public.expire_points()
returns int language plpgsql as $$
declare
  months int;
  n int := 0;
  rec record;
begin
  select points_expiration_months into months from public.settings where id = 1;
  if months is null then
    return 0;
  end if;
  for rec in
    select b.customer_id, b.balance
    from public.customer_balances b
    where b.balance > 0
      and coalesce(b.last_purchase_at, (select created_at from public.customers where id = b.customer_id))
          < now() - make_interval(months => months)
  loop
    insert into public.point_transactions (customer_id, type, points, note)
    values (rec.customer_id, 'expiration', -rec.balance,
            'Vencimiento por ' || months || ' meses sin compras');
    n := n + 1;
  end loop;
  return n;
end $$;

-- Bono de cumpleaños: una vez al año, el día del cumpleaños.
create or replace function public.grant_birthday_bonuses()
returns int language plpgsql as $$
declare
  pts int;
  n int := 0;
  rec record;
  today date := (now() at time zone 'America/Santiago')::date;
  label text := 'Bono de cumpleaños ' || extract(year from (now() at time zone 'America/Santiago'))::int;
begin
  select birthday_bonus_points into pts from public.settings where id = 1;
  if pts <= 0 then
    return 0;
  end if;
  for rec in
    select c.id from public.customers c
    where c.birth_date is not null
      and extract(month from c.birth_date) = extract(month from today)
      and extract(day from c.birth_date) = extract(day from today)
      and not exists (
        select 1 from public.point_transactions t
        where t.customer_id = c.id and t.type = 'bonus' and t.note = label)
  loop
    insert into public.point_transactions (customer_id, type, points, note)
    values (rec.id, 'bonus', pts, label);
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------
-- Seguridad: RLS en TODAS las tablas
-- ---------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.staff_users enable row level security;
alter table public.customers enable row level security;
alter table public.rewards enable row level security;
alter table public.promotions enable row level security;
alter table public.point_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.wallet_passes enable row level security;
alter table public.wallet_devices enable row level security;
alter table public.otp_codes enable row level security;
alter table public.rate_limits enable row level security;

-- Lo único público: la carta (premios y promociones activos) y la marca.
create policy "carta: premios activos" on public.rewards
  for select to anon, authenticated using (active);
create policy "carta: promociones vigentes" on public.promotions
  for select to anon, authenticated
  using (active and starts_at <= now() and (ends_at is null or ends_at > now()));
create policy "marca pública" on public.settings
  for select to anon, authenticated using (true);
-- El personal puede ver su propia ficha (para saber su rol al iniciar sesión).
create policy "personal: ver mi ficha" on public.staff_users
  for select to authenticated using (id = auth.uid());

-- No hay políticas de UPDATE ni DELETE en point_transactions: con RLS
-- activado, eso las prohíbe para cualquier usuario. Además el trigger
-- las bloquea incluso para el servidor.

-- Las funciones solo las puede ejecutar el servidor.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
-- Excepto las que usan los triggers y las políticas (se ejecutan con
-- los permisos de quien escribe).
grant execute on function public.rut_is_valid(text) to anon, authenticated;
grant execute on function public.normalize_rut(text) to anon, authenticated;
