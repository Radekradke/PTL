import { useRef, useState } from "react"
import { UploadCloud, X, FileText, FileSpreadsheet, File as FileIcon, Loader2 } from "lucide-react"
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_HINT,
  MAX_ATTACHMENTS_PER_UPLOAD,
  fileToAttachment,
  formatFileSize,
  type AttachmentKind,
  type PendingAttachment,
} from "@/lib/attachments"

type Props = {
  attachments: PendingAttachment[]
  onAdd: (attachment: PendingAttachment) => void
  onRemove: (id: string) => void
  compact?: boolean
  max?: number
}

function kindIcon(kind: AttachmentKind) {
  if (kind === "excel") return <FileSpreadsheet size={18} className="text-emerald-600" />
  if (kind === "pdf") return <FileText size={18} className="text-rose-600" />
  if (kind === "word") return <FileText size={18} className="text-blue-600" />
  if (kind === "text") return <FileText size={18} className="text-slate-500" />
  return <FileIcon size={18} className="text-slate-500" />
}

export function AttachmentPicker({ attachments, onAdd, onRemove, compact = false, max = MAX_ATTACHMENTS_PER_UPLOAD }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const remaining = max - attachments.length
  const atLimit = remaining <= 0

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError(null)

    const files = Array.from(fileList)
    if (files.length > remaining) {
      setError(`Máximo de ${max} arquivos por envio.`)
    }

    const toProcess = files.slice(0, Math.max(0, remaining))
    for (const file of toProcess) {
      setProcessing((n) => n + 1)
      try {
        const attachment = await fileToAttachment(file)
        onAdd(attachment)
      } catch (err: any) {
        setError(err?.message || "Não foi possível processar o arquivo.")
      } finally {
        setProcessing((n) => n - 1)
      }
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (atLimit) return
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />

      {/* Dropzone / botão */}
      <button
        type="button"
        onClick={() => !atLimit && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!atLimit) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={atLimit}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 text-center transition ${
          compact ? "py-3" : "py-5"
        } ${
          dragging
            ? "border-[#00A859] bg-[#ECFBF3]"
            : atLimit
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : "border-[#CFE2D8] bg-[#F8FCFA] hover:border-[#00A859]/50 hover:bg-[#ECFBF3]"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[#073B2A]">
          <UploadCloud size={compact ? 16 : 18} className="text-[#00A859]" />
          {atLimit ? `Limite de ${max} arquivos atingido` : "Arraste arquivos ou clique para selecionar"}
        </span>
        {!compact && <span className="text-[11px] font-medium text-slate-400">{ATTACHMENT_HINT}</span>}
      </button>

      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
        <span>{attachments.length}/{max} arquivo(s)</span>
        {processing > 0 && (
          <span className="inline-flex items-center gap-1 text-[#00A859]">
            <Loader2 size={12} className="animate-spin" /> processando…
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {/* Imagens (miniaturas) */}
          {attachments.some((a) => a.kind === "image") && (
            <div className="flex flex-wrap gap-2">
              {attachments.filter((a) => a.kind === "image").map((photo) => (
                <div key={photo.id} className="group relative">
                  <img
                    src={photo.previewUrl}
                    alt={photo.filename}
                    className={`rounded-xl border border-[#DDE7E2] object-cover shadow-sm ${compact ? "h-16 w-16" : "h-20 w-20"}`}
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(photo.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition hover:bg-red-600"
                    aria-label="Remover arquivo"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Documentos (chips) */}
          {attachments.filter((a) => a.kind !== "image").map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-[#DDE7E2] bg-white px-3 py-2 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-black/5">
                {kindIcon(doc.kind)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111827]">{doc.filename}</p>
                <p className="text-[11px] text-slate-400">{formatFileSize(doc.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(doc.id)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <X size={13} /> remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
