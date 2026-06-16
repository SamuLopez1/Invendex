do $$
declare
  v_user_id uuid;
begin
  select id
  into v_user_id
  from auth.users
  order by created_at
  limit 1;

  if v_user_id is null then
    raise exception 'Crea al menos un usuario en Authentication > Users antes de correr este seed.';
  end if;

  with seed_products(name, category, stock, min_stock, purchase_price, sale_price) as (
    values
      ('Aguardiente Antioqueno 750ml', 'Aguardiente', 12, 4, 32000, 55000),
      ('Ron Medellin 750ml', 'Ron', 8, 3, 42000, 75000),
      ('Whisky Old Parr 750ml', 'Whisky', 3, 2, 110000, 180000),
      ('Cerveza Club Colombia 330ml', 'Cerveza', 48, 12, 2200, 6000),
      ('Cerveza Poker 330ml', 'Cerveza', 60, 18, 1800, 5000),
      ('Vodka Absolut 700ml', 'Vodka', 5, 2, 65000, 120000),
      ('Tequila Jose Cuervo 750ml', 'Tequila', 4, 2, 72000, 135000),
      ('Red Bull 250ml', 'Mezcladores', 20, 8, 5500, 12000),
      ('Agua botella 600ml', 'Sin alcohol', 24, 10, 800, 3000),
      ('Coca-Cola 1.5L', 'Mezcladores', 6, 4, 3500, 9000),
      ('Limon unidad', 'Insumos', 10, 12, 250, 1000),
      ('Hielo bolsa 5kg', 'Insumos', 2, 5, 4500, 10000)
  )
  insert into public.products (
    name,
    category,
    stock,
    min_stock,
    purchase_price,
    sale_price
  )
  select
    seed_products.name,
    seed_products.category,
    seed_products.stock,
    seed_products.min_stock,
    seed_products.purchase_price,
    seed_products.sale_price
  from seed_products
  where not exists (
    select 1
    from public.products
    where products.name = seed_products.name
  );

  with demo_products(name, stock) as (
    values
      ('Aguardiente Antioqueno 750ml', 12),
      ('Ron Medellin 750ml', 8),
      ('Whisky Old Parr 750ml', 3),
      ('Cerveza Club Colombia 330ml', 48),
      ('Cerveza Poker 330ml', 60),
      ('Vodka Absolut 700ml', 5),
      ('Tequila Jose Cuervo 750ml', 4),
      ('Red Bull 250ml', 20),
      ('Agua botella 600ml', 24),
      ('Coca-Cola 1.5L', 6),
      ('Limon unidad', 10),
      ('Hielo bolsa 5kg', 2)
  )
  update public.products
  set
    stock = demo_products.stock,
    is_active = true
  from demo_products
  where products.name = demo_products.name;

  insert into public.inventory_movements (
    product_id,
    movement_type,
    quantity,
    reason,
    created_by
  )
  select
    products.id,
    'purchase',
    products.stock,
    'Carga inicial demo',
    v_user_id
  from public.products
  where products.name in (
    'Aguardiente Antioqueno 750ml',
    'Ron Medellin 750ml',
    'Whisky Old Parr 750ml',
    'Cerveza Club Colombia 330ml',
    'Cerveza Poker 330ml',
    'Vodka Absolut 700ml',
    'Tequila Jose Cuervo 750ml',
    'Red Bull 250ml',
    'Agua botella 600ml',
    'Coca-Cola 1.5L',
    'Limon unidad',
    'Hielo bolsa 5kg'
  )
  and not exists (
    select 1
    from public.inventory_movements
    where inventory_movements.product_id = products.id
      and inventory_movements.reason = 'Carga inicial demo'
  );
end;
$$;
