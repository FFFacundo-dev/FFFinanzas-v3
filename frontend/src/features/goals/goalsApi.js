import { apiSlice } from '@/app/apiSlice'

export const goalsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGoals: builder.query({
      query: (params) => ({ url: '/goals', params }),
      transformResponse: (res) => res.data,
      providesTags: ['Goal'],
    }),
    getGoalMovements: builder.query({
      query: (id) => `/goals/${id}/movements`,
      transformResponse: (res) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Goal', id }],
    }),
    createGoal: builder.mutation({
      query: (body) => ({ url: '/goals', method: 'POST', body }),
      invalidatesTags: ['Goal'],
    }),
    updateGoal: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/goals/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Goal'],
    }),
    patchGoalStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/goals/${id}`, method: 'PATCH', body: { status } }),
      // Archivar/desarchivar cambia lo reservado → invalida balances.
      invalidatesTags: ['Goal', 'Balance'],
    }),
    deleteGoal: builder.mutation({
      query: (id) => ({ url: `/goals/${id}`, method: 'DELETE' }),
      // Borrar libera la reserva → invalida balances.
      invalidatesTags: ['Goal', 'Balance'],
    }),
    // Aportar / retirar mueve la reserva → invalida balances.
    createGoalMovement: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/goals/${id}/movements`, method: 'POST', body }),
      invalidatesTags: ['Goal', 'Balance'],
    }),
  }),
})

export const {
  useGetGoalsQuery,
  useGetGoalMovementsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  usePatchGoalStatusMutation,
  useDeleteGoalMutation,
  useCreateGoalMovementMutation,
} = goalsApi
