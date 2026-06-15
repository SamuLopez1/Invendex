do $$
declare
  v_user_id uuid;
  v_sale_id uuid;
  v_total_amount numeric(12, 2);
  v_total_cost numeric(12, 2);
begin
  select id
  into v_user_id
  from auth.users
  order by created_at
  limit 1;

  if v_user_id is null then
    raise exception 'Crea al menos un usuario en Authentication > Users antes de correr este seed.';
  end if;

  insert into public.products (name, category, stock, min_stock, purchase_price, sale_price)
  select *
  from (
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
  ) as seed_products(name, category, stock, min_stock, purchase_price, sale_price)
  where not exists (
    select 1
    from public.products
    where products.name = seed_products.name
  );

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
  and products.stock > 0
  and not exists (
    select 1
    from public.inventory_movements
    where inventory_movements.product_id = products.id
      and inventory_movements.reason = 'Carga inicial demo'
  );

  if not exists (
    select 1
    from public.inventory_movements
    where reason = 'Venta demo seed - caja 1'
  ) then
    with items(product_name, quantity) as (
      values
        ('Cerveza Poker 330ml', 8),
        ('Cerveza Club Colombia 330ml', 6),
        ('Aguardiente Antioqueno 750ml', 2),
        ('Red Bull 250ml', 4)
    )
    select
      sum(products.sale_price * items.quantity),
      sum(products.purchase_price * items.quantity)
    into v_total_amount, v_total_cost
    from items
    join public.products on products.name = items.product_name;

    insert into public.sales (
      payment_method,
      total_amount,
      total_cost,
      gross_profit,
      created_by
    )
    values (
      'cash',
      v_total_amount,
      v_total_cost,
      v_total_amount - v_total_cost,
      v_user_id
    )
    returning id into v_sale_id;

    with items(product_name, quantity) as (
      values
        ('Cerveza Poker 330ml', 8),
        ('Cerveza Club Colombia 330ml', 6),
        ('Aguardiente Antioqueno 750ml', 2),
        ('Red Bull 250ml', 4)
    )
    insert into public.sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      unit_cost,
      subtotal,
      profit
    )
    select
      v_sale_id,
      products.id,
      items.quantity,
      products.sale_price,
      products.purchase_price,
      products.sale_price * items.quantity,
      (products.sale_price - products.purchase_price) * items.quantity
    from items
    join public.products on products.name = items.product_name;

    with items(product_name, quantity) as (
      values
        ('Cerveza Poker 330ml', 8),
        ('Cerveza Club Colombia 330ml', 6),
        ('Aguardiente Antioqueno 750ml', 2),
        ('Red Bull 250ml', 4)
    )
    update public.products
    set stock = products.stock - items.quantity
    from items
    where products.name = items.product_name;

    with items(product_name, quantity) as (
      values
        ('Cerveza Poker 330ml', 8),
        ('Cerveza Club Colombia 330ml', 6),
        ('Aguardiente Antioqueno 750ml', 2),
        ('Red Bull 250ml', 4)
    )
    insert into public.inventory_movements (
      product_id,
      movement_type,
      quantity,
      reason,
      related_sale_id,
      created_by
    )
    select
      products.id,
      'sale',
      -items.quantity,
      'Venta demo seed - caja 1',
      v_sale_id,
      v_user_id
    from items
    join public.products on products.name = items.product_name;
  end if;

  if not exists (
    select 1
    from public.inventory_movements
    where reason = 'Venta demo seed - caja 2'
  ) then
    with items(product_name, quantity) as (
      values
        ('Ron Medellin 750ml', 1),
        ('Agua botella 600ml', 3),
        ('Coca-Cola 1.5L', 2),
        ('Tequila Jose Cuervo 750ml', 1)
    )
    select
      sum(products.sale_price * items.quantity),
      sum(products.purchase_price * items.quantity)
    into v_total_amount, v_total_cost
    from items
    join public.products on products.name = items.product_name;

    insert into public.sales (
      payment_method,
      total_amount,
      total_cost,
      gross_profit,
      created_by
    )
    values (
      'nequi',
      v_total_amount,
      v_total_cost,
      v_total_amount - v_total_cost,
      v_user_id
    )
    returning id into v_sale_id;

    with items(product_name, quantity) as (
      values
        ('Ron Medellin 750ml', 1),
        ('Agua botella 600ml', 3),
        ('Coca-Cola 1.5L', 2),
        ('Tequila Jose Cuervo 750ml', 1)
    )
    insert into public.sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      unit_cost,
      subtotal,
      profit
    )
    select
      v_sale_id,
      products.id,
      items.quantity,
      products.sale_price,
      products.purchase_price,
      products.sale_price * items.quantity,
      (products.sale_price - products.purchase_price) * items.quantity
    from items
    join public.products on products.name = items.product_name;

    with items(product_name, quantity) as (
      values
        ('Ron Medellin 750ml', 1),
        ('Agua botella 600ml', 3),
        ('Coca-Cola 1.5L', 2),
        ('Tequila Jose Cuervo 750ml', 1)
    )
    update public.products
    set stock = products.stock - items.quantity
    from items
    where products.name = items.product_name;

    with items(product_name, quantity) as (
      values
        ('Ron Medellin 750ml', 1),
        ('Agua botella 600ml', 3),
        ('Coca-Cola 1.5L', 2),
        ('Tequila Jose Cuervo 750ml', 1)
    )
    insert into public.inventory_movements (
      product_id,
      movement_type,
      quantity,
      reason,
      related_sale_id,
      created_by
    )
    select
      products.id,
      'sale',
      -items.quantity,
      'Venta demo seed - caja 2',
      v_sale_id,
      v_user_id
    from items
    join public.products on products.name = items.product_name;
  end if;
end;
$$;
