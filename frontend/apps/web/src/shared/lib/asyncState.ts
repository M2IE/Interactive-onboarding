export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

export const idleState = <T>(): AsyncState<T> => ({ status: 'idle' })

export const loadingState = <T>(): AsyncState<T> => ({ status: 'loading' })

export const successState = <T>(data: T): AsyncState<T> => ({
  status: 'success',
  data,
})

export const errorState = <T>(error: string): AsyncState<T> => ({
  status: 'error',
  error,
})
