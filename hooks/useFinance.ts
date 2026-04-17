"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import adminApi from "@/lib/api"

export interface RevenueParams {
  startDate?: string
  endDate?: string
  period?: string
  [key: string]: unknown
}

export interface AnalyticsParams {
  startDate?: string
  endDate?: string
  period?: string
  [key: string]: unknown
}

export interface KycParams {
  page?: number
  limit?: number
  status?: string
  [key: string]: unknown
}

export function useVtpassBalance() {
  return useQuery({
    queryKey: ["finance", "vtpass-balance"],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/finance/vtpass-balance")
      return data
    },
  })
}

export function useQuidaxBalance() {
  return useQuery({
    queryKey: ["finance", "quidax-balance"],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/finance/quidax-balance")
      return data
    },
  })
}

export function useRevenue(params?: RevenueParams) {
  return useQuery({
    queryKey: ["finance", "revenue", params],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/finance/revenue", { params })
      return data
    },
  })
}

export function useAnalytics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics", params],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/analytics", { params })
      return data
    },
  })
}

export function useKycQueue(params?: KycParams) {
  return useQuery({
    queryKey: ["kyc", params],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/kyc", { params })
      return data
    },
  })
}

export function useAdmins() {
  return useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/admins")
      return data
    },
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/settings")
      return data
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await adminApi.patch("/admin/settings", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
  })
}
