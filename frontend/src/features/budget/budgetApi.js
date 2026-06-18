import { apiSlice } from '@/app/apiSlice'

export const budgetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBudgetItems: builder.query({
      query: (periodMonth) => ({ url: '/budget/items', params: { period_month: periodMonth } }),
      transformResponse: (res) => res.data,
      providesTags: ['Budget'],
    }),
    getBudgetSummary: builder.query({
      query: (periodMonth) => ({ url: '/budget/summary', params: { period_month: periodMonth } }),
      transformResponse: (res) => res.data,
      providesTags: ['Budget'],
    }),
    getBudgetSettings: builder.query({
      query: (periodMonth) => ({ url: '/budget/settings', params: { period_month: periodMonth } }),
      transformResponse: (res) => res.data,
      providesTags: ['Budget'],
    }),
    createBudgetItem: builder.mutation({
      query: (body) => ({ url: '/budget/items', method: 'POST', body }),
      invalidatesTags: ['Budget'],
    }),
    updateBudgetItem: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/budget/items/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Budget'],
    }),
    deleteBudgetItem: builder.mutation({
      query: (id) => ({ url: `/budget/items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Budget'],
    }),
    upsertBudgetSettings: builder.mutation({
      query: (body) => ({ url: '/budget/settings', method: 'POST', body }),
      invalidatesTags: ['Budget'],
    }),
  }),
})

export const {
  useGetBudgetItemsQuery,
  useGetBudgetSummaryQuery,
  useGetBudgetSettingsQuery,
  useCreateBudgetItemMutation,
  useUpdateBudgetItemMutation,
  useDeleteBudgetItemMutation,
  useUpsertBudgetSettingsMutation,
} = budgetApi
