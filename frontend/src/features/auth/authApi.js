import { apiSlice } from '@/app/apiSlice'
import { setCredentials, setUser } from './authSlice'

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(setCredentials({ token: data.token, user: data.user }))
      },
    }),
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(setCredentials({ token: data.token, user: data.user }))
      },
    }),
    me: builder.query({
      query: () => '/auth/me',
      transformResponse: (res) => res.user,
      providesTags: ['Auth'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setUser(data))
        } catch {
          /* baseQuery ya maneja el 401 (logout) */
        }
      },
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation, useMeQuery } = authApi
