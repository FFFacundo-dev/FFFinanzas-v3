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
