export type FetchClient = typeof fetch

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function requestJson<T>(
  fetchClient: FetchClient,
  url: string,
  init?: RequestInit,
  emptyStatuses: number[] = [],
): Promise<T | null> {
  const response = await fetchClient(url, init)

  if (emptyStatuses.includes(response.status)) {
    return null
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  if (response.status === 204) {
    return null
  }

  return (await response.json()) as T
}

export async function requestVoid(
  fetchClient: FetchClient,
  url: string,
  init?: RequestInit,
): Promise<void> {
  const response = await fetchClient(url, init)

  if (!response.ok) {
    throw await toApiError(response)
  }
}

export function normalizeApiBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.replace(/\/$/, '')
}

async function toApiError(response: Response) {
  const fallbackMessage = `API request failed with status ${response.status}`

  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string }
    }

    return new ApiError(
      payload.error?.message ?? fallbackMessage,
      response.status,
      payload.error?.code,
    )
  } catch {
    return new ApiError(fallbackMessage, response.status)
  }
}
