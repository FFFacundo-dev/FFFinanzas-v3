import { apiSlice } from '@/app/apiSlice'

export const transactionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query({
      query: (params = {}) => ({ url: '/transactions', params }),
      transformResponse: (res) => ({ items: res.data, total: res.meta?.total ?? 0 }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((t) => ({ type: 'Transaction', id: t.id })),
              { type: 'Transaction', id: 'LIST' },
            ]
          : [{ type: 'Transaction', id: 'LIST' }],
    }),
  }),
})

export const { useGetTransactionsQuery } = transactionsApi
