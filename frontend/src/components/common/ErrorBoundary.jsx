import { Component } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Evita que una excepción de render deje la pantalla en blanco.
 * ponytail: clase porque React no tiene equivalente en hooks; sin librería.
 */
export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="space-y-1">
          <h2 className="font-display text-xl">Algo se rompió en esta pantalla</h2>
          <p className="text-sm text-muted-foreground">
            Tus datos están a salvo: el error es del lado del navegador.
          </p>
        </div>
        <p className="max-w-lg font-mono text-xs text-muted-foreground">
          {this.state.error?.message}
        </p>
        <Button onClick={() => this.setState({ error: null })}>Reintentar</Button>
      </div>
    )
  }
}
