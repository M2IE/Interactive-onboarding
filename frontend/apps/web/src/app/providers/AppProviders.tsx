import { Provider } from 'react-redux'
import type { ReactNode } from 'react'
import { store } from '@/app/store/store'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return <Provider store={store}>{children}</Provider>
}
