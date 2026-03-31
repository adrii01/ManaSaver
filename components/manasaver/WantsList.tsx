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
      {/* Foto Limpia */}
      <div className="relative h-12 w-9 flex-shrink-0 rounded-md bg-secondary ring-1 ring-border overflow-hidden">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center text-[8px] text-muted-foreground uppercase">{card.set}</div>
        )}
      </div>

      {/* Info Central + Manás Fuera */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-foreground">{card.name}</p>
          {/* Manás ahora se ven perfectamente aquí */}
          {card.manaColors && <ManaIcons colors={card.manaColors} size="sm" />}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline" className={cn("h-4 px-1 py-0 text-[9px] font-bold", RARITY_COLORS[card.rarity])}>
            {card.set}
          </Badge>
          {/* Botón individual de Cardmarket */}
          {card.cardmarketUrl && (
            <a
              href={card.cardmarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Selector de cantidad (Spinner) */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
        <button onClick={() => onQtyChange(card.id, Math.max(1, card.qty - 1))} className="p-1 hover:text-primary"><ChevronDown className="h-3 w-3" /></button>
        <span className="w-4 text-center text-xs font-bold tabular-nums">{card.qty}</span>
        <button onClick={() => onQtyChange(card.id, card.qty + 1)} className="p-1 hover:text-primary"><ChevronUp className="h-3 w-3" /></button>
      </div>

      {/* Precio Final */}
      <div className="text-right min-w-[70px]">
        <p className="text-sm font-extrabold text-foreground">€{rowTotal.toFixed(2)}</p>
        <p className="text-[10px] text-muted-foreground">@€{card.price.toFixed(2)}</p>
      </div>

      {/* Borrar */}
      <button onClick={() => onDelete(card.id)} className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 className="h-4 w-4" />
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

  // MOTOR DE CÁLCULOS UNIFICADO: Si cards cambia, todo esto se refresca
  // MOTOR DE CÁLCULOS CON DEBUG
  const stats = useMemo(() => {
    // --- DEBUG START ---
    console.group("🔄 Recalculando WantsList");
    console.log("Cartas actuales en el array:", cards.length);
    console.table(cards.map(c => ({ name: c.name, qty: c.qty, price: c.price })));
    // --- DEBUG END ---

    const tCards = cards.reduce((acc, c) => acc + (Number(c.qty) || 0), 0);
    const tValue = cards.reduce((acc, c) => acc + ((Number(c.price) || 0) * (Number(c.qty) || 0)), 0);

    const uDeal = calculateBestDeal(cards);
    const mUrl = getMostExpensiveCardUrl(cards);

    const baseSavingsPercent = 10;
    const cktTotal = tValue / (1 - baseSavingsPercent / 100);
    const tSavings = (cktTotal - tValue) + (uDeal.shippingSaved || 0);
    const tSavingsPercent = tValue > 0 ? Math.round((tSavings / (tValue + tSavings)) * 100) : 0;

    // --- DEBUG RESULT ---
    console.log("Resultado final:", { tCards, tValue, tSavingsPercent });
    console.groupEnd();

    return {
      totalCards: tCards,
      totalValue: tValue,
      unicornDeal: uDeal,
      cardmarketTotal: cktTotal,
      totalSavings: tSavings,
      totalSavingsPercent: tSavingsPercent,
      mostExpensiveCardUrl: mUrl
    };
  }, [cards]);

  const handleExport = async () => {
    const exportText = generateCardmarketExport(cards)
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const blob = new Blob([exportText], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = "cardmarket-import.txt"; a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (!isMounted) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          My Live Wants List
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </Badge>
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
            <div className="divide-y divide-border">
              {cards.map(card => (
                <CardRow key={card.id} card={card} onQtyChange={onQtyChange} onDelete={onDelete} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerta de Vendedor Unicornio */}
      {stats.unicornDeal.hasUnicorn && cards.length > 0 && (
        <Card className="border-primary/40 bg-primary/5 animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-primary">Unicorn Seller Found!</span>
              <p className="text-sm text-foreground font-semibold truncate">{stats.unicornDeal.sellerName}</p>
            </div>
            <div className="text-right text-savings">
              <span className="text-sm font-bold">€{stats.unicornDeal.shippingSaved.toFixed(2)} saved</span>
              <p className="text-[10px] text-muted-foreground">{stats.unicornDeal.shipmentsAvoided} shipments avoided</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECCIÓN RESUMEN ACTUALIZABLE */}
      {cards.length > 0 && (
        <Card className="border-savings/30 bg-savings/5 overflow-hidden shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              Summary
              <Badge key={`badge-${stats.totalSavingsPercent}`} className="bg-savings/20 text-savings border-savings/30">
                {stats.totalSavingsPercent}% OFF
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Total Cards</span>
              {/* Usamos una KEY para obligar a React a repintar el número si cambia */}
              <span key={`qty-${stats.totalCards}`} className="text-right font-bold tabular-nums">
                {stats.totalCards}
              </span>

              <span className="text-muted-foreground">Our Price</span>
              <span key={`val-${stats.totalValue}`} className="text-right font-bold text-lg tabular-nums text-foreground">
                €{Number(stats.totalValue).toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-savings/40 bg-savings/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-savings/20 p-2 rounded-full">
                  <Zap className="h-5 w-5 text-savings" />
                </div>
                <div>
                  <span className="text-xs text-savings/80 font-medium uppercase tracking-tight">You Save</span>
                  <p className="text-xl font-bold text-savings">{stats.totalSavingsPercent}%</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-savings tabular-nums">
                  €{Number(stats.totalSavings).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Botón de Acción Único en el Summary */}
            <Button
              onClick={() => {
                const text = cards.map(c => `${c.qty}x ${c.name}`).join("\n");
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                window.open("https://www.cardmarket.com/en/Magic/Wants/WantsListImport", "_blank");
              }}
              className="w-full h-12 gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-95 transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              {copied ? "List Copied! Opening..." : "Buy All: Copy & Go to Market"}
              <ExternalLink className="h-4 w-4 opacity-50" />
            </Button>

            {stats.mostExpensiveCardUrl && (
              <a href={stats.mostExpensiveCardUrl} target="_blank" rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 hover:brightness-110 transition-all shadow-md shadow-amber-500/10">
                <ShoppingCart className="h-5 w-5" /> Buy Optimized Lot
                <ExternalLink className="h-3.5 w-3.5 opacity-50" />
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  )
}