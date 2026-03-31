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

  // ESTADOS PARA CÁMARA Y OCR
  const [cameraOpen, setCameraOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [foundCard, setFoundCard] = useState<ScryfallCard | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // --- LÓGICA DE ESCÁNER ---
  const startCamera = async () => {
    setFoundCard(null)
    setCameraOpen(true)
    setSearchOpen(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } }
      })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      alert("Error al abrir la cámara. Revisa los permisos.")
      setCameraOpen(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop())
    }
    setCameraOpen(false)
  }

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setIsProcessing(true)

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // RECORTE DE PRECISIÓN: Enfocamos solo el 15% superior de la carta (donde está el nombre)
    const sw = video.videoWidth * 0.7
    const sh = video.videoHeight * 0.15
    const sx = (video.videoWidth - sw) / 2
    const sy = video.videoHeight * 0.15 // Ajustado para capturar la franja del nombre

    canvas.width = sw
    canvas.height = sh
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)

    try {
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng')
      // Limpiamos el texto para quedarnos solo con letras y espacios (evita símbolos raros)
      const cleanedName = text.split('\n').replace(/[^a-zA-Z ]/g, "").trim()

      console.log("OCR Result:", cleanedName)

      if (cleanedName.length > 3) {
        const card = await searchCardByName(cleanedName)
        if (card) {
          setFoundCard(card)
          stopCamera()
        } else {
          alert(`No se encontró nada para: "${cleanedName}". Intenta enfocar mejor.`)
        }
      } else {
        alert("No he podido leer el nombre. Asegúrate de que haya buena luz.")
      }
    } catch (e) {
      console.error("Error en OCR:", e)
    } finally {
      setIsProcessing(false)
    }
  }

  // --- LÓGICA DE BÚSQUEDA ORIGINAL ---
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

  const handleAddCardInternal = useCallback((card: ScryfallCard) => {
    onAddCard({
      name: card.name,
      set: card.set.toUpperCase(),
      setFull: card.set_name,
      price: card.prices.eur ? parseFloat(card.prices.eur) : 0,
      rarity: mapRarity(card.rarity),
      manaColors: extractManaColors(card),
      imageUrl: getCardImageUrl(card, "small") || undefined,
      cardmarketUrl: card.purchase_uris?.cardmarket || undefined,
    })
    setSearchOpen(false)
    setSearchQuery("")
    setSuggestions([])
    setFoundCard(null)
  }, [onAddCard])

  return (
    <section className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />

      {/* Botones principales */}
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
            className={cn("h-14 w-full gap-2 border-border text-foreground transition-all", searchOpen && "border-primary text-primary")}
          >
            <Search className="h-5 w-5" />
            <span className="font-semibold">Search</span>
          </Button>
        </div>
      </div>

      {/* VISOR DE CÁMARA (Solo si está abierta) */}
      {cameraOpen && (
        <Card className="relative overflow-hidden aspect-[3/4] bg-black rounded-xl border-2 border-primary/50 animate-in fade-in duration-300">
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />

          {/* Marco de enfoque para el nombre */}
          <div className="absolute inset-0 flex flex-col items-center justify-start pt-[15%]">
            <div className="w-[80%] h-14 border-2 border-yellow-400 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-20 flex items-center justify-center">
              <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded">
                Nombre de la carta aquí
              </span>
            </div>
          </div>

          <Button
            onClick={captureAndScan}
            disabled={isProcessing}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] z-30"
          >
            {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Sparkles className="h-8 w-8" />}
          </Button>
        </Card>
      )}

      {/* RESULTADO DEL ESCÁNER (Previsualización antes de añadir) */}
      {foundCard && (
        <Card className="p-3 border-primary bg-card/50 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="flex gap-4 items-center">
            <img src={getCardImageUrl(foundCard, "small") || ""} alt={foundCard.name} className="h-20 rounded shadow-md" />
            <div className="flex-1">
              <h3 className="font-bold text-sm leading-tight">{foundCard.name}</h3>
              <p className="text-xl font-black text-primary mt-1">{foundCard.prices.eur || foundCard.prices.usd}€</p>
              <Button size="sm" onClick={() => handleAddCardInternal(foundCard)} className="mt-2 w-full h-8 text-xs bg-primary">
                <Plus className="h-3 w-3 mr-1" /> Añadir a mi lista
              </Button>
            </div>
            <button onClick={() => setFoundCard(null)} className="p-1 self-start text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* BUSCADOR CON AUTOCOMPLETADO */}
      {searchOpen && (
        <div className="relative animate-in slide-in-from-top-2 duration-200">
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Type and wait..."
            className="h-14 border-primary bg-card"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
              {suggestions.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleAddCardInternal(card)}
                  className="flex items-center w-full gap-3 px-3 py-2.5 hover:bg-secondary text-left border-b border-border last:border-0 transition-colors"
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

      {/* IMPORT WANTS LIST */}
      <Card className="border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <button
            onClick={() => setImportOpen(!importOpen)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Import Wants List</p>
                <p className="text-xs text-muted-foreground">Paste a list of card names</p>
              </div>
            </div>
            <FileText className={cn("h-4 w-4 text-muted-foreground transition-transform", importOpen && "rotate-180")} />
          </button>

          {importOpen && (
            <div className="border-t border-border p-4 space-y-3">
              <Textarea
                placeholder={"Black Lotus\nAncestral Recall"}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[100px] resize-none border-border bg-background font-mono text-foreground"
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-primary text-primary-foreground">
                  Import Cards
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setImportOpen(false); setImportText("") }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}