import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { AppLayout } from "@/components/layout/AppLayout"
import { Reveal } from "@/components/ui/reveal"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/services/api"
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery"
import {
  SUGGESTION_CATEGORIES,
  SUGGESTION_STATUSES,
  suggestionBadgeClass,
  statusDot,
  type Suggestion,
} from "@/lib/suggestions"
import { Lightbulb, Search, X, User, Clock3, RotateCcw } from "lucide-react"

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${suggestionBadgeClass(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusDot[status] || "#94A3B8" }} />
      {status}
    </span>
  )
}

export function SuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [q, setQ] = useState("")

  const [selected, setSelected] = useState<Suggestion | null>(null)
  const [editStatus, setEditStatus] = useState("Nova")
  const [editNote, setEditNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function loadList() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "Todos") params.set("status", statusFilter)
      if (categoryFilter !== "Todas") params.set("category", categoryFilter)
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      if (q.trim()) params.set("q", q.trim())
      const response = await apiFetch(`/suggestions?${params.toString()}`)
      if (response.ok) setItems(await response.json())
      else setItems([])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, from, to])

  const hasFilters = statusFilter !== "Todos" || categoryFilter !== "Todas" || from || to || q.trim()

  async function openDetail(id: number) {
    try {
      const response = await apiFetch(`/suggestions/${id}`)
      if (!response.ok) { toast.error("Erro ao abrir sugestão."); return }
      const full: Suggestion = await response.json()
      setSelected(full)
      setEditStatus(full.status)
      setEditNote(full.internalNote || "")
    } catch {
      toast.error("Erro ao abrir sugestão.")
    }
  }

  async function saveChanges() {
    if (!selected) return
    setSaving(true)
    try {
      const response = await apiFetch(`/suggestions/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, internalNote: editNote }),
      })
      if (!response.ok) { toast.error("Erro ao salvar."); return }
      const updated: Suggestion = await response.json()
      setSelected(updated)
      setItems((cur) => cur.map((s) => (s.id === updated.id ? { ...s, status: updated.status } : s)))
      toast.success("Sugestão atualizada.")
    } catch {
      toast.error("Erro ao salvar.")
    } finally {
      setSaving(false)
    }
  }

  async function removeAttachment(attachmentId: number) {
    if (!selected) return
    try {
      const response = await apiFetch(`/suggestions/${selected.id}/attachments/${attachmentId}`, { method: "DELETE" })
      if (!response.ok) { toast.error("Erro ao remover anexo."); return }
      setSelected({ ...selected, attachments: selected.attachments.filter((a) => a.id !== attachmentId) })
    } catch {
      toast.error("Erro ao remover anexo.")
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of items) map[s.status] = (map[s.status] || 0) + 1
    return map
  }, [items])

  return (
    <AppLayout>
      <div className="ls-page-shell">
        <Reveal>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-4xl">
                <Lightbulb className="text-[#00A859]" size={28} /> Sugestões
              </h1>
              <p className="mt-1.5 text-sm text-[color:var(--muted-foreground)]">Ideias e melhorias enviadas pela equipe.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTION_STATUSES.filter((s) => counts[s]).map((s) => (
                <span key={s} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${suggestionBadgeClass(s)}`}>
                  {s} {counts[s]}
                </span>
              ))}
            </div>
          </header>
        </Reveal>

        {/* Filtros */}
        <Reveal delay={0.04}>
          <section className="ls-card p-3 sm:p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative lg:col-span-2">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") loadList() }}
                  placeholder="Buscar por título ou descrição…"
                  className="ls-input pl-9 text-sm"
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ls-input text-sm">
                <option value="Todos">Todos status</option>
                {SUGGESTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ls-input text-sm">
                <option value="Todas">Todas categorias</option>
                {SUGGESTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ls-input text-sm" title="De" />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ls-input text-sm" title="Até" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button onClick={loadList} className="ls-button-secondary h-9 px-4 text-xs">Aplicar busca</button>
              {hasFilters && (
                <button
                  onClick={() => { setStatusFilter("Todos"); setCategoryFilter("Todas"); setFrom(""); setTo(""); setQ("") }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                >
                  <RotateCcw size={12} /> Limpar filtros
                </button>
              )}
            </div>
          </section>
        </Reveal>

        {/* Lista */}
        <Reveal delay={0.08}>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-100" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="ls-card flex flex-col items-center justify-center p-12 text-center">
              <Lightbulb size={28} className="mb-3 text-[#00A859]" />
              <p className="text-sm font-bold text-[color:var(--foreground)]">Nenhuma sugestão encontrada</p>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">Ajuste os filtros ou aguarde novos envios.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openDetail(s.id)}
                  className="group flex flex-col rounded-2xl border border-[color:var(--hairline)] bg-white p-4 text-left shadow-[var(--shadow-sm)] transition hover:border-[#00A859]/35 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 text-sm font-black text-[#111827]">{s.title}</h3>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{s.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-[#00A859]">{s.category}</span>
                    {s.sectorName && <span>· {s.sectorName}</span>}
                    <span className="inline-flex items-center gap-1">
                      <User size={11} /> {s.isAnonymous ? "Anônimo" : s.author || "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={11} /> {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    {s.attachments?.length > 0 && <span>· {s.attachments.length} anexo(s)</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      {/* Detalhe */}
      {selected && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-6" onClick={() => setSelected(null)}>
          <div className="my-4 w-full max-w-2xl rounded-[1.5rem] border border-[color:var(--hairline)] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-[color:var(--hairline)] p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="text-xs font-semibold text-[#00A859]">{selected.category}</span>
                </div>
                <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#111827]">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Meta label="Enviada por" value={selected.isAnonymous ? "Anônimo" : selected.author || "—"} />
                <Meta label="Setor" value={selected.sectorName || "—"} />
                <Meta label="Data" value={new Date(selected.createdAt).toLocaleString("pt-BR")} />
              </div>

              <Field label="Problema / ideia">{selected.description}</Field>
              {selected.improvement && <Field label="Como poderia melhorar">{selected.improvement}</Field>}

              {selected.attachments?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Anexos</p>
                  <AttachmentGallery
                    attachments={selected.attachments}
                    buildPath={(a) => `/suggestions/${selected.id}/attachments/${a.id}`}
                    onRemove={(a) => removeAttachment(a.id)}
                  />
                </div>
              )}

              {/* Área administrativa */}
              <div className="rounded-2xl border border-[#DDE7E2] bg-[#F8FCFA] p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#073B2A]">Área administrativa</p>
                <div className="grid gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Status</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="ls-input mt-1 text-sm">
                      {SUGGESTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Observação interna <span className="font-medium text-slate-400">(não visível ao funcionário)</span></label>
                    <Textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Anotações da análise, próximos passos, decisão…"
                      className="mt-1 min-h-[90px] rounded-2xl border-[#DDE7E2] bg-white text-sm text-slate-950 focus:border-[#00A859]"
                    />
                  </div>
                  <Button onClick={saveChanges} disabled={saving} className="h-11 rounded-xl bg-[#00A859] font-bold text-white hover:bg-[#07934E] disabled:opacity-50">
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#DDE7E2] bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-[#111827]" title={value}>{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="whitespace-pre-wrap break-words rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 text-sm leading-6 text-[#111827]">{children}</p>
    </div>
  )
}
