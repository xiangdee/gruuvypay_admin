"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import adminApi from "@/lib/api"

export interface TransactionParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  from?: string
  to?: string
}

export function useTransactions(params?: TransactionParams) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/transactions", { params })
      return data
    },
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ["transactions", id],
    queryFn: async () => {
      const { data } = await adminApi.get(`/admin/transactions/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: unknown }) => {
      const { data } = await adminApi.patch(`/admin/transactions/${id}`, payload)
      return data
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", id] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await adminApi.delete(`/admin/transactions/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}

export function useBillTransactions(params?: Omit<TransactionParams, "type">) {
  return useQuery({
    queryKey: ["transactions", "bills", params],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/transactions/bills", { params })
      return data
    },
  })
}

export function useCryptoTransactions(params?: Omit<TransactionParams, "type">) {
  return useQuery({
    queryKey: ["transactions", "crypto", params],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/transactions/crypto", { params })
      return data
    },
  })
}
