"use client"

import { useEffect, useState, useCallback } from "react"
import { ExternalLink, Zap, RefreshCw, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ManaIcons } from "./ManaIcons"
import { cn } from "@/lib/utils"
import { 
  fetchSniperDeals, 
  getCardImageUrl, 
  extractManaColors,
  type ScryfallCard 
} from "@/lib/scryfall"

type Deal = {
  id: string
  name: string
  set: string
  setName: string
  livePrice: number
  avgPrice: number
  pctBelow: number
  condition: string
  seller: string
  fresh: boolean
  manaColors: string[]
  imageUrl: string | null
  cardmarketUrl: string | null
}

// Simulated seller names for demo
const SELLERS = [
  "CardKingdom_EU",
  "PowerNine_DE",
  "ManaVault_NL",
  "Tolarian_FR",
  "MoxStore_IT",
  "BlueDragon_ES",
  "VintageCards_UK",
  "LegacyHub_AT",
]

// Random condition for demo
const CONDITIONS = ["NM", "EX", "GD", "LP"]

function transformToDeals(cards: ScryfallCard[]): Deal[] {
  return cards.map((card, index) => {
    const eurPrice = parseFloat(card.prices.eur || "0")
    // Simulate average price as 10-25% higher than current
    const markup = 1.1 + Math.random() * 0.15
    const avgPrice = eurPrice * markup
    const pctBelow = ((avgPrice - eurPrice) / avgPrice) * 100

    return {
      id: card.id,
      name: card.name,
      set: card.set.toUpperCase(),
      setName: card.set_name,
      livePrice: eurPrice,
      avgPrice,
      pctBelow: Math.round(pctBelow * 10) / 10,
      condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
      seller: SELLERS[Math.floor(Math.random() * SELLERS.length)],
      fresh: index < 3, // First 3 cards are "fresh"
      manaColors: extractManaColors(card),
      imageUrl: getCardImageUrl(card, "normal"),
      cardmarketUrl: card.purchase_uris?.cardmarket || null,
    }
  })
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <Card className={cn(
      "flex-shrink-0 w-[200px] border-border bg-card transition-all hover:border-primary/40 hover:-translate-y-0.5",
      deal.fresh && "border-primary/20"
    )}>
      <CardContent className="p-3 space-y-2.5">
        {/* Card image with mana icons */}
        <div className="relative h-[110px] w-full rounded-lg bg-secondary overflow-hidden flex items-center justify-center">
          {deal.imageUrl ? (
            <img 
              src={deal.imageUrl} 
              alt={deal.name}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-card" />
              <div className="relative text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{deal.set}</p>
                <p className="mt-1 text-xs font-semibold text-foreground leading-tight px-2">{deal.name}</p>
              </div>
            </>
          )}
          
          {/* Mana icons in top-left corner */}
          {deal.manaColors.length > 0 && (
            <div className="absolute top-1.5 left-1.5">
              <ManaIcons colors={deal.manaColors} size="md" />
            </div>
          )}
          
          {deal.fresh && (
            <Badge className="absolute right-1.5 top-1.5 bg-primary text-primary-foreground text-[9px] px-1.5 py-0 h-4">
              LIVE
            </Badge>
          )}

          {/* Discount Badge - Neon Green */}
          <Badge className="absolute left-1.5 bottom-1.5 bg-savings text-savings-foreground text-[10px] font-bold px-1.5 py-0.5 h-5 shadow-lg shadow-savings/30">
            -{deal.pctBelow}% vs Avg
          </Badge>
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-bold text-foreground truncate">{deal.name}</p>
          <p className="text-[10px] text-muted-foreground">{deal.seller} · {deal.condition}</p>
        </div>

        {/* Prices */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground">Live Price</p>
            <p className="text-base font-extrabold text-foreground">
              {deal.livePrice > 0 
                ? `€${deal.livePrice.toFixed(2)}` 
                : "N/A"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Avg</p>
            <p className="text-xs text-foreground/70 line-through">
              €{deal.avgPrice.toFixed(2)}
            </p>
          </div>
        </div>

        {/* CTA - Real Link */}
        {deal.cardmarketUrl ? (
          <a
            href={deal.cardmarketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex h-7 w-full items-center justify-center gap-1 rounded-md border text-xs font-medium transition-colors",
              "border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
            )}
          >
            Buy on Cardmarket
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled
            className="h-7 w-full gap-1 border-border text-muted-foreground text-xs"
          >
            No Link Available
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function SniperFeed() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDeals = useCallback(async () => {
    setRefreshing(true)
    try {
      const cards = await fetchSniperDeals(8)
      const transformed = transformToDeals(cards)
      setDeals(transformed)
    } catch (error) {
      console.error("Failed to load sniper deals:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDeals()
  }, [loadDeals])

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground">ManaSaver Sniper</h2>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-savings animate-pulse" />
            <span className="text-[11px] text-savings font-medium">Live Feed</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadDeals}
          disabled={refreshing}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {refreshing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </Button>
      </div>

      {/* Horizontal scroll on mobile */}
      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="flex-shrink-0 w-[200px] border-border bg-card animate-pulse">
              <CardContent className="p-3 space-y-2.5">
                <div className="h-[110px] w-full rounded-lg bg-secondary" />
                <div className="h-4 w-3/4 rounded bg-secondary" />
                <div className="h-3 w-1/2 rounded bg-secondary" />
                <div className="h-6 w-full rounded bg-secondary" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            No deals found. Try refreshing.
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
          {deals.map(deal => (
            <div key={deal.id} className="snap-start">
              <DealCard deal={deal} />
            </div>
          ))}
        </div>
      )}

      {/* Pro CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs font-bold text-foreground">Unlock Full Sniper</p>
              <p className="text-[11px] text-muted-foreground">Get real-time alerts for every deal</p>
            </div>
          </div>
          <Button size="sm" className="h-7 bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
            Upgrade
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
