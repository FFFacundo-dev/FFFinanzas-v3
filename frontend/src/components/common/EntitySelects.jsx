import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetCurrenciesQuery } from '@/features/currencies/currenciesApi'
import { useGetCategoriesQuery } from '@/features/categories/categoriesApi'
import { useGetAccountsQuery } from '@/features/accounts/accountsApi'
import { useGetGoalsQuery } from '@/features/goals/goalsApi'

export const NONE = '__none__'

/** Selector de moneda (código). */
export function CurrencySelect({ value, onChange, className }) {
  const { data: currencies = [] } = useGetCurrenciesQuery()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Selector de categoría con opción "sin categoría" (value = NONE). */
export function CategorySelect({ value, onChange, className }) {
  const { data: categories = [] } = useGetCategoriesQuery()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Sin categoría" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Sin categoría</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Selector de meta para "pagar con dinero reservado" (value = NONE = no usar meta).
 * Solo metas hoja, activas, de la misma moneda y con algo reservado.
 */
export function GoalSelect({ value, onChange, currency, className }) {
  const { data: goals = [] } = useGetGoalsQuery()
  const parentIds = new Set(goals.map((g) => g.parent_id).filter(Boolean))
  const eligible = goals.filter(
    (g) =>
      g.status === 'ACTIVE' &&
      g.currency_code === currency &&
      !parentIds.has(g.id) &&
      Number(g.current_amount) > 0,
  )
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="No usar meta" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No usar meta</SelectItem>
        {eligible.map((g) => (
          <SelectItem key={g.id} value={g.id}>
            {g.name} · {Number(g.current_amount).toLocaleString('es-AR')} {g.currency_code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Selector de medio/cuenta. Con `optional`, agrega "sin medio" (value = NONE).
 */
export function AccountSelect({ value, onChange, optional = false, placeholder = 'Elegí un medio', className }) {
  const { data: accounts = [] } = useGetAccountsQuery()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {optional && <SelectItem value={NONE}>Sin medio</SelectItem>}
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
