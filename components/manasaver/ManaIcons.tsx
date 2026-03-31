"use client"

import { cn } from "@/lib/utils"

// MTG Mana colors
const MANA_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  W: { bg: "bg-amber-100", text: "text-amber-900", label: "White" },
  U: { bg: "bg-blue-500", text: "text-white", label: "Blue" },
  B: { bg: "bg-slate-900 ring-1 ring-slate-600", text: "text-slate-300", label: "Black" },
  R: { bg: "bg-red-500", text: "text-white", label: "Red" },
  G: { bg: "bg-green-600", text: "text-white", label: "Green" },
}

interface ManaIconsProps {
  colors: string[]
  size?: "sm" | "md"
  className?: string
}

export function ManaIcons({ colors, size = "sm", className }: ManaIconsProps) {
  if (!colors || colors.length === 0) return null

  const sizeClasses = size === "sm" ? "h-3.5 w-3.5 text-[8px]" : "h-5 w-5 text-[10px]"

  return (
    <div className={cn("flex items-center -space-x-1", className)}>
      {colors.map((color, index) => {
        const mana = MANA_COLORS[color]
        if (!mana) return null
        return (
          <div
            key={`${color}-${index}`}
            className={cn(
              "rounded-full flex items-center justify-center font-bold shadow-sm",
              sizeClasses,
              mana.bg,
              mana.text
            )}
            title={mana.label}
          >
            {color}
          </div>
        )
      })}
    </div>
  )
}

// For displaying all 5 mana types in a row (decorative)
export function ManaBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {["W", "U", "B", "R", "G"].map((color) => {
        const mana = MANA_COLORS[color]
        return (
          <div
            key={color}
            className={cn(
              "h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm",
              mana.bg,
              mana.text
            )}
          >
            {color}
          </div>
        )
      })}
    </div>
  )
}
