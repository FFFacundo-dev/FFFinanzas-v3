import { apiSlice } from '@/app/apiSlice'

// Crear/editar/borrar una tx mueve el pozo: invalidamos balances y reportes.
const MUTATION_TAGS = [{ type: 'Transaction', id: 'LIST' }, 'Balance', 'Report']

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
    createTransaction: builder.mutation({
      query: (body) => ({ url: '/transactions', method: 'POST', body }),
      invalidatesTags: MUTATION_TAGS,
    }),
    updateTransaction: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/transactions/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, arg) => [
        ...MUTATION_TAGS,
        { type: 'Transaction', id: arg.id },
      ],
    }),
    deleteTransaction: builder.mutation({
      query: (id) => ({ url: `/transactions/${id}`, method: 'DELETE' }),
      invalidatesTags: MUTATION_TAGS,
    }),
  }),
})

export const {
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionsApi
