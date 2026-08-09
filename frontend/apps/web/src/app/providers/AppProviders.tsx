import { Provider } from 'react-redux'
import type { ReactNode } from 'react'
import type { AppStore } from '@/app/store/store'

type AppProvidersProps = {
  children: ReactNode
  store: AppStore
}

export function AppProviders({ children, store }: AppProvidersProps) {
  return <Provider store={store}>{children}</Provider>
}
