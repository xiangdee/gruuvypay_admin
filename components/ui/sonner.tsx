"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      gap={8}
      duration={4000}
      icons={{
        success: <CircleCheckIcon className="size-4 text-[#dbd861]" />,
        info: <InfoIcon className="size-4 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-white/60" />,
      }}
      toastOptions={{
        style: {
          background: "rgba(15, 15, 15, 0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          color: "rgba(255, 255, 255, 0.9)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.04)",
          fontSize: "13.5px",
          fontWeight: "500",
          padding: "14px 16px",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
