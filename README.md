# Gestor de Planillas

Aplicación Next.js para gestionar turnos hospitalarios, cambios de turno y planillas mensuales.

## Desarrollo

1. Copia `.env.example` a `.env.local`.
2. Añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Ejecuta la migración `supabase/migrations/001_initial_schema.sql` en Supabase.
4. Arranca la app:

```bash
npm run dev
```

## Comandos

```bash
npm run test
npm run build
```
