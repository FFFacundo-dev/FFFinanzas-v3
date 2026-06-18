import { apiSlice } from '@/app/apiSlice'

export const currenciesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrencies: builder.query({
      query: () => '/currencies',
      transformResponse: (res) => res.data,
      providesTags: ['Currency'],
    }),
  }),
})

export const { useGetCurrenciesQuery } = currenciesApi
