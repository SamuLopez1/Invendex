create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'seller');
create type public.payment_method as enum ('cash', 'card', 'transfer', 'nequi', 'other');
create type public.inventory_movement_type as enum (
  'purchase',
  'sale',
  'adjustment',
  'damaged',
  'gift',
  'internal_consumption'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'seller',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  purchase_price numeric(12, 2) not null default 0 check (purchase_price >= 0),
  sale_price numeric(12, 2) not null default 0 check (sale_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default (timezone('America/Bogota', now())::date),
  payment_method public.payment_method not null,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  total_cost numeric(12, 2) not null check (total_cost >= 0),
  gross_profit numeric(12, 2) not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  unit_cost numeric(12, 2) not null check (unit_cost >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  profit numeric(12, 2) not null
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_type public.inventory_movement_type not null,
  quantity integer not null check (quantity <> 0),
  reason text not null,
  related_sale_id uuid references public.sales(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.daily_closings (
  id uuid primary key default gen_random_uuid(),
  closing_date date not null unique,
  total_sales numeric(12, 2) not null default 0,
  total_cost numeric(12, 2) not null default 0,
  gross_profit numeric(12, 2) not null default 0,
  cash_total numeric(12, 2) not null default 0,
  card_total numeric(12, 2) not null default 0,
  transfer_total numeric(12, 2) not null default 0,
  nequi_total numeric(12, 2) not null default 0,
  other_total numeric(12, 2) not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index products_name_idx on public.products using gin (to_tsvector('simple', name));
create index products_category_idx on public.products (category);
create index sales_sale_date_idx on public.sales (sale_date);
create index sale_items_sale_id_idx on public.sale_items (sale_id);
create index sale_items_product_id_idx on public.sale_items (product_id);
create index inventory_movements_product_id_idx on public.inventory_movements (product_id);
create index inventory_movements_created_at_idx on public.inventory_movements (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'seller')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.daily_closings enable row level security;

create policy "Users can view their profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Admins can update profiles"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users can view products"
on public.products for select
to authenticated
using (true);

create policy "Admins can insert products"
on public.products for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update products"
on public.products for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users can view sales"
on public.sales for select
to authenticated
using (public.is_admin() or created_by = auth.uid() or public.current_user_role() = 'seller');

create policy "Authenticated users can view sale items"
on public.sale_items for select
to authenticated
using (
  exists (
    select 1 from public.sales
    where sales.id = sale_items.sale_id
  )
);

create policy "Authenticated users can view movements"
on public.inventory_movements for select
to authenticated
using (true);

create policy "Authenticated users can view closings"
on public.daily_closings for select
to authenticated
using (true);

create or replace function public.register_sale(
  p_payment_method public.payment_method,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_user_id uuid := auth.uid();
  v_product public.products%rowtype;
  v_total_amount numeric(12, 2) := 0;
  v_total_cost numeric(12, 2) := 0;
  v_gross_profit numeric(12, 2) := 0;
  v_item record;
begin
  if v_user_id is null then
    raise exception 'Debe iniciar sesion para registrar ventas.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe tener al menos un producto.';
  end if;

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity integer)
    group by product_id
  loop
    if v_item.quantity <= 0 then
      raise exception 'La cantidad de venta debe ser mayor a cero.';
    end if;

    select *
    into v_product
    from public.products
    where id = v_item.product_id and is_active = true
    for update;

    if not found then
      raise exception 'Producto no disponible: %', v_item.product_id;
    end if;

    if v_product.stock < v_item.quantity then
      raise exception 'Stock insuficiente para %. Disponible: %, solicitado: %',
        v_product.name, v_product.stock, v_item.quantity;
    end if;

    v_total_amount := v_total_amount + (v_product.sale_price * v_item.quantity);
    v_total_cost := v_total_cost + (v_product.purchase_price * v_item.quantity);
  end loop;

  v_gross_profit := v_total_amount - v_total_cost;

  insert into public.sales (
    payment_method,
    total_amount,
    total_cost,
    gross_profit,
    created_by
  )
  values (
    p_payment_method,
    v_total_amount,
    v_total_cost,
    v_gross_profit,
    v_user_id
  )
  returning id into v_sale_id;

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity integer)
    group by product_id
  loop
    select *
    into v_product
    from public.products
    where id = v_item.product_id
    for update;

    insert into public.sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      unit_cost,
      subtotal,
      profit
    )
    values (
      v_sale_id,
      v_product.id,
      v_item.quantity,
      v_product.sale_price,
      v_product.purchase_price,
      v_product.sale_price * v_item.quantity,
      (v_product.sale_price - v_product.purchase_price) * v_item.quantity
    );

    update public.products
    set stock = stock - v_item.quantity
    where id = v_product.id;

    insert into public.inventory_movements (
      product_id,
      movement_type,
      quantity,
      reason,
      related_sale_id,
      created_by
    )
    values (
      v_product.id,
      'sale',
      -v_item.quantity,
      'Venta registrada',
      v_sale_id,
      v_user_id
    );
  end loop;

  return v_sale_id;
end;
$$;

create or replace function public.record_inventory_movement(
  p_product_id uuid,
  p_movement_type public.inventory_movement_type,
  p_quantity integer,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_product public.products%rowtype;
  v_delta integer;
  v_movement_id uuid;
begin
  if v_user_id is null then
    raise exception 'Debe iniciar sesion para mover inventario.';
  end if;

  if not public.is_admin() then
    raise exception 'Solo un administrador puede ajustar inventario.';
  end if;

  if p_quantity = 0 then
    raise exception 'La cantidad del movimiento no puede ser cero.';
  end if;

  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Debe indicar una razon clara para el movimiento.';
  end if;

  if p_movement_type = 'sale' then
    raise exception 'Los movimientos de venta solo se crean al confirmar una venta.';
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Producto no encontrado.';
  end if;

  v_delta := case
    when p_movement_type = 'purchase' then abs(p_quantity)
    when p_movement_type = 'adjustment' then p_quantity
    else -abs(p_quantity)
  end;

  if v_product.stock + v_delta < 0 then
    raise exception 'El movimiento deja el stock en negativo. Stock actual: %, cambio: %',
      v_product.stock, v_delta;
  end if;

  update public.products
  set stock = stock + v_delta
  where id = p_product_id;

  insert into public.inventory_movements (
    product_id,
    movement_type,
    quantity,
    reason,
    created_by
  )
  values (
    p_product_id,
    p_movement_type,
    v_delta,
    p_reason,
    v_user_id
  )
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

create or replace function public.daily_sales_summary(p_summary_date date default timezone('America/Bogota', now())::date)
returns table (
  closing_date date,
  total_sales numeric(12, 2),
  total_cost numeric(12, 2),
  gross_profit numeric(12, 2),
  cash_total numeric(12, 2),
  card_total numeric(12, 2),
  transfer_total numeric(12, 2),
  nequi_total numeric(12, 2),
  other_total numeric(12, 2),
  sales_count bigint,
  already_closed boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p_summary_date as closing_date,
    coalesce(sum(total_amount), 0)::numeric(12, 2) as total_sales,
    coalesce(sum(total_cost), 0)::numeric(12, 2) as total_cost,
    coalesce(sum(gross_profit), 0)::numeric(12, 2) as gross_profit,
    coalesce(sum(total_amount) filter (where payment_method = 'cash'), 0)::numeric(12, 2) as cash_total,
    coalesce(sum(total_amount) filter (where payment_method = 'card'), 0)::numeric(12, 2) as card_total,
    coalesce(sum(total_amount) filter (where payment_method = 'transfer'), 0)::numeric(12, 2) as transfer_total,
    coalesce(sum(total_amount) filter (where payment_method = 'nequi'), 0)::numeric(12, 2) as nequi_total,
    coalesce(sum(total_amount) filter (where payment_method = 'other'), 0)::numeric(12, 2) as other_total,
    count(*) as sales_count,
    exists (
      select 1 from public.daily_closings
      where daily_closings.closing_date = p_summary_date
    ) as already_closed
  from public.sales
  where sale_date = p_summary_date;
$$;

create or replace function public.close_day(p_closing_date date default timezone('America/Bogota', now())::date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_summary record;
  v_closing_id uuid;
begin
  if v_user_id is null then
    raise exception 'Debe iniciar sesion para cerrar el dia.';
  end if;

  if not public.is_admin() then
    raise exception 'Solo un administrador puede cerrar el dia.';
  end if;

  if exists (select 1 from public.daily_closings where closing_date = p_closing_date) then
    raise exception 'Este dia ya fue cerrado.';
  end if;

  select *
  into v_summary
  from public.daily_sales_summary(p_closing_date);

  insert into public.daily_closings (
    closing_date,
    total_sales,
    total_cost,
    gross_profit,
    cash_total,
    card_total,
    transfer_total,
    nequi_total,
    other_total,
    created_by
  )
  values (
    p_closing_date,
    v_summary.total_sales,
    v_summary.total_cost,
    v_summary.gross_profit,
    v_summary.cash_total,
    v_summary.card_total,
    v_summary.transfer_total,
    v_summary.nequi_total,
    v_summary.other_total,
    v_user_id
  )
  returning id into v_closing_id;

  return v_closing_id;
end;
$$;

grant execute on function public.register_sale(public.payment_method, jsonb) to authenticated;
grant execute on function public.record_inventory_movement(uuid, public.inventory_movement_type, integer, text) to authenticated;
grant execute on function public.daily_sales_summary(date) to authenticated;
grant execute on function public.close_day(date) to authenticated;
