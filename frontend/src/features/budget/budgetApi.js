import { apiSlice } from '@/app/apiSlice'

export const budgetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBudgets: builder.query({
      query: () => ({ url: '/budget/budgets' }),
      transformResponse: (res) => res.data,
      providesTags: ['Budget'],
    }),
    createBudget: builder.mutation({
      query: (body) => ({ url: '/budget/budgets', method: 'POST', body }),
      invalidatesTags: ['Budget'],
    }),
    duplicateBudget: builder.mutation({
      query: (id) => ({ url: `/budget/budgets/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['Budget'],
    }),
    renameBudget: builder.mutation({
      query: ({ id, name }) => ({ url: `/budget/budgets/${id}`, method: 'PUT', body: { name } }),
      invalidatesTags: ['Budget'],
    }),
    deleteBudget: builder.mutation({
      query: (id) => ({ url: `/budget/budgets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Budget'],
    }),
    getBudgetItems: builder.query({
      query: (budgetId) => ({ url: '/budget/items', params: { budget_id: budgetId } }),
      transformResponse: (res) => res.data,
      providesTags: ['Budget'],
    }),
    getBudgetSummary: builder.query({
      query: (budgetId) => ({ url: '/budget/summary', params: { budget_id: budgetId } }),
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
  useGetBudgetsQuery,
  useCreateBudgetMutation,
  useDuplicateBudgetMutation,
  useRenameBudgetMutation,
  useDeleteBudgetMutation,
  useGetBudgetItemsQuery,
  useGetBudgetSummaryQuery,
  useGetBudgetSettingsQuery,
  useCreateBudgetItemMutation,
  useUpdateBudgetItemMutation,
  useDeleteBudgetItemMutation,
  useUpsertBudgetSettingsMutation,
} = budgetApi
