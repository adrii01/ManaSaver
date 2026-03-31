"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/manasaver/Header"
import { QuickActions } from "@/components/manasaver/QuickActions"
import { WantsList, type WantCard } from "@/components/manasaver/WantsList"
import { SniperFeed } from "@/components/manasaver/SniperFeed"
import { Footer } from "@/components/manasaver/Footer"
import { ScanModal } from "@/components/manasaver/ScanModal"

// Array vacío para que no salgan cartas predeterminadas
const INITIAL_CARDS: WantCard[] = []

export default function ManaSaverDashboard() {
  const [cards, setCards] = useState<WantCard[]>(INITIAL_CARDS)
  const [scanModalOpen, setScanModalOpen] = useState(false)

  // CAMBIAR CANTIDAD: Asegura que React detecte el cambio de datos y fuerce el recálculo
  const handleQtyChange = useCallback((id: number, qty: number) => {
    setCards(prev => {
      return prev.map(c => {
        if (c.id === id) {
          return { ...c, qty: Number(qty), isNew: false }
        }
        return c
      })
    })
  }, [])

  // ELIMINAR CARTA
  const handleDelete = useCallback((id: number) => {
    setCards(prev => prev.filter(c => c.id !== id))
  }, [])

  // LIMPIAR TODO
  const handleClearAll = useCallback(() => {
    setCards([])
  }, [])

  // AÑADIR CARTA: Unificada para buscador y scanner con ID único
  const handleAddCard = useCallback((card: Omit<WantCard, "id" | "qty" | "priceChange">) => {
    setCards(prev => {
      const existingIndex = prev.findIndex(c =>
        c.name.toLowerCase() === card.name.toLowerCase() &&
        c.set.toLowerCase() === card.set.toLowerCase()
      )

      if (existingIndex >= 0) {
        // Si ya está en la lista, subimos cantidad
        return prev.map((c, i) =>
          i === existingIndex
            ? { ...c, qty: c.qty + 1, isNew: true }
            : { ...c, isNew: false }
        )
      } else {
        // Si es nueva, arriba con ID basado en timestamp para evitar duplicados
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

    // Quitar efecto de "brillo" tras 2 segundos
    setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, isNew: false })))
    }, 2000)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
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