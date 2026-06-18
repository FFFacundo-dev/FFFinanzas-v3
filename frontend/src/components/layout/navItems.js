import {
  House,
  Receipt,
  CreditCard,
  ArrowsClockwise,
  ChartPieSlice,
  Gear,
} from '@phosphor-icons/react'

// Secciones (PLAN §5.3). No hay "Cuentas" como saldos: los medios se gestionan
// desde modales en Ajustes/Movimientos.
export const navItems = [
  { to: '/', label: 'Dashboard', icon: House, end: true },
  { to: '/movimientos', label: 'Movimientos', icon: Receipt },
  { to: '/cuotas', label: 'Cuotas', icon: CreditCard },
  { to: '/subs', label: 'Subs / Fijos', icon: ArrowsClockwise },
  { to: '/presupuesto', label: 'Presupuesto', icon: ChartPieSlice },
  { to: '/ajustes', label: 'Ajustes', icon: Gear },
]
