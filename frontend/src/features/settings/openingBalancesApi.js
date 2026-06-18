import { apiSlice } from '@/app/apiSlice'

export const openingBalancesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOpeningBalances: builder.query({
      query: () => '/opening-balances',
      transformResponse: (res) => res.data,
      providesTags: ['OpeningBalance'],
    }),
    // Upsert por moneda. Cambia el pozo → invalida balances.
    upsertOpeningBalance: builder.mutation({
      query: (body) => ({ url: '/opening-balances', method: 'PUT', body }),
      invalidatesTags: ['OpeningBalance', 'Balance'],
    }),
  }),
})

export const { useGetOpeningBalancesQuery, useUpsertOpeningBalanceMutation } =
  openingBalancesApi
