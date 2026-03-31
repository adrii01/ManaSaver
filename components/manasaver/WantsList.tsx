"use client"

import { useState, useMemo, useEffect } from "react"
import { Trash2, TrendingUp, Package, Zap, ChevronDown, ChevronUp, Sparkles, Truck, Store, Copy, Check, Download, ShoppingCart, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ManaIcons } from "./ManaIcons"
import { cn } from "@/lib/utils"

export type WantCard = {
  id: number
  name: string
  set: string
  setFull: string
  qty: number
  price: number
  priceChange: number
  rarity: "mythic" | "rare" | "uncommon" | "common"
  manaColors: string[]
  imageUrl?: string
  isNew?: boolean
  cardmarketUrl?: string
}

const RARITY_COLORS: Record<WantCard["rarity"], string> = {
  mythic: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  rare: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  uncommon: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  common: "bg-muted text-muted-foreground border-border",
}

// Simulated unicorn seller names
const UNICORN_SELLERS = [
  "CardKingdom EU",
  "PowerNine Store",
  "ManaVault Premium",
  "Tolarian Academy",
  "The Mox Pearl",
  "Gaea's Cradle Shop",
]

// Calculate best deal with unicorn seller logic
function calculateBestDeal(cards: WantCard[]): {
  hasUnicorn: boolean
  sellerName: string
  cardsWithSeller: number
  totalCards: number
  shippingSaved: number
  shipmentsAvoided: number
} {
  if (cards.length <= 3) {
    return {
      hasUnicorn: false,
      sellerName: "",
      cardsWithSeller: 0,
      totalCards: cards.length,
      shippingSaved: 0,
      shipmentsAvoided: 0,
    }
  }

  // Simulate that a "PowerSeller" has 80% of the cards
  const sellerName = UNICORN_SELLERS[Math.floor(Math.random() * UNICORN_SELLERS.length)]
  const cardsWithSeller = Math.ceil(cards.length * 0.8)
  const cardsWithoutSeller = cards.length - cardsWithSeller

  // Calculate shipping savings: 2.50€ per avoided shipment
  // Without unicorn: each card might need separate shipment
  // With unicorn: most cards in 1 shipment
  const shipmentsWithoutUnicorn = Math.ceil(cards.length / 1.2) // Average 1.2 cards per seller
  const shipmentsWithUnicorn = 1 + Math.ceil(cardsWithoutSeller / 1.5) // 1 main + scattered
  const shipmentsAvoided = shipmentsWithoutUnicorn - shipmentsWithUnicorn
  const shippingSaved = shipmentsAvoided * 2.50

  return {
    hasUnicorn: true,
    sellerName,
    cardsWithSeller,
    totalCards: cards.length,
    shippingSaved: Math.max(0, shippingSaved),
    shipmentsAvoided: Math.max(0, shipmentsAvoided),
  }
}

// Generate Cardmarket export text
function generateCardmarketExport(cards: WantCard[]): string {
  return cards
    .map(card => `${card.qty}x ${card.name}`)
    .join("\n")
}

// Get URL of the most expensive card in the list
function getMostExpensiveCardUrl(cards: WantCard[]): string | null {
  if (!cards || cards.length === 0) return null

  const sorted = [...cards].sort((a, b) => {
    const totalA = (Number(a.price) || 0) * (a.qty || 1)
    const totalB = (Number(b.price) || 0) * (b.qty || 1)
    return totalB - totalA
  })

  return sorted[0]?.cardmarketUrl || null
}

function CardRow({ card, onQtyChange, onDelete }: {
  card: WantCard
  onQtyChange: (id: number, qty: number) => void
  onDelete: (id: number) => void
}) {
  const rowTotal = (Number(card.price) || 0) * card.qty

  return (
    <div className={cn(
      "group flex items-center gap-3 py-3 border-b border-border last:border-0 transition-all duration-500",
      card.isNew && "animate-in fade-in slide-in-from-top-2 bg-savings/10 rounded-lg px-2 -mx-2 ring-1 ring-savings/30"
    )}>
      {/* Card image with mana icons */}
      <div className="relative h-12 w-9 flex-shrink-0 rounded-lg bg-secondary ring-1 ring-border overflow-hidden">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <span className="text-[7px] font-bold text-muted-foreground uppercase">{card.set}</span>
          </div>
        )}
        {/* Mana icons overlay */}
        {card.manaColors && card.manaColors.length > 0 && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <ManaIcons colors={card.manaColors} size="sm" />
          </div>
        )}
        {/* New flash indicator */}
        {card.isNew && (
          <div className="absolute inset-0 flex items-center justify-center bg-savings/20 animate-pulse">
            <Sparkles className="h-4 w-4 text-savings" />
          </div>
        )}
      </div>

      {/* Name & Set */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-foreground">{card.name}</p>
          {card.isNew && (
            <Badge className="bg-savings/20 text-savings border-savings/30 text-[9px] px-1 py-0 h-4">
              NEW
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline" className={cn("h-4 px-1 py-0 text-[9px] font-bold border", RARITY_COLORS[card.rarity])}>
            {card.set}
          </Badge>
          <span className="text-[11px] text-muted-foreground truncate">{card.setFull}</span>
        </div>
      </div>

      {/* Qty spinner */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQtyChange(card.id, Math.max(1, card.qty - 1))}
          className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-foreground tabular-nums">{card.qty}</span>
        <button
          onClick={() => onQtyChange(card.id, card.qty + 1)}
          className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Price per unit + Row total */}
      <div className="text-right min-w-[85px]">
        <p className="text-sm font-bold text-foreground tabular-nums">
          €{rowTotal.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex items-center justify-end gap-1">
          <span className="text-[10px] text-muted-foreground">
            @€{card.price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={cn("text-[10px] font-medium", card.priceChange >= 0 ? "text-up" : "text-down")}>
            {card.priceChange >= 0 ? "+" : ""}{card.priceChange}%
          </span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(card.id)}
        className="ml-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

interface WantsListProps {
  cards: WantCard[]
  onQtyChange: (id: number, qty: number) => void
  onDelete: (id: number) => void
  onClearAll: () => void
}

export function WantsList({ cards = [], onQtyChange, onDelete, onClearAll }: WantsListProps) {
  const [copied, setCopied] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const totalCards = cards.reduce((sum, c) => sum + (Number(c.qty) || 0), 0)

  const totalValue = cards.reduce((sum, c) => {
    const p = Number(c.price) || 0
    const q = Number(c.qty) || 0
    return sum + (p * q)
  }, 0)

  // Calculate unicorn seller deal
  const unicornDeal = useMemo(() => calculateBestDeal(cards), [cards])

  // Get URL for "Buy Optimized Lot" button (most expensive card)
  const mostExpensiveCardUrl = useMemo(() => getMostExpensiveCardUrl(cards), [cards])

  // Calculate savings: 10% base + shipping savings from unicorn
  const baseSavingsPercent = 10
  const cardmarketTotal = totalValue / (1 - baseSavingsPercent / 100)
  const baseSavings = cardmarketTotal - totalValue
  const totalSavings = baseSavings + unicornDeal.shippingSaved
  const totalSavingsPercent = totalValue > 0 ? Math.round((totalSavings / (totalValue + totalSavings)) * 100) : 0

  // Handle export to Cardmarket
  const handleExport = async () => {
    const exportText = generateCardmarketExport(cards)
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: create and download a text file
      const blob = new Blob([exportText], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "cardmarket-import.txt"
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Si no ha montado en el cliente, no mostramos nada (o un spinner) para evitar el error #418
  if (!isMounted) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          My Live Wants List
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{cards.length} cards</Badge>
        </h2>
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs text-primary hover:text-primary/80">
          Clear All
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          {cards.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No cards in your wants list yet. Scan or search to add some!
            </div>
          ) : (
            <div>
              {cards.map(card => (
                <CardRow key={card.id} card={card} onQtyChange={onQtyChange} onDelete={onDelete} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unicorn Seller Alert */}
      {unicornDeal.hasUnicorn && (
        <Card className="border-primary/40 bg-primary/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-primary">Unicorn Seller Found!</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                    {unicornDeal.cardsWithSeller}/{unicornDeal.totalCards} cards
                  </Badge>
                </div>
                <p className="text-sm text-foreground font-semibold mt-0.5">{unicornDeal.sellerName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Has {Math.round((unicornDeal.cardsWithSeller / unicornDeal.totalCards) * 100)}% of your wishlist in stock
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-savings">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm font-bold">
                    €{unicornDeal.shippingSaved.toFixed(2)} saved
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {unicornDeal.shipmentsAvoided} shipments avoided
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Summary with Progress Bar */}
      {cards.length > 0 && (
        <Card className="border-savings/30 bg-savings/5 overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              Summary
              <Badge className="bg-savings/20 text-savings border-savings/30 text-[10px]">
                {totalSavingsPercent}% OFF
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                <span>Total Cards</span>
              </div>
              <span className="text-right font-semibold text-foreground">{totalCards}</span>

              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Our Price</span>
              </div>
              <span className="text-right font-semibold text-foreground">
                €{totalValue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>

              {unicornDeal.hasUnicorn && (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    <span>Shipping Saved</span>
                  </div>
                  <span className="text-right font-semibold text-savings">
                    +€{unicornDeal.shippingSaved.toFixed(2)}
                  </span>
                </>
              )}
            </div>

            {/* Savings Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-savings/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cardmarket Avg</span>
                <span className="text-muted-foreground line-through">
                  €{(cardmarketTotal + unicornDeal.shippingSaved).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="relative">
                <Progress
                  value={100 - totalSavingsPercent}
                  className="h-3 bg-secondary [&>[data-slot=indicator]]:bg-gradient-to-r [&>[data-slot=indicator]]:from-savings [&>[data-slot=indicator]]:to-primary"
                />
                <div
                  className="absolute right-0 top-0 h-3 bg-savings/30 rounded-r-full"
                  style={{ width: `${totalSavingsPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-savings font-medium">Your Total Savings</span>
                <span className="text-savings font-bold">
                  €{totalSavings.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Big Savings Highlight */}
            <div className="flex items-center justify-between rounded-xl border border-savings/40 bg-gradient-to-r from-savings/15 to-savings/5 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-savings/20">
                  <Zap className="h-5 w-5 text-savings" />
                </div>
                <div>
                  <span className="text-xs text-savings/80 font-medium">ManaSaver Optimization</span>
                  <p className="text-lg font-bold text-savings">You Save {totalSavingsPercent}%</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-savings">
                  €{totalSavings.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[11px] text-savings/70">vs Cardmarket Avg</p>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              variant="outline"
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export for Cardmarket
                </>
              )}
            </Button>

            {/* Golden Buy Optimized Lot Button */}
            {mostExpensiveCardUrl ? (
              <a
                href={mostExpensiveCardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-200 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 hover:scale-[1.02] shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
              >
                <ShoppingCart className="h-5 w-5" />
                Buy Optimized Lot on Cardmarket
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <Button
                disabled
                className="w-full h-12 gap-2 bg-gradient-to-r from-amber-500/50 via-yellow-400/50 to-amber-500/50 text-amber-950/50 cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5" />
                Add cards with Cardmarket links to buy
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  )
}
