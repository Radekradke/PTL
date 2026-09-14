import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Lightbulb, Send, CheckCircle2, RefreshCw, Clock3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch, getPortalToken } from "@/services/api"
import { AttachmentPicker } from "@/components/attachments/AttachmentPicker"
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery"
import { attachmentPayload, type PendingAttachment } from "@/lib/attachments"
import { SUGGESTION_CATEGORIES, suggestionBadgeClass, statusDot, type Suggestion } from "@/lib/suggestions"

type Props = {
  employee: { id: number; name: string; sector?: { name?: string } | null }
}

export function EmployeeSuggestions({ employee }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [improvement, setImprovement] = useState("")
  const [category, setCategory] = useState<string>(SUGGESTION_CATEGORIES[0])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [files, setFiles] = useState<PendingAttachment[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [mine, setMine] = useState<Suggestion[]>([])
  const [loadingMine, setLoadingMine] = useState(false)

  async function loadMine() {
    setLoadingMine(true)
    try {
      const response = await apiFetch(`/suggestions/mine/${employee.id}`, {}, getPortalToken())
      if (response.ok) setMine(await response.json())
    } catch {
      /* silencioso */
    } finally {
      setLoadingMine(false)
    }
  }

  useEffect(() => {
    loadMine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id])

  async function handleSubmit() {
    if (submitting) return
    if (title.trim().length < 3) { toast.error("Dê um título à sua sugestão."); return }
    if (description.trim().length < 5) { toast.error("Descreva sua ideia ou o problema."); return }

    setSubmitting(true)
    try {
      const response = await apiFetch("/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          improvement: improvement.trim() || undefined,
          category,
          isAnonymous,
          attachments: attachmentPayload(files),
        }),
      }, getPortalToken())

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast.error(data.message || "Erro ao enviar sugestão.")
        return
      }

      setSuccess(true)
      setTitle("")
      setDescription("")
      setImprovement("")
      setCategory(SUGGESTION_CATEGORIES[0])
      setIsAnonymous(false)
      setFiles([])
      loadMine()
    } catch {
      toast.error("Erro ao enviar sugestão. Verifique sua conexão.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="relative mb-2">
          <div className="absolute inset-0 rounded-full bg-[#39D98A]/20 blur-2xl" />
          <CheckCircle2 className="relative h-16 w-16 text-[#00A859]" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#111827]">Sugestão enviada!</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
          Obrigado pela contribuição. A administração vai analisar sua sugestão.
        </p>
        <Button
          className="mt-8 h-11 px-8 rounded-2xl bg-[#00A859] font-bold text-white shadow-md transition hover:bg-[#07934E]"
          onClick={() => setSuccess(false)}
        >
          Enviar outra sugestão
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      {/* Formulário */}
      <div>
        <div className="mb-5 flex items-start gap-4">
          <div className="ls-card-dark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-sm)]">
            <Lightbulb size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-[#111827]">Tem uma ideia para melhorar nosso trabalho?</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Envie sugestões de melhorias, novas ferramentas, automações, mudanças de processo ou problemas que poderiam ser resolvidos de uma maneira melhor.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Título da sugestão</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Automatizar solicitação de compras"
              className="mt-1.5 h-11 rounded-2xl border-[color:var(--hairline)] bg-white text-[#111827] focus:border-[#00A859]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Descreva sua ideia ou problema</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Você não precisa saber a solução. Pode simplesmente relatar um problema. Ex.: Hoje preenchemos a mesma informação em duas planilhas diferentes."
              className="mt-1.5 min-h-[130px] rounded-2xl border-[color:var(--hairline)] bg-white px-4 py-3 text-sm text-slate-950 focus:border-[#00A859]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Como você imagina que isso poderia melhorar? <span className="font-medium normal-case text-slate-400">(opcional)</span></label>
            <Textarea
              value={improvement}
              onChange={(e) => setImprovement(e.target.value)}
              placeholder="Se tiver uma ideia de solução, conte aqui."
              className="mt-1.5 min-h-[80px] rounded-2xl border-[color:var(--hairline)] bg-white px-4 py-3 text-sm text-slate-950 focus:border-[#00A859]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-2xl border border-[color:var(--hairline)] bg-white px-4 text-sm font-semibold text-[#111827] outline-none transition focus:border-[#00A859] focus:ring-4 focus:ring-[#00A859]/10"
              >
                {SUGGESTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Setor relacionado</label>
              <Input
                value={employee.sector?.name || "—"}
                readOnly
                className="mt-1.5 h-11 cursor-default select-none rounded-2xl border-[color:var(--hairline)] bg-[color:var(--surface-inset)] text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Anexos <span className="font-medium normal-case text-slate-400">(opcional)</span></label>
            <div className="mt-1.5">
              <AttachmentPicker
                attachments={files}
                onAdd={(a) => setFiles((cur) => [...cur, a])}
                onRemove={(id) => setFiles((cur) => cur.filter((f) => f.id !== id))}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-[color:var(--hairline)] bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-[#00A859]"
            />
            <span className="text-sm font-semibold text-[#111827]">Enviar anonimamente</span>
            <span className="text-xs text-slate-400">— seu nome não aparece para quem analisa</span>
          </label>

          <Button
            className="h-12 w-full rounded-xl bg-[#00A859] font-bold text-white shadow-[var(--shadow-xs)] transition hover:bg-[#07934E] disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting || title.trim().length < 3 || description.trim().length < 5}
          >
            {submitting ? "Enviando..." : "Enviar sugestão"}
            <Send size={16} className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Minhas sugestões */}
      <div className="rounded-[1.35rem] border border-[color:var(--hairline)] bg-[color:var(--surface-inset)] p-4 sm:rounded-[1.5rem]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-black tracking-[-0.03em] text-[#111827]">Minhas sugestões</h3>
          <button
            onClick={loadMine}
            disabled={loadingMine}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--hairline)] bg-white text-slate-500 transition hover:text-[#00A859]"
            aria-label="Atualizar"
          >
            <RefreshCw size={14} className={loadingMine ? "animate-spin" : ""} />
          </button>
        </div>

        {mine.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CFE2D8] bg-white p-6 text-center">
            <Lightbulb size={22} className="mx-auto mb-2 text-[#00A859]" />
            <p className="text-sm font-bold text-[#073B2A]">Nenhuma sugestão ainda</p>
            <p className="mt-1 text-xs text-slate-400">Suas sugestões enviadas aparecem aqui com o status.</p>
          </div>
        ) : (
          <div className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
            {mine.map((s) => (
              <div key={s.id} className="rounded-2xl border border-[color:var(--hairline)] bg-white p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="min-w-0 text-sm font-black text-[#111827]">{s.title}</h4>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${suggestionBadgeClass(s.status)}`}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusDot[s.status] || "#94A3B8" }} />
                    {s.status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{s.description}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock3 size={11} />
                  <span>{new Date(s.createdAt).toLocaleDateString("pt-BR")}</span>
                  <span className="text-slate-300">·</span>
                  <span>{s.category}</span>
                </div>
                {s.attachments?.length > 0 && (
                  <div className="mt-2.5">
                    <AttachmentGallery
                      attachments={s.attachments}
                      buildPath={(a) => `/suggestions/${s.id}/attachments/${a.id}`}
                      token={getPortalToken()}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
