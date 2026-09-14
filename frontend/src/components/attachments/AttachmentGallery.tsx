import { useEffect, useRef, useState } from "react"
import { Download, Eye, FileText, FileSpreadsheet, File as FileIcon, X, Trash2 } from "lucide-react"
import { apiFetch } from "@/services/api"
import { formatFileSize, kindFromMime, type AttachmentKind, type StoredAttachment } from "@/lib/attachments"
import { ImageLightbox, type LightboxImage } from "./ImageLightbox"

type Props = {
  attachments: StoredAttachment[]
  buildPath: (attachment: StoredAttachment) => string
  token?: string | null
  /** Se fornecido, mostra botão de remover em cada anexo (admin/técnico). */
  onRemove?: (attachment: StoredAttachment) => void
}

async function fetchBlobUrl(path: string, token?: string | null): Promise<string> {
  const response = token === undefined ? await apiFetch(path) : await apiFetch(path, {}, token)
  if (!response.ok) throw new Error("Falha ao baixar anexo.")
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

function kindIcon(kind: AttachmentKind) {
  if (kind === "excel") return <FileSpreadsheet size={20} className="text-emerald-600" />
  if (kind === "pdf") return <FileText size={20} className="text-rose-600" />
  if (kind === "word") return <FileText size={20} className="text-blue-600" />
  if (kind === "text") return <FileText size={20} className="text-slate-500" />
  return <FileIcon size={20} className="text-slate-500" />
}

function ImageThumb({
  attachment,
  path,
  token,
  onOpen,
}: {
  attachment: StoredAttachment
  path: string
  token?: string | null
  onOpen: () => void
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchBlobUrl(path, token)
      .then((url) => {
        if (cancelled) { URL.revokeObjectURL(url); return }
        urlRef.current = url
        setSrc(url)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [path, token])

  if (failed) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-[10px] font-semibold text-slate-400">
        Falha ao carregar
      </div>
    )
  }
  if (!src) return <div className="h-24 w-24 animate-pulse rounded-xl bg-slate-200/70" />

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${attachment.filename} — clique para ampliar`}
      className="group relative h-24 w-24 overflow-hidden rounded-xl border border-black/5 shadow-sm transition hover:brightness-95"
    >
      <img src={src} alt={attachment.filename} className="h-full w-full object-cover" />
      <span className="absolute inset-x-0 bottom-0 truncate bg-black/45 px-1.5 py-0.5 text-left text-[9px] font-medium text-white">
        {attachment.filename}
      </span>
    </button>
  )
}

function DocChip({
  attachment,
  path,
  token,
  kind,
  onView,
  onRemove,
}: {
  attachment: StoredAttachment
  path: string
  token?: string | null
  kind: AttachmentKind
  onView: (blobUrl: string) => void
  onRemove?: () => void
}) {
  const [busy, setBusy] = useState<"view" | "download" | null>(null)
  const canView = kind === "pdf" || kind === "text"

  async function handleDownload() {
    setBusy("download")
    try {
      const url = await fetchBlobUrl(path, token)
      const a = document.createElement("a")
      a.href = url
      a.download = attachment.filename || "arquivo"
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch {
      // silencioso — o botão volta ao normal
    } finally {
      setBusy(null)
    }
  }

  async function handleView() {
    setBusy("view")
    try {
      const url = await fetchBlobUrl(path, token)
      onView(url)
    } catch {
      /* noop */
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#DDE7E2] bg-white px-3 py-2.5 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-black/5">
        {kindIcon(kind)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#111827]">{attachment.filename}</p>
        <p className="text-[11px] text-slate-400">{formatFileSize(attachment.size)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {canView && (
          <button
            onClick={handleView}
            disabled={busy !== null}
            className="inline-flex items-center gap-1 rounded-lg border border-[#DDE7E2] bg-white px-2.5 py-1.5 text-xs font-bold text-[#073B2A] transition hover:border-[#00A859]/40 hover:bg-[#ECFBF3] disabled:opacity-50"
          >
            <Eye size={13} />
            <span className="hidden sm:inline">{busy === "view" ? "..." : "Ver"}</span>
          </button>
        )}
        <button
          onClick={handleDownload}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 rounded-lg border border-[#DDE7E2] bg-white px-2.5 py-1.5 text-xs font-bold text-[#073B2A] transition hover:border-[#00A859]/40 hover:bg-[#ECFBF3] disabled:opacity-50"
        >
          <Download size={13} />
          <span className="hidden sm:inline">{busy === "download" ? "..." : "Baixar"}</span>
        </button>
        {onRemove && (
          <button
            onClick={onRemove}
            className="inline-flex items-center justify-center rounded-lg border border-transparent p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Remover anexo"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function PdfViewerModal({ url, filename, onClose }: { url: string; filename: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      URL.revokeObjectURL(url)
    }
  }, [url, onClose])

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="min-w-0 truncate text-sm font-semibold">{filename}</span>
        <div className="flex items-center gap-1.5">
          <a
            href={url}
            download={filename}
            className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <Download size={18} /> Baixar
          </a>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>
      </div>
      <div className="flex-1 px-2 pb-2 sm:px-6 sm:pb-6" onClick={(e) => e.stopPropagation()}>
        <iframe title={filename} src={url} className="h-full w-full rounded-lg bg-white" />
      </div>
    </div>
  )
}

export function AttachmentGallery({ attachments, buildPath, token, onRemove }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [pdfView, setPdfView] = useState<{ url: string; filename: string } | null>(null)

  if (!attachments || attachments.length === 0) return null

  const withKind = attachments.map((a) => ({ a, kind: kindFromMime(a.mimeType, a.filename) }))
  const images = withKind.filter((x) => x.kind === "image")
  const docs = withKind.filter((x) => x.kind !== "image")

  const lightboxImages: LightboxImage[] = images.map(({ a }) => ({
    id: a.id,
    filename: a.filename,
    path: buildPath(a),
  }))

  return (
    <div className="space-y-2.5">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(({ a }, i) => (
            <ImageThumb
              key={a.id}
              attachment={a}
              path={buildPath(a)}
              token={token}
              onOpen={() => setLightboxIndex(i)}
            />
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {docs.map(({ a, kind }) => (
            <DocChip
              key={a.id}
              attachment={a}
              path={buildPath(a)}
              token={token}
              kind={kind}
              onView={(url) => setPdfView({ url, filename: a.filename })}
              onRemove={onRemove ? () => onRemove(a) : undefined}
            />
          ))}
        </div>
      )}

      {onRemove && images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(({ a }) => (
            <button
              key={`rm-${a.id}`}
              onClick={() => onRemove(a)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#DDE7E2] bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={12} /> {a.filename.slice(0, 16)}
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          startIndex={lightboxIndex}
          token={token}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {pdfView && (
        <PdfViewerModal url={pdfView.url} filename={pdfView.filename} onClose={() => setPdfView(null)} />
      )}
    </div>
  )
}
