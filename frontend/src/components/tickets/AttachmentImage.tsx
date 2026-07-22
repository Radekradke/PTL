import { useEffect, useState } from "react"

import { apiFetch } from "@/services/api"
import type { MessageAttachment } from "@/lib/ticketPhotos"

// A rota de anexos exige o token no header, então a imagem é baixada via fetch
// e exibida como object URL (uma <img src> direta não enviaria o Authorization).
export function AttachmentImage({
  ticketId,
  attachment,
  token,
}: {
  ticketId: number
  attachment: MessageAttachment
  token?: string | null
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    async function load() {
      try {
        const path = `/tickets/${ticketId}/attachments/${attachment.id}`
        const response =
          token === undefined ? await apiFetch(path) : await apiFetch(path, {}, token)
        if (!response.ok) throw new Error("Falha ao baixar anexo")

        const blob = await response.blob()
        if (cancelled) return

        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [ticketId, attachment.id, token])

  if (failed) {
    return (
      <div className="flex h-24 w-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-2 text-center text-[10px] font-semibold text-slate-400">
        Não foi possível carregar a foto
      </div>
    )
  }

  if (!src) {
    return <div className="h-24 w-32 animate-pulse rounded-xl bg-slate-200/70" />
  }

  return (
    <img
      src={src}
      alt={attachment.filename}
      title="Clique para ampliar"
      className="max-h-48 max-w-full cursor-zoom-in rounded-xl border border-black/5 object-cover shadow-sm transition hover:brightness-95"
      onClick={() => window.open(src, "_blank", "noopener")}
    />
  )
}
