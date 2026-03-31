"use client"

import { useState, useCallback, useEffect } from "react"
import { Header } from "@/components/manasaver/Header"
import { QuickActions } from "@/components/manasaver/QuickActions"
import { WantsList, type WantCard } from "@/components/manasaver/WantsList"
import { SniperFeed } from "@/components/manasaver/SniperFeed"
import { Footer } from "@/components/manasaver/Footer"
import { ScanModal } from "@/components/manasaver/ScanModal"

export default function ManaSaverDashboard() {
  // Inicializamos con un array vacío
  const [cards, setCards] = useState<WantCard[]>([])
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [nextId, setNextId] = useState(100)
  const [isLoaded, setIsLoaded] = useState(false)

  // EFECTO 1: Cargar las cartas guardadas al abrir la app
  useEffect(() => {
    const savedCards = localStorage.getItem("manaSaver_collection")
    if (savedCards) {
      try {
        setCards(JSON.parse(savedCards))
      } catch (e) {
        console.error("Error cargando colección", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // EFECTO 2: Guardar automáticamente cuando la lista cambie
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("manaSaver_collection", JSON.stringify(cards))
    }
  }, [cards, isLoaded])

  const handleQtyChange = useCallback((id: number, qty: number) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, qty, isNew: false } : c))
  }, [])

  const handleDelete = useCallback((id: number) => {
    setCards(prev => prev.filter(c => c.id !== id))
  }, [])

  const handleClearAll = useCallback(() => {
    if (confirm("¿Seguro que quieres borrar toda tu lista?")) {
      setCards([])
    }
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
    const existingIndex = cards.findIndex(c =>
      c.name.toLowerCase() === card.name.toLowerCase() &&
      c.set.toLowerCase() === card.set.toLowerCase()
    )

    if (existingIndex >= 0) {
      setCards(prev => prev.map((c, i) =>
        i === existingIndex
          ? { ...c, qty: c.qty + 1, isNew: true, imageUrl: card.imageUrl || c.imageUrl, cardmarketUrl: card.cardmarketUrl || c.cardmarketUrl }
          : { ...c, isNew: false }
      ))
    } else {
      const newCard: WantCard = {
        id: Date.now(), // Usamos timestamp para que el ID sea único siempre
        name: card.name,
        set: card.set,
        setFull: card.setFull,
        qty: 1,
        price: card.price,
        priceChange: Math.round((Math.random() * 6 - 2) * 10) / 10,
        rarity: card.rarity,
        manaColors: card.manaColors,
        imageUrl: card.imageUrl,
        cardmarketUrl: card.cardmarketUrl,
        isNew: true,
      }
      setCards(prev => [newCard, ...prev.map(c => ({ ...c, isNew: false }))])
    }

    // Quitamos el efecto de "nuevo" tras 2 segundos
    setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, isNew: false })))
    }, 2000)
  }, [cards])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 space-y-6">
        <QuickActions
          onScanClick={() => setScanModalOpen(true)}
          onAddCard={handleAddCard}
        />

        {/* Solo mostramos la lista si hay cartas o si ya ha cargado */}
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