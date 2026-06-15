# Noches de Luna Inventory MVP

Aplicacion privada para inventario, ventas y cierre diario de una licorera, bar o discoteca.

## Arquitectura Propuesta

- **Frontend:** Next.js App Router con TypeScript y Tailwind CSS.
- **Auth y base de datos:** Supabase Auth + PostgreSQL.
- **Reglas criticas:** funciones RPC en PostgreSQL para ventas, movimientos de inventario y cierre diario.
- **Despliegue:** estructura compatible con Vercel.
- **Roles:** `admin` administra productos, stock, ventas y cierres; `seller` registra ventas y consulta inventario basico.

## Modelo de Datos

- `profiles`: perfil del usuario autenticado y rol.
- `products`: catalogo e inventario actual.
- `sales`: encabezado de venta.
- `sale_items`: detalle de productos vendidos.
- `inventory_movements`: historial completo de cambios de stock.
- `daily_closings`: resumen diario congelado al cierre.

La venta se confirma con `register_sale`, una funcion transaccional que:

1. Bloquea productos involucrados.
2. Valida stock disponible.
3. Calcula total, costo y utilidad.
4. Inserta venta y detalle.
5. Resta stock.
6. Crea movimientos de inventario.

## Estructura

```text
src/app
  (auth)/login
  (protected)/dashboard
  (protected)/inventory
  (protected)/sales/new
  (protected)/closing
src/components
src/lib
src/services
src/types
supabase/migrations
```

## Orden de Implementacion

1. Scaffold Next.js + Tailwind + Supabase.
2. Migracion SQL con tablas, RLS, triggers y RPC.
3. Tipos TypeScript de entidades.
4. Servicios reutilizables por modulo.
5. Pantallas MVP: login, dashboard, inventario, venta rapida y cierre diario.
6. Validacion con Supabase local/remoto y ajustes de UX.

## Configuracion

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/migrations/001_initial_schema.sql`.
3. Copia `.env.example` a `.env.local` y agrega:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Instala dependencias y ejecuta:

```bash
npm install
npm run dev
```

## Datos Demo

Despues de crear al menos un usuario en Supabase Authentication, puedes cargar productos, movimientos y dos ventas de prueba desde:

```text
supabase/seed_dummy_data.sql
```

Pegalo en Supabase SQL Editor y ejecutalo. El seed es idempotente: si lo corres de nuevo no deberia duplicar los productos ni las ventas demo.
