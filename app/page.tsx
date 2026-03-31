"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/manasaver/Header"
import { QuickActions } from "@/components/manasaver/QuickActions"
import { WantsList, type WantCard } from "@/components/manasaver/WantsList"
import { SniperFeed } from "@/components/manasaver/SniperFeed"
import { Footer } from "@/components/manasaver/Footer"
import { ScanModal } from "@/components/manasaver/ScanModal"

const INITIAL_CARDS: WantCard[] = [
  { id: 1, name: "Black Lotus", set: "LEA", setFull: "Alpha", qty: 1, price: 4200.0, priceChange: 2.4, rarity: "rare", manaColors: [] },
  { id: 2, name: "Ancestral Recall", set: "LEA", setFull: "Alpha", qty: 1, price: 1850.0, priceChange: 1.1, rarity: "rare", manaColors: ["U"] },
  { id: 3, name: "Mox Pearl", set: "LEA", setFull: "Alpha", qty: 2, price: 780.0, priceChange: -0.8, rarity: "rare", manaColors: ["W"] },
  { id: 4, name: "Force of Will", set: "ALL", setFull: "Alliances", qty: 4, price: 78.5, priceChange: 3.2, rarity: "uncommon", manaColors: ["U"] },
  { id: 5, name: "Liliana of the Veil", set: "ISD", setFull: "Innistrad", qty: 2, price: 42.0, priceChange: 0.5, rarity: "mythic", manaColors: ["B"] },
  { id: 6, name: "Snapcaster Mage", set: "ISD", setFull: "Innistrad", qty: 4, price: 28.5, priceChange: -1.2, rarity: "rare", manaColors: ["U"] },
]

export default function ManaSaverDashboard() {
  const [cards, setCards] = useState<WantCard[]>(INITIAL_CARDS)
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [nextId, setNextId] = useState(100)

  const handleQtyChange = useCallback((id: number, qty: number) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, qty, isNew: false } : c))
  }, [])

  const handleDelete = useCallback((id: number) => {
    setCards(prev => prev.filter(c => c.id !== id))
  }, [])

  const handleClearAll = useCallback(() => {
    setCards([])
  }, [])

  const handleAddCard = useCallback((card: {
    name: string
    set: string
    setFull: string
    price: number
    rarity: "mythic" | "rare" | "uncommon" | "common"
    manaColors: string[]
    imageUrl?: string
    cardmarketUrl?: string
  }) => {
    // Check if card already exists (same name and set)
    const existingIndex = cards.findIndex(c => 
      c.name.toLowerCase() === card.name.toLowerCase() && 
      c.set.toLowerCase() === card.set.toLowerCase()
    )
    
    if (existingIndex >= 0) {
      // Increment qty if exists
      setCards(prev => prev.map((c, i) => 
        i === existingIndex 
          ? { ...c, qty: c.qty + 1, isNew: true, imageUrl: card.imageUrl || c.imageUrl, cardmarketUrl: card.cardmarketUrl || c.cardmarketUrl } 
          : { ...c, isNew: false }
      ))
    } else {
      // Add new card at the top
      const newCard: WantCard = {
        id: nextId,
        name: card.name,
        set: card.set,
        setFull: card.setFull,
        qty: 1,
        price: card.price,
        priceChange: Math.round((Math.random() * 6 - 2) * 10) / 10, // Random -2% to +4%
        rarity: card.rarity,
        manaColors: card.manaColors,
        imageUrl: card.imageUrl,
        cardmarketUrl: card.cardmarketUrl,
        isNew: true,
      }
      setNextId(prev => prev + 1)
      setCards(prev => [newCard, ...prev.map(c => ({ ...c, isNew: false }))])
    }

    // Clear isNew flag after animation
    setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, isNew: false })))
    }, 2000)
  }, [cards, nextId])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 space-y-6">
        <QuickActions 
          onScanClick={() => setScanModalOpen(true)} 
          onAddCard={handleAddCard}
        />
        <WantsList 
          cards={cards}
          onQtyChange={handleQtyChange}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
        />
        <SniperFeed />
      </main>

      <Footer />

      <ScanModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onCardScanned={handleAddCard}
      />
    </div>
  )
}
