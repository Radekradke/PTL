import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface CollapsibleProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  className = "",
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`rounded-3xl border border-zinc-800 bg-zinc-900/70 overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 sm:px-6 hover:bg-zinc-800/30 transition-colors"
      >
        <h3 className="text-sm font-semibold text-zinc-200 text-left">
          {title}
        </h3>
        <ChevronDown
          className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-zinc-800 px-4 py-4 sm:px-6">
          {children}
        </div>
      )}
    </div>
  )
}
