# FFFinanzas v3

App de finanzas personales — reescritura de [FFFinanzas v2] con el **modelo de fondo único**:
la plata es un único pozo por moneda; las "cuentas" son etiquetas (medio de pago) que solo
aplican al egreso. Sin saldo por cuenta, sin transferencias.

> Diseño y decisiones completas en **[PLAN.md](PLAN.md)**.

## Stack

- **Backend:** Node (ESM), Express 5, `postgres` (porsager), JWT + bcrypt, zod. Modular por
  recurso (`src/modules/<recurso>/{routes,controller,service,schema}`).
- **Frontend:** React 18 + Vite, Redux Toolkit + **RTK Query**, **shadcn/ui** + Tailwind,
  Recharts, Phosphor icons, sonner. Organización feature-based (`src/features/<feature>/`).
- **DB:** PostgreSQL. Schema en `.database/`.

## Estructura

```
FFFinanzas-v3/
├── PLAN.md            # plan de diseño (bd, back, front, modularización)
├── backend/           # API Express modular
├── frontend/          # SPA React + Vite + shadcn
└── .database/         # schema + migración v2 -> v3
```

## Estado

En diseño. Ver el roadmap por fases en [PLAN.md](PLAN.md) §7.
