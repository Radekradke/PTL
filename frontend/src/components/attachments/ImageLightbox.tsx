import { useCallback, useEffect, useRef, useState } from "react"
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react"
import { apiFetch } from "@/services/api"

export type LightboxImage = {
  id: number
  filename: string
  path: string // caminho da API para baixar o binário
}

export function ImageLightbox({
  images,
  startIndex,
  token,
  onClose,
}: {
  images: LightboxImage[]
  startIndex: number
  token?: string | null
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  const current = images[index]
  const hasMultiple = images.length > 1

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + images.length) % images.length)
    },
    [images.length],
  )

  // Carrega o binário da imagem atual (com token no header).
  useEffect(() => {
    let cancelled = false
    setSrc(null)
    setFailed(false)
    setZoomed(false)

    async function load() {
      try {
        const response = token === undefined ? await apiFetch(current.path) : await apiFetch(current.path, {}, token)
        if (!response.ok) throw new Error("falha")
        const blob = await response.blob()
        if (cancelled) return
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = URL.createObjectURL(blob)
        setSrc(objectUrlRef.current)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [current?.path, token])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  // Teclado: ESC fecha, setas navegam.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowRight" && hasMultiple) go(1)
      else if (e.key === "ArrowLeft" && hasMultiple) go(-1)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose, go, hasMultiple])

  function handleDownload() {
    if (!src) return
    const a = document.createElement("a")
    a.href = src
    a.download = current.filename || "imagem"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Visualizando ${current.filename}`}
      onClick={onClose}
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="min-w-0 truncate text-sm font-semibold">
          {current.filename}
          {hasMultiple && <span className="ml-2 text-white/50">{index + 1} / {images.length}</span>}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomed((z) => !z)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            aria-label={zoomed ? "Ajustar à tela" : "Ampliar"}
          >
            {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
          </button>
          <button
            onClick={handleDownload}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            aria-label="Baixar"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Área da imagem */}
      <div className="relative flex flex-1 items-center justify-center overflow-auto px-2 py-2">
        {hasMultiple && (
          <button
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 sm:left-4"
            aria-label="Anterior"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {failed ? (
          <p className="text-sm text-white/70">Não foi possível carregar a imagem.</p>
        ) : !src ? (
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
        ) : (
          <img
            src={src}
            alt={current.filename}
            onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z) }}
            className={
              zoomed
                ? "max-w-none cursor-zoom-out rounded-lg"
                : "max-h-[82vh] max-w-[94vw] cursor-zoom-in rounded-lg object-contain shadow-2xl"
            }
          />
        )}

        {hasMultiple && (
          <button
            onClick={(e) => { e.stopPropagation(); go(1) }}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 sm:right-4"
            aria-label="Próxima"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  )
}
