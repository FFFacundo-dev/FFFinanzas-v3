import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { formatThousands, parseAmountInput } from '@/lib/format'

/**
 * Input de monto: muestra los miles agrupados con "." mientras se escribe y
 * emite el valor limpio (string numérico con "." decimal) por onChange.
 *
 *  - value: string limpio ("1000000" o "1000000.5")
 *  - onChange: (clean: string) => void
 */
export const MoneyInput = forwardRef(function MoneyInput({ value, onChange, ...props }, ref) {
  return (
    <Input
      ref={ref}
      inputMode="decimal"
      value={formatThousands(value)}
      onChange={(e) => onChange(parseAmountInput(e.target.value))}
      {...props}
    />
  )
})
