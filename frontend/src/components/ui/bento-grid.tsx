import type { ElementType, ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid w-full auto-rows-[13rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {children}
    </div>
  )
}

export function BentoCard({
  name,
  description,
  cta = "Abrir",
  Icon,
  onClick,
  className,
  background,
  tone = "light",
}: {
  name: string
  description: string
  cta?: string
  Icon: ElementType
  onClick?: () => void
  className?: string
  background?: ReactNode
  tone?: "light" | "dark"
}) {
  const dark = tone === "dark"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] text-left transition-all duration-300",
        dark
          ? "ls-card-dark hover:shadow-[var(--shadow-md)]"
          : "border border-[color:var(--hairline)] bg-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {background && <div className="pointer-events-none absolute inset-0">{background}</div>}

      <div className="pointer-events-none relative z-10 flex flex-col gap-1 p-6 transition-transform duration-300 group-hover:-translate-y-8">
        <span
          className={cn(
            "flex h-11 w-11 origin-left items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-90",
            dark
              ? "bg-white/10 text-[#39D98A] ring-white/15"
              : "bg-[color:var(--accent)] text-[#00A859] ring-[#00A859]/15",
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </span>
        <h3 className={cn("mt-3 text-lg font-bold tracking-tight", dark ? "text-white" : "text-[color:var(--foreground)]")}>
          {name}
        </h3>
        <p className={cn("max-w-md text-sm leading-6", dark ? "text-emerald-100/70" : "text-[color:var(--muted-foreground)]")}>
          {description}
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-0 z-10 flex w-full translate-y-8 items-center p-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", dark ? "text-[#39D98A]" : "text-[#07934E]")}>
          {cta}
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-0 transition-colors duration-300",
          dark ? "group-hover:bg-white/[0.04]" : "group-hover:bg-[#00A859]/[0.03]",
        )}
      />
    </button>
  )
}
