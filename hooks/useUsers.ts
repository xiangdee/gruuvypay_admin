"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import adminApi from "@/lib/api"

export interface UserParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  [key: string]: unknown
}

export function useUsers(params?: UserParams) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/users", { params })
      return data
    },
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async () => {
      const { data } = await adminApi.get(`/admin/users/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useSuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await adminApi.post(`/admin/users/${id}/suspend`, { reason })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useReactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await adminApi.post(`/admin/users/${id}/reactivate`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useUserTransactions(userId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ["user-transactions", userId, page],
    queryFn: async () => {
      const { data } = await adminApi.get(`/admin/users/${userId}/transactions`, {
        params: { page, limit },
      })
      return data as {
        data: import("@/components/transactions/TransactionTable").Transaction[]
        meta: { total: number; page: number; limit: number; pages: number }
      }
    },
    enabled: !!userId,
  })
}

export function useResetUserPin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await adminApi.post(`/admin/users/${id}/reset-pin`)
      return data
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["users", id] })
    },
  })
}
