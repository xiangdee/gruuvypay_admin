"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import adminApi from "@/lib/api"

export interface RevenueParams {
  period?: "week" | "month" | "year" | "all"
  startDate?: string
  endDate?: string
}

export interface KycParams {
  page?: number
  limit?: number
  status?: string
}

export function useVtpassBalance() {
  return useQuery({
    queryKey: ["finance", "vtpass-balance"],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/finance/flutterwave-balance")
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

export function useDashboardStats() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/analytics/dashboard")
      return data
    },
  })
}

export type ChartPeriod = 'daily' | 'weekly' | 'monthly'

export function useVolumeChart(period: ChartPeriod = 'daily') {
  return useQuery({
    queryKey: ["analytics", "volume", period],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/analytics/volume", { params: { period } })
      return data as { date: string; volume: number; count: number; bills: number; crypto: number; transfers: number }[]
    },
  })
}

export function useUserGrowthChart(period: ChartPeriod = 'daily') {
  return useQuery({
    queryKey: ["analytics", "users", period],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/analytics/users", { params: { period } })
      return data as { date: string; newUsers: number }[]
    },
  })
}

export function useRevenueChart(period: ChartPeriod = 'daily') {
  return useQuery({
    queryKey: ["analytics", "revenue-chart", period],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/analytics/revenue", { params: { period } })
      return data as { date: string; billRevenue: number; cryptoRevenue: number; atcRevenue: number; total: number }[]
    },
  })
}

export function useKycFunnel() {
  return useQuery({
    queryKey: ["analytics", "kyc-funnel"],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/analytics/kyc-funnel")
      return data as { tier: string; label: string; count: number; pct: string }[]
    },
  })
}

export function useBillCategoriesChart(days = 30) {
  return useQuery({
    queryKey: ["analytics", "bill-categories", days],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/analytics/bill-categories", { params: { days } })
      return data as { name: string; count: number; volume: string }[]
    },
  })
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: ["finance", "summary"],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/finance/summary")
      return data as {
        users: number
        txsToday: number
        volumeToday: string
        txsAllTime: number
        volumeAllTime: string
        pendingKyc: number
      }
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

export function useKycStats() {
  return useQuery({
    queryKey: ["kyc", "stats"],
    queryFn: async () => {
      const { data } = await adminApi.get("/admin/kyc/stats")
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
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await adminApi.post("/admin/settings", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
  })
}

// ── AML ────────────────────────────────────────────────────────────────────

export interface AmlFlagParams {
  status?: string
  userId?: string
  page?:   number
  limit?:  number
}

export interface AmlFlag {
  id:             string
  userId:         string
  txRef:          string | null
  txType:         string
  ruleCode:       string
  reason:         string
  amountNgn:      string
  status:         string
  reviewedBy:     string | null
  reviewedAt:     string | null
  reviewNote:     string | null
  reportedToNfiu: boolean
  nfiuRef:        string | null
  createdAt:      string
  user: {
    id:        string
    firstName: string
    lastName:  string
    email:     string
    tier:      string
  }
}

export function useAmlFlags(params?: AmlFlagParams) {
  return useQuery({
    queryKey: ['aml', 'flags', params],
    queryFn: async () => {
      const { data } = await adminApi.get('/admin/aml/flags', { params })
      return data as { flags: AmlFlag[]; total: number; page: number; pages: number }
    },
  })
}

export function useAmlFlag(flagId: string) {
  return useQuery({
    queryKey: ['aml', 'flag', flagId],
    queryFn: async () => {
      const { data } = await adminApi.get(`/admin/aml/flags/${flagId}`)
      return data as AmlFlag
    },
    enabled: !!flagId,
  })
}

export function useReviewAmlFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      flagId:     string
      status:     'CLEARED' | 'FILED'
      reviewedBy: string
      reviewNote: string
      nfiuRef?:   string
    }) => {
      const { flagId, ...body } = payload
      const { data } = await adminApi.patch(`/admin/aml/flags/${flagId}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aml'] })
    },
  })
}

export interface TravelRule {
  id:                string
  txRef:             string
  userId:            string
  originatorName:    string
  beneficiaryName:   string
  beneficiaryWallet: string
  cryptoSymbol:      string
  cryptoAmount:      string
  amountNgn:         string
  networkName:       string | null
  createdAt:         string
}

export function useTravelRules(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['aml', 'travel-rules', params],
    queryFn: async () => {
      const { data } = await adminApi.get('/admin/aml/travel-rules', { params })
      return data as { records: TravelRule[]; total: number; page: number; pages: number }
    },
  })
}
