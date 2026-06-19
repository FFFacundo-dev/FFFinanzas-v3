import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { clearCredentials } from '@/features/auth/authSlice'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) headers.set('authorization', `Bearer ${token}`)
    return headers
  },
})

// Normaliza errores y desloguea ante 401.
const baseQueryWithAuth = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error?.status === 401) {
    api.dispatch(clearCredentials())
  }
  if (result.error) {
    const data = result.error.data
    result.error.message =
      (data && (data.error || data.message)) || 'Ocurrió un error inesperado'
  }
  return result
}

// api-slice base: cada feature lo extiende con injectEndpoints (PLAN §5.4).
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'Auth',
    'Currency',
    'Category',
    'Account',
    'OpeningBalance',
    'Transaction',
    'Exchange',
    'Subscription',
    'Installment',
    'Budget',
    'Goal',
    'Balance',
    'Report',
  ],
  endpoints: () => ({}),
})
