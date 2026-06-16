do $$
begin
  create temp table if not exists demo_sale_ids_to_delete (
    id uuid primary key
  ) on commit drop;

  insert into demo_sale_ids_to_delete (id)
  select distinct related_sale_id
  from public.inventory_movements
  where reason in (
    'Venta demo seed - caja 1',
    'Venta demo seed - caja 2'
  )
  and related_sale_id is not null
  on conflict (id) do nothing;

  delete from public.inventory_movements
  where reason in (
    'Venta demo seed - caja 1',
    'Venta demo seed - caja 2'
  );

  delete from public.sales
  where id in (
    select id
    from demo_sale_ids_to_delete
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
  set stock = demo_products.stock
  from demo_products
  where products.name = demo_products.name;
end;
$$;
