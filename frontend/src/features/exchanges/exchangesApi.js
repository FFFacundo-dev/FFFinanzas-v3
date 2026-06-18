import { apiSlice } from '@/app/apiSlice'

export const exchangesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExchanges: builder.query({
      query: () => '/exchanges',
      transformResponse: (res) => res.data,
      providesTags: ['Exchange'],
    }),
    createExchange: builder.mutation({
      query: (body) => ({ url: '/exchanges', method: 'POST', body }),
      // Un cambio mueve valor entre pozos: refresca balances y reportes.
      invalidatesTags: ['Exchange', 'Balance', 'Report'],
    }),
    deleteExchange: builder.mutation({
      query: (id) => ({ url: `/exchanges/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Exchange', 'Balance', 'Report'],
    }),
  }),
})

export const {
  useGetExchangesQuery,
  useCreateExchangeMutation,
  useDeleteExchangeMutation,
} = exchangesApi
