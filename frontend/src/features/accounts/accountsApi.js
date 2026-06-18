import { apiSlice } from '@/app/apiSlice'

export const accountsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query({
      query: () => '/accounts',
      transformResponse: (res) => res.data,
      providesTags: ['Account'],
    }),
    createAccount: builder.mutation({
      query: (body) => ({ url: '/accounts', method: 'POST', body }),
      invalidatesTags: ['Account'],
    }),
    updateAccount: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/accounts/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Account', { type: 'Transaction', id: 'LIST' }, 'Balance'],
    }),
    deleteAccount: builder.mutation({
      query: (id) => ({ url: `/accounts/${id}`, method: 'DELETE' }),
      // Las tx hacen SET NULL: refrescamos listados y balances.
      invalidatesTags: ['Account', { type: 'Transaction', id: 'LIST' }, 'Balance'],
    }),
  }),
})

export const {
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} = accountsApi
