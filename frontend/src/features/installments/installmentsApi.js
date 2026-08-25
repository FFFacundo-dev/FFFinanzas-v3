import { apiSlice } from '@/app/apiSlice'

// Pagar/adelantar una cuota crea un EXPENSE (y puede liberar una meta): invalida balances, reportes y metas.
const PAYMENT_TAGS = ['Installment', 'Balance', 'Report', 'Goal', { type: 'Transaction', id: 'LIST' }]

export const installmentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInstallments: builder.query({
      query: () => '/installments',
      transformResponse: (res) => res.data,
      providesTags: ['Installment'],
    }),
    // Progreso (pagadas/restantes/pendiente del mes) — vista enriquecida.
    getInstallmentProgress: builder.query({
      query: () => '/dashboard/installment-progress',
      transformResponse: (res) => res.data,
      providesTags: ['Installment'],
    }),
    createInstallment: builder.mutation({
      query: (body) => ({ url: '/installments', method: 'POST', body }),
      invalidatesTags: ['Installment', 'Budget'],
    }),
    updateInstallment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/installments/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Installment', 'Budget'],
    }),
    deleteInstallment: builder.mutation({
      query: (id) => ({ url: `/installments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Installment', 'Balance', 'Report', 'Budget'],
    }),
    payInstallment: builder.mutation({
      query: (body) => ({ url: '/installment-payments', method: 'POST', body }),
      invalidatesTags: PAYMENT_TAGS,
    }),
    advanceInstallment: builder.mutation({
      query: (body) => ({ url: '/installment-advance-payments', method: 'POST', body }),
      invalidatesTags: PAYMENT_TAGS,
    }),
  }),
})

export const {
  useGetInstallmentsQuery,
  useGetInstallmentProgressQuery,
  useCreateInstallmentMutation,
  useUpdateInstallmentMutation,
  useDeleteInstallmentMutation,
  usePayInstallmentMutation,
  useAdvanceInstallmentMutation,
} = installmentsApi
