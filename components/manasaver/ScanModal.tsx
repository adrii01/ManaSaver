"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Camera, Scan, Sparkles, AlertCircle, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { searchCardByName, extractManaColors, getCardImageUrl, mapRarity } from "@/lib/scryfall"
import Tesseract from "tesseract.js"

interface ScanModalProps {
  open: boolean
  onClose: () => void
  onCardScanned: (card: {
    name: string
    set: string
    setFull: string
    price: number
    rarity: "mythic" | "rare" | "uncommon" | "common"
    manaColors: string[]
    imageUrl?: string
  }) => void
}

export function ScanModal({ open, onClose, onCardScanned }: ScanModalProps) {
  const [scanning, setScanning] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState<string>("")
  const [scanned, setScanned] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [detectedText, setDetectedText] = useState<string>("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize camera when modal opens
  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      stopCamera()
      setScanning(false)
      setScanned(false)
      setCameraError(null)
      setCameraReady(false)
      setOcrProgress(0)
      setOcrStatus("")
      setDetectedText("")
    }

    return () => {
      stopCamera()
    }
  }, [open])

  const startCamera = async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraReady(true)
        }
      }
    } catch (err) {
      console.error("Camera access error:", err)
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setCameraError("Camera access denied. Please allow camera permissions.")
        } else if (err.name === "NotFoundError") {
          setCameraError("No camera found on this device.")
        } else {
          setCameraError("Could not access camera. Please try again.")
        }
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const extractCardName = (text: string): string => {
    // 1. Dividimos y limpiamos. El resultado es un Array (string[])
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2);

    // 2. Si no hay líneas, devolvemos un string vacío
    if (lines.length === 0) return "";

    // 3. ESTA ES LA CLAVE: 
    // Usamos lines directamente dentro del procesamiento.
    // Al hacer esto, TypeScript sabe que el resultado es un STRING único.
    return String(lines)
      .replace(/[^a-zA-Z\s',\-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Capture frame and process with real Tesseract OCR
  const handleScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    setScanning(true)
    setOcrStatus("Leyendo hechizo...")
    setOcrProgress(0)

    // Set canvas dimensions
    // --- MEJORA DE CAPTURA ---
    // Usamos una resolución alta (1080p aprox) para que el texto sea nítido
    canvas.width = 1080;
    canvas.height = 1512; // Proporción perfecta de carta Magic (2.5x3.5)

    // Calculamos el recorte para coger solo el centro del video (donde está el marco)
    const sourceSize = Math.min(video.videoWidth, video.videoHeight);
    const offsetX = (video.videoWidth - sourceSize) / 2;

    ctx.drawImage(
      video,
      offsetX, 0, sourceSize, video.videoHeight, // Área de origen (sensor)
      0, 0, canvas.width, canvas.height        // Área de destino (nuestro marco)
    );

    // Pasamos a JPEG con buena calidad para que el OCR trabaje mejor que con PNG
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    // --- FIN MEJORA ---

    console.log("Escaneando...")

    try {
      // Run Tesseract OCR with progress tracking
      const result = await Tesseract.recognize(imageData, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100))
            setOcrStatus("Leyendo hechizo...")
          } else if (m.status === "loading language traineddata") {
            setOcrStatus("Cargando diccionario magico...")
          } else if (m.status === "initializing tesseract") {
            setOcrStatus("Invocando Tesseract...")
          }
        },
      })

      const extractedText = result.data.text
      console.log("OCR Result:", extractedText)

      // Extract card name from OCR text
      const cardName = extractCardName(extractedText)
      setDetectedText(cardName)
      setOcrStatus("Buscando en Scryfall...")

      if (cardName) {
        // Search Scryfall with the extracted name
        const card = await searchCardByName(cardName)

        setScanning(false)
        setScanned(true)

        setTimeout(() => {
          if (card) {
            const price = card.prices.eur ? parseFloat(card.prices.eur) :
              card.prices.usd ? parseFloat(card.prices.usd) * 0.92 : 1.0
            onCardScanned({
              name: card.name,
              set: card.set.toUpperCase(),
              setFull: card.set_name,
              price,
              rarity: mapRarity(card.rarity),
              manaColors: extractManaColors(card),
              imageUrl: getCardImageUrl(card, "small") || undefined,
            })
          } else {
            // Use fallback with detected text
            onCardScanned({
              name: cardName || "Unknown Card",
              set: "???",
              setFull: "Manual Entry",
              price: 1.0,
              rarity: "common",
              manaColors: [],
            })
          }
          onClose()
        }, 800)
      } else {
        // No text detected - use fallback
        setOcrStatus("No se pudo leer...")
        setTimeout(() => {
          setScanning(false)
          setScanned(false)
          setOcrStatus("")
        }, 1500)
      }
    } catch (error) {
      console.error("OCR Error:", error)
      setOcrStatus("Error en OCR")

      // Fallback to demo card
      setTimeout(async () => {
        const card = await searchCardByName("Lightning Bolt")
        setScanning(false)
        setScanned(true)

        setTimeout(() => {
          if (card) {
            const price = card.prices.eur ? parseFloat(card.prices.eur) : 1.5
            onCardScanned({
              name: card.name,
              set: card.set.toUpperCase(),
              setFull: card.set_name,
              price,
              rarity: mapRarity(card.rarity),
              manaColors: extractManaColors(card),
              imageUrl: getCardImageUrl(card, "small") || undefined,
            })
          }
          onClose()
        }, 600)
      }, 1000)
    }
  }, [onCardScanned, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Escáner de Cartas</p>
              <p className="text-[11px] text-muted-foreground">Encuadra la carta completa en el marco</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera preview */}
        <div className="relative aspect-[3/4] bg-background overflow-hidden">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-sm font-medium text-foreground mb-2">Camera Error</p>
              <p className="text-xs text-muted-foreground">{cameraError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={startCamera}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Video element for real camera feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "absolute inset-0 w-full h-full object-cover",
                  !cameraReady && "opacity-0"
                )}
              />

              {/* Hidden canvas for capturing frames */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Loading state while camera initializes */}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <div className="flex flex-col items-center gap-2">
                    <Scan className="h-8 w-8 text-primary animate-pulse" />
                    <span className="text-xs text-muted-foreground">Initializing camera...</span>
                  </div>
                </div>
              )}

              {/* Focus rectangle overlay */}
              <div className="absolute inset-6 flex items-center justify-center pointer-events-none">
                <div className={cn(
                  "relative w-full h-full border-2 rounded-xl transition-all duration-300",
                  scanning ? "border-primary animate-pulse" : "border-primary/50",
                  scanned && "border-savings"
                )}>
                  {/* Corner accents */}
                  <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-xl" />
                  <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-xl" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-xl" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-xl" />

                  {/* Scanning line animation */}
                  {scanning && (
                    <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
                  )}

                  {/* Center status */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {scanned ? (
                      <div className="flex flex-col items-center gap-2 animate-in zoom-in-75 duration-300 bg-background/80 p-4 rounded-xl">
                        <Sparkles className="h-10 w-10 text-savings" />
                        <span className="text-sm font-bold text-savings">Card Found!</span>
                        {detectedText && (
                          <span className="text-xs text-muted-foreground max-w-[200px] truncate">{detectedText}</span>
                        )}
                      </div>
                    ) : scanning ? (
                      <div className="flex flex-col items-center gap-3 bg-background/90 p-5 rounded-xl backdrop-blur-sm">
                        <Wand2 className="h-10 w-10 text-primary animate-bounce" />
                        <div className="text-center">
                          <span className="text-sm font-bold text-primary block">{ocrStatus}</span>
                          {ocrProgress > 0 && (
                            <div className="mt-2 w-32">
                              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-300 rounded-full"
                                  style={{ width: `${ocrProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1">{ocrProgress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : cameraReady ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full aspect-[2.5/3.5] max-w-[240px] rounded-xl border-2 border-dashed border-white/40 flex items-center justify-center bg-primary/5 backdrop-blur-[2px]">
                          <div className="flex flex-col items-center gap-2">
                            <Scan className="h-8 w-8 text-white/20" />
                            <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Align Full Card</span>
                          </div>
                        </div>
                        <span className="text-xs text-white/70 bg-background/50 px-2 py-1 rounded">
                          Ajusta los bordes al recuadro
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border">
          <Button
            size="lg"
            onClick={handleScan}
            disabled={scanning || scanned || !cameraReady || !!cameraError}
            className={cn(
              "w-full h-12 gap-2 font-semibold transition-all",
              scanned
                ? "bg-savings text-savings-foreground"
                : "bg-primary text-primary-foreground shadow-[0_0_20px_oklch(0.72_0.16_195/0.25)] hover:shadow-[0_0_28px_oklch(0.72_0.16_195/0.4)]"
            )}
          >
            {scanned ? (
              <>
                <Sparkles className="h-5 w-5" />
                Adding to List...
              </>
            ) : scanning ? (
              <>
                <Wand2 className="h-5 w-5 animate-spin" />
                {ocrStatus || "Processing..."}
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                Capture
              </>
            )}
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 8%; }
          50% { top: 88%; }
        }
        .animate-scan {
          animation: scan 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
