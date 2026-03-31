"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Camera, Search, Upload, FileText, X, Plus, Loader2, Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ManaIcons } from "./ManaIcons"
import { cn } from "@/lib/utils"
import { searchCards, searchCardByName, extractManaColors, getCardImageUrl, mapRarity, type ScryfallCard } from "@/lib/scryfall"
import { useDebouncedCallback } from "use-debounce"
import Tesseract from "tesseract.js"

interface QuickActionsProps {
  onScanClick?: () => void
  onAddCard: (card: {
    name: string
    set: string
    setFull: string
    price: number
    rarity: "mythic" | "rare" | "uncommon" | "common"
    manaColors: string[]
    imageUrl?: string
    cardmarketUrl?: string
  }) => void
}

export function QuickActions({ onAddCard }: QuickActionsProps) {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<ScryfallCard[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingCard, setIsLoadingCard] = useState(false)

  // ESTADOS DE CÁMARA Y OCR
  const [cameraOpen, setCameraOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // --- LÓGICA DE CÁMARA ---
  const startCamera = async () => {
    setCameraOpen(true)
    setSearchOpen(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } }
      })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      alert("Error al acceder a la cámara")
      setCameraOpen(false)
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach(track => track.stop())
    setCameraOpen(false)
  }

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setIsProcessing(true)
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng')
        const cleanedName = text.split('\n').replace(/[^a-zA-Z ]/g, "").trim()

        if (cleanedName.length > 3) {
          const card = await searchCardByName(cleanedName)
          if (card) {
            handleSelectSuggestion(card)
            stopCamera()
          } else {
            alert("Carta leída como '" + cleanedName + "' pero no encontrada.")
          }
        }
      } catch (e) {
        alert("Error en el escaneo")
      }
    }
    setIsProcessing(false)
  }

  // --- LÓGICA DE BÚSQUEDA (TUYA ORIGINAL) ---
  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); return }
    setIsSearching(true)
    const results = await searchCards(query, 6)
    setSuggestions(results)
    setIsSearching(false)
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    debouncedSearch(e.target.value)
  }

  const handleSelectSuggestion = useCallback((card: ScryfallCard) => {
    const price = card.prices.eur ? parseFloat(card.prices.eur) : 0
    onAddCard({
      name: card.name,
      set: card.set.toUpperCase(),
      setFull: card.set_name,
      price,
      rarity: mapRarity(card.rarity),
      manaColors: extractManaColors(card),
      imageUrl: getCardImageUrl(card, "small") || undefined,
      cardmarketUrl: card.purchase_uris?.cardmarket || undefined,
    })
    setSearchOpen(false)
    setSearchQuery("")
    setSuggestions([])
  }, [onAddCard])

  return (
    <section className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          onClick={cameraOpen ? stopCamera : startCamera}
          className={cn(
            "h-14 gap-2 transition-all font-semibold",
            cameraOpen ? "bg-destructive text-white" : "bg-primary text-primary-foreground shadow-lg"
          )}
        >
          {cameraOpen ? <X className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
          <span>{cameraOpen ? "Close" : "Scan Card"}</span>
        </Button>

        <div ref={searchRef} className="relative">
          <Button
            size="lg"
            variant="outline"
            onClick={() => { setSearchOpen(!searchOpen); setCameraOpen(false); }}
            className="h-14 w-full gap-2 border-border text-foreground hover:border-primary/50 transition-all"
          >
            <Search className="h-5 w-5" />
            <span className="font-semibold">Search</span>
          </Button>
        </div>
      </div>

      {/* VISOR DE CÁMARA */}
      {cameraOpen && (
        <Card className="relative overflow-hidden aspect-[3/4] bg-black rounded-xl border-2 border-primary/50">
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-12 border-2 border-yellow-400 rounded shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-tighter">Nombre de la carta aquí</span>
            </div>
          </div>
          <Button
            onClick={captureAndScan}
            disabled={isProcessing}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-primary shadow-2xl active:scale-95 transition-transform"
          >
            {isProcessing ? <RefreshCw className="h-8 w-8 animate-spin" /> : <Sparkles className="h-8 w-8" />}
          </Button>
        </Card>
      )}

      {/* BUSCADOR DESPLEGABLE (TUYO ORIGINAL) */}
      {searchOpen && (
        <div className="relative animate-in fade-in zoom-in duration-200">
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Type card name..."
            className="h-14 pr-10 border-primary bg-card"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
              {suggestions.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleSelectSuggestion(card)}
                  className="flex items-center w-full gap-3 px-3 py-2.5 hover:bg-secondary text-left border-b border-border last:border-0"
                >
                  {getCardImageUrl(card, "small") && (
                    <img src={getCardImageUrl(card, "small")!} alt={card.name} className="h-10 w-7 rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{card.name}</p>
                      <ManaIcons colors={extractManaColors(card)} size="sm" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{card.set_name}</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* IMPORT WANTS LIST (TUYO ORIGINAL) */}
      <Card className="border-border bg-card">
        {/* Aquí va el resto de tu código de Import que ya tenías */}
      </Card>
    </section>
  )
}