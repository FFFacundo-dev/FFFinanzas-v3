import { apiSlice } from '@/app/apiSlice'

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Saldo del pozo por moneda (héroe del dashboard).
    getBalanceByCurrency: builder.query({
      query: () => '/dashboard/balance-by-currency',
      transformResponse: (res) => res.data,
      providesTags: ['Balance'],
    }),
    // Gasto por cuenta/medio (reemplaza el saldo por cuenta).
    getSpendingByAccount: builder.query({
      query: () => '/dashboard/spending-by-account',
      transformResponse: (res) => res.data,
      providesTags: ['Balance', 'Account'],
    }),
    // Cashflow mensual (ponderado a ARS).
    getMonthlyCashflow: builder.query({
      query: (params) => ({ url: '/reports/monthly-cashflow', params }),
      transformResponse: (res) => res.data,
      providesTags: ['Report'],
    }),
    // Gasto por categoría (ponderado a ARS).
    getCategoryBreakdown: builder.query({
      query: (params) => ({ url: '/reports/category-breakdown', params }),
      transformResponse: (res) => ({ data: res.data, meta: res.meta }),
      providesTags: ['Report'],
    }),
  }),
})

export const {
  useGetBalanceByCurrencyQuery,
  useGetSpendingByAccountQuery,
  useGetMonthlyCashflowQuery,
  useGetCategoryBreakdownQuery,
} = dashboardApi
