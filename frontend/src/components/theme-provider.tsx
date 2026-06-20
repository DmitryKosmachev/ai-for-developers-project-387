import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderState {
  theme: Theme
  /** Фактически применённая тема (system → light|dark). */
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'call-booking-theme'

const ThemeProviderContext = createContext<ThemeProviderState | null>(null)

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system',
  )
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    theme === 'system' ? getSystemTheme() : theme,
  )

  useEffect(() => {
    const root = window.document.documentElement
    const applied = theme === 'system' ? getSystemTheme() : theme

    root.classList.toggle('dark', applied === 'dark')
    setResolvedTheme(applied)

    if (theme !== 'system') return

    // Следим за системной темой, пока выбран режим «как в системе».
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = getSystemTheme()
      root.classList.toggle('dark', next === 'dark')
      setResolvedTheme(next)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeProviderContext)
  if (!ctx) throw new Error('useTheme должен использоваться внутри ThemeProvider')
  return ctx
}
