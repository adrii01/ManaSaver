"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/manasaver/Header"
import { QuickActions } from "@/components/manasaver/QuickActions"
import { WantsList, type WantCard } from "@/components/manasaver/WantsList"
import { SniperFeed } from "@/components/manasaver/SniperFeed"
import { Footer } from "@/components/manasaver/Footer"
import { ScanModal } from "@/components/manasaver/ScanModal"

const INITIAL_CARDS: WantCard[] = [
  { id: 1, name: "Black Lotus", set: "LEA", setFull: "Alpha", qty: 1, price: 4200.0, priceChange: 2.4, rarity: "rare", manaColors: [], isNew: false },
  { id: 2, name: "Ancestral Recall", set: "LEA", setFull: "Alpha", qty: 1, price: 1850.0, priceChange: 1.1, rarity: "rare", manaColors: ["U"], isNew: false },
  { id: 3, name: "Mox Pearl", set: "LEA", setFull: "Alpha", qty: 2, price: 780.0, priceChange: -0.8, rarity: "rare", manaColors: ["W"], isNew: false },
  { id: 4, name: "Force of Will", set: "ALL", setFull: "Alliances", qty: 4, price: 78.5, priceChange: 3.2, rarity: "uncommon", manaColors: ["U"], isNew: false },
  { id: 5, name: "Liliana of the Veil", set: "ISD", setFull: "Innistrad", qty: 2, price: 42.0, priceChange: 0.5, rarity: "mythic", manaColors: ["B"], isNew: false },
  { id: 6, name: "Snapcaster Mage", set: "ISD", setFull: "Innistrad", qty: 4, price: 28.5, priceChange: -1.2, rarity: "rare", manaColors: ["U"], isNew: false },
]

export default function ManaSaverDashboard() {
  const [cards, setCards] = useState<WantCard[]>(INITIAL_CARDS)
  const [scanModalOpen, setScanModalOpen] = useState(false)

  // Cambiar cantidad de una carta existente
  const handleQtyChange = useCallback((id: number, qty: number) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, qty, isNew: false } : c))
  }, [])

  // Eliminar carta de la lista
  const handleDelete = useCallback((id: number) => {
    setCards(prev => prev.filter(c => c.id !== id))
  }, [])

  // Limpiar toda la lista
  const handleClearAll = useCallback(() => {
    setCards([])
  }, [])

  // Añadir carta (desde buscador o scanner)
  const handleAddCard = useCallback((card: Omit<WantCard, "id" | "qty" | "priceChange">) => {
    setCards(prev => {
      // Buscar si la carta ya está en la lista (mismo nombre y set)
      const existingIndex = prev.findIndex(c =>
        c.name.toLowerCase() === card.name.toLowerCase() &&
        c.set.toLowerCase() === card.set.toLowerCase()
      )

      if (existingIndex >= 0) {
        // Si existe, incrementamos cantidad y activamos el "brillo" de nuevo
        return prev.map((c, i) =>
          i === existingIndex
            ? { ...c, qty: c.qty + 1, isNew: true, imageUrl: card.imageUrl || c.imageUrl }
            : { ...c, isNew: false }
        )
      } else {
        // Si es nueva, va a la parte superior de la lista con ID único
        const newCard: WantCard = {
          ...card,
          id: Date.now(),
          qty: 1,
          priceChange: Math.round((Math.random() * 6 - 2) * 10) / 10,
          isNew: true,
        }
        return [newCard, ...prev.map(c => ({ ...c, isNew: false }))]
      }
    })

    // Quitamos el efecto visual de "Novedad" tras 2 segundos
    setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, isNew: false })))
    }, 2000)
  }, [])

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