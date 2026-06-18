# FFFinanzas v3 — Frontend

SPA privada (Vite + React 18) del modelo de **fondo único**. Ver el diseño completo en
[`../PLAN.md`](../PLAN.md) §5.

## Stack

- **Vite + React 18**
- **Redux Toolkit + RTK Query** — un api-slice por recurso sobre `app/apiSlice.js` (cache +
  invalidación por tags). Nada de slice monolítico.
- **react-router-dom** — navegación por sección con URLs reales.
- **shadcn/ui + Tailwind** — componentes propios en `components/ui/`, customizados a los tokens
  de PLAN §5.1 (warm monochrome, radius 10px/6px, sin gradientes).
- **Phosphor** (`@phosphor-icons/react`) para íconos — sin lucide.
- **sonner** para toasts, **Recharts** (vía shadcn chart) para gráficos.
- Fuentes self-hosted (`@fontsource`): Newsreader (display) · Geist (sans) · Geist Mono (tabular).

## Estructura

Feature-based (`src/features/<feature>/`): cada feature co-localiza su api-slice y componentes.
Ver PLAN §5.5.

## Desarrollo

```bash
cp .env.example .env      # VITE_API_URL → backend (default http://localhost:3006/api)
npm install
npm run dev               # http://localhost:5173
```

El backend debe correr aparte (`../backend`) con `CORS_ORIGIN=http://localhost:5173`.

## Scripts

- `npm run dev` — dev server.
- `npm run build` — build de producción.
- `npm run preview` — sirve el build.
- `npm run lint` — eslint.
