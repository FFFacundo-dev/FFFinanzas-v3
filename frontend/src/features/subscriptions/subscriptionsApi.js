import { apiSlice } from '@/app/apiSlice'

export const subscriptionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptions: builder.query({
      query: () => '/subscriptions',
      transformResponse: (res) => res.data,
      providesTags: ['Subscription'],
    }),
    createSubscription: builder.mutation({
      query: (body) => ({ url: '/subscriptions', method: 'POST', body }),
      invalidatesTags: ['Subscription', 'Budget'],
    }),
    updateSubscription: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/subscriptions/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Subscription', 'Budget'],
    }),
    deleteSubscription: builder.mutation({
      query: (id) => ({ url: `/subscriptions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Subscription', 'Budget'],
    }),
    // Un pago de suscripción crea un EXPENSE (y puede liberar una meta): invalida balances, reportes y metas.
    paySubscription: builder.mutation({
      query: (body) => ({ url: '/subscription-payments', method: 'POST', body }),
      invalidatesTags: [
        'Subscription',
        'Balance',
        'Report',
        'Goal',
        { type: 'Transaction', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  usePaySubscriptionMutation,
} = subscriptionsApi
